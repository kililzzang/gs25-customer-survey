-- 물빛(Mulbit) — 0018: 액티비티별 리더보드/점수 원장 + 안전정보 템플릿 (3/5)
-- ------------------------------------------------------------------

-- reports/score_events에 어떤 액티비티에 대한 기여인지 기록 (기존 row는 null = 미지정,
-- 스노클링 위주로 쌓인 과거 데이터라 실질적으로 snorkeling으로 취급해도 무방)
alter table reports add column activity activity_type;
alter table score_events add column activity activity_type;

-- ------------------------------------------------------------------
-- leaderboard_scores — 액티비티별 서브 트랙 추가
-- activity를 nullable 대신 'all'을 포함한 text로 둬서(전체 합산 트랙) unique 제약과
-- ON CONFLICT를 단순하게 유지합니다 ("서핑 스팟 발굴왕" = track='core' AND activity='surfing').
-- ------------------------------------------------------------------

alter table leaderboard_scores
  add column activity text not null default 'all'
  check (activity in ('all', 'snorkeling', 'sea_swimming', 'surfing', 'freediving', 'scuba'));

alter table leaderboard_scores drop constraint if exists leaderboard_scores_user_id_track_period_key;
alter table leaderboard_scores add constraint leaderboard_scores_user_id_track_period_activity_key
  unique (user_id, track, period, activity);

comment on column leaderboard_scores.activity is
  '''all''이면 액티비티 무관 전체 합산(기존 동작과 동일), 그 외 값이면 해당 액티비티'
  ' 서브 트랙(예: 서핑 스팟 발굴왕 = track=core, activity=surfing).';

-- ------------------------------------------------------------------
-- 제보 승인 시 점수 적립 트리거 — activity 전파
-- ------------------------------------------------------------------

create or replace function award_score_on_report_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_hidden boolean;
  v_event score_event_type;
  v_points numeric;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    if new.type = 'new_spot' then
      select is_hidden into v_is_hidden from spots where id = new.spot_id;
      if coalesce(v_is_hidden, (new.payload->>'is_hidden')::boolean, false) then
        v_event := 'hidden_discovery'; v_points := 5;
      else
        v_event := 'new_spot'; v_points := 1;
      end if;
    elsif new.type in ('detail_route', 'detail_parking') then
      v_event := 'detail_first'; v_points := 3;
    else
      v_event := null;
    end if;

    if v_event is not null then
      insert into score_events (user_id, spot_id, event_type, points, report_id, activity)
      values (new.reporter_id, new.spot_id, v_event, v_points, new.id, new.activity);
    end if;
  end if;

  return new;
end;
$$;

-- ------------------------------------------------------------------
-- refresh_leaderboard_scores — 전체 합산('all') + 액티비티별 서브 트랙 함께 집계
-- ------------------------------------------------------------------

create or replace function refresh_leaderboard_scores(p_period text default 'all_time')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 일반 트랙: 업로드 수 + 좋아요 수 (액티비티 구분 없이 'all'만 사용, 기존과 동일)
  insert into leaderboard_scores (user_id, track, period, activity, score, breakdown, updated_at)
  select
    up.uploader_id, 'general', p_period, 'all',
    (up.upload_count + coalesce(lk.like_count, 0)),
    jsonb_build_object('uploads', up.upload_count, 'likes_received', coalesce(lk.like_count, 0)),
    now()
  from (
    select uploader_id, count(*) as upload_count
    from spot_photos
    where uploader_id is not null
    group by uploader_id
  ) up
  left join (
    select s.first_reporter_id as user_id, sum(s.like_count) as like_count
    from spots s
    where s.first_reporter_id is not null
    group by s.first_reporter_id
  ) lk on lk.user_id = up.uploader_id
  on conflict (user_id, track, period, activity)
  do update set score = excluded.score, breakdown = excluded.breakdown, updated_at = now();

  -- 핵심 트랙: 전체 합산('all')
  insert into leaderboard_scores (user_id, track, period, activity, score, breakdown, updated_at)
  select se.user_id, 'core', p_period, 'all', sum(se.points), jsonb_object_agg(se.event_type, se.type_total), now()
  from (
    select user_id, event_type, sum(points) as type_total
    from score_events
    group by user_id, event_type
  ) se
  group by se.user_id
  on conflict (user_id, track, period, activity)
  do update set score = excluded.score, breakdown = excluded.breakdown, updated_at = now();

  -- 핵심 트랙: 액티비티별 서브 트랙 (activity가 기록된 score_events만 대상)
  insert into leaderboard_scores (user_id, track, period, activity, score, breakdown, updated_at)
  select se.user_id, 'core', p_period, se.activity::text, sum(se.points), jsonb_object_agg(se.event_type, se.type_total), now()
  from (
    select user_id, activity, event_type, sum(points) as type_total
    from score_events
    where activity is not null
    group by user_id, activity, event_type
  ) se
  group by se.user_id, se.activity
  on conflict (user_id, track, period, activity)
  do update set score = excluded.score, breakdown = excluded.breakdown, updated_at = now();

  -- 순위 재계산 (트랙 x 액티비티 조합별로 독립 순위)
  with ranked as (
    select id, rank() over (partition by track, activity, period order by score desc) as r
    from leaderboard_scores
    where period = p_period
  )
  update leaderboard_scores l
    set rank = ranked.r
  from ranked
  where l.id = ranked.id;
end;
$$;

-- ------------------------------------------------------------------
-- activity_safety_templates — 액티비티별 안전정보 템플릿 (정적 참조 데이터)
-- 스팟별 spot_safety_info.current_warning은 그대로 유지, 그 위에 이 템플릿을 병기합니다.
-- ------------------------------------------------------------------

create table activity_safety_templates (
  activity activity_type primary key,
  title text not null,
  body text not null
);

alter table activity_safety_templates enable row level security;

create policy "activity safety templates publicly readable" on activity_safety_templates
  for select using (true);

insert into activity_safety_templates (activity, title, body) values
  ('snorkeling', '조류 경고', '조류가 강한 날은 입수를 자제하고, 반드시 구조 튜브·부이를 착용하세요.'),
  ('sea_swimming', '조류 경고', '이안류(역조류) 발생 시 당황하지 말고 해안과 평행하게 헤엄쳐 빠져나오세요.'),
  ('surfing', '리프/암초 주의', '간조 시 리프 브레이크 지형은 수심이 얕아질 수 있습니다. 핀 부상에 유의하세요.'),
  ('freediving', '블랙아웃 위험', '얕은물 블랙아웃(shallow water blackout)은 예고 없이 발생합니다. 반드시 버디와 동행하고 혼자 잠수하지 마세요.'),
  ('scuba', '감압병·비상상승 절차', '무감압한계(NDL)를 넘기지 말고, 상승 시 분당 9m 이하로 천천히 상승하며 안전정지(5m, 3분)를 지키세요. 감압병 의심 증상 발생 시 즉시 최인접 고압산소 치료 시설로 이동하세요.')
on conflict (activity) do nothing;

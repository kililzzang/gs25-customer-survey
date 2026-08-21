-- 물빛(Mulbit) — 0004: 제보 승인 시 점수 적립, 리더보드 집계, 스토리지 버킷
-- ------------------------------------------------------------------

-- ------------------------------------------------------------------
-- 제보 승인 시 자동 점수 적립
--   일반 스팟 제보 1점 / 히든 스팟 신규 발굴 5점 / 상세 접근정보 최초 기재 3점
--   타 유저 검증("정확했어요") +1점
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
      insert into score_events (user_id, spot_id, event_type, points, report_id)
      values (new.reporter_id, new.spot_id, v_event, v_points, new.id);
    end if;
  end if;

  return new;
end;
$$;

create trigger reports_award_score
  after update on reports
  for each row execute function award_score_on_report_approval();

create or replace function award_score_on_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_accurate then
    insert into score_events (user_id, spot_id, event_type, points)
    select first_reporter_id, new.spot_id, 'verification', 1
    from spots where id = new.spot_id and first_reporter_id is not null;
  end if;
  return new;
end;
$$;

create trigger verifications_award_score
  after insert on spot_verifications
  for each row execute function award_score_on_verification();

-- ------------------------------------------------------------------
-- 리더보드 집계 (배치/cron에서 주기 호출)
--   일반 트랙 = 업로드 수 + 좋아요 수 기반
--   핵심 트랙 = score_events(히든발굴/상세기여) 가중 합산 + 검증 보너스
-- ------------------------------------------------------------------

create or replace function refresh_leaderboard_scores(p_period text default 'all_time')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 일반 트랙: 업로드 수 * 1 + 받은 좋아요 수 * 1
  insert into leaderboard_scores (user_id, track, period, score, breakdown, updated_at)
  select
    up.uploader_id,
    'general',
    p_period,
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
  on conflict (user_id, track, period)
  do update set score = excluded.score, breakdown = excluded.breakdown, updated_at = now();

  -- 핵심 트랙: score_events 합산 (히든발굴/상세기여/검증 보너스)
  insert into leaderboard_scores (user_id, track, period, score, breakdown, updated_at)
  select
    se.user_id,
    'core',
    p_period,
    sum(se.points),
    jsonb_object_agg(se.event_type, se.type_total),
    now()
  from (
    select user_id, event_type, sum(points) as type_total
    from score_events
    group by user_id, event_type
  ) se
  group by se.user_id
  on conflict (user_id, track, period)
  do update set score = excluded.score, breakdown = excluded.breakdown, updated_at = now();

  -- 순위 재계산
  with ranked as (
    select id, rank() over (partition by track, period order by score desc) as r
    from leaderboard_scores
    where period = p_period
  )
  update leaderboard_scores l
    set rank = ranked.r
  from ranked
  where l.id = ranked.id;
end;
$$;

comment on function refresh_leaderboard_scores is '배치(cron)에서 주기 호출: 2트랙 리더보드 집계 갱신';

-- ------------------------------------------------------------------
-- 스토리지 버킷: 스팟 제보 사진
-- ------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('spot-photos', 'spot-photos', true)
on conflict (id) do nothing;

create policy "spot photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'spot-photos');

create policy "authenticated users can upload spot photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'spot-photos');

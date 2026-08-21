-- 물빛(Mulbit) — 0003: RLS 정책, 잠금정보 열람 RPC, 자동화 함수
-- ------------------------------------------------------------------

-- ------------------------------------------------------------------
-- 헬퍼 함수
-- ------------------------------------------------------------------

create or replace function is_premium_member(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from memberships
    where user_id = p_user_id
      and plan = 'premium'
      and status = 'active'
      and (current_period_end is null or current_period_end > now())
  );
$$;

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger spots_touch_updated_at before update on spots
  for each row execute function touch_updated_at();
create trigger profiles_touch_updated_at before update on profiles
  for each row execute function touch_updated_at();
create trigger memberships_touch_updated_at before update on memberships
  for each row execute function touch_updated_at();

-- 좋아요 수 동기화
create or replace function sync_spot_like_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update spots set like_count = like_count + 1 where id = new.spot_id;
  elsif tg_op = 'DELETE' then
    update spots set like_count = greatest(like_count - 1, 0) where id = old.spot_id;
  end if;
  return null;
end;
$$;

create trigger likes_sync_count
  after insert or delete on likes
  for each row execute function sync_spot_like_count();

-- ------------------------------------------------------------------
-- RLS 활성화
-- ------------------------------------------------------------------

alter table profiles enable row level security;
alter table user_titles enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table spots enable row level security;
alter table spot_locked_info enable row level security;
alter table spot_safety_info enable row level security;
alter table spot_photos enable row level security;
alter table partner_listings enable row level security;
alter table reports enable row level security;
alter table spot_verifications enable row level security;
alter table spot_flags enable row level security;
alter table score_events enable row level security;
alter table leaderboard_scores enable row level security;
alter table likes enable row level security;
alter table visit_stamps enable row level security;
alter table challenges enable row level security;
alter table challenge_participants enable row level security;
alter table ad_unlocks enable row level security;
alter table notifications enable row level security;
alter table memberships enable row level security;

-- ------------------------------------------------------------------
-- 공개 읽기 정책 (무료 공개 데이터)
-- ------------------------------------------------------------------

create policy "profiles are publicly readable" on profiles for select using (true);
create policy "profiles self update" on profiles for update using (auth.uid() = id);

create policy "badges are publicly readable" on badges for select using (true);
create policy "user_badges are publicly readable" on user_badges for select using (true);
create policy "user_titles are publicly readable" on user_titles for select using (true);

create policy "verified/pending spots publicly readable" on spots
  for select using (status in ('verified', 'pending', 'needs_update'));

create policy "safety info always publicly readable" on spot_safety_info
  for select using (true); -- 게이트 예외: 응급연락처/조류경고는 항상 무료 공개

create policy "spot photos publicly readable" on spot_photos for select using (true);
create policy "active partner listings publicly readable" on partner_listings
  for select using (is_active);

create policy "challenges publicly readable" on challenges for select using (true);

create policy "leaderboard publicly readable" on leaderboard_scores for select using (true);

-- spot_locked_info: 직접 SELECT 불가. unlock_spot_details() RPC로만 조회.
create policy "locked info not directly selectable" on spot_locked_info
  for select using (false);

-- ------------------------------------------------------------------
-- 인증 사용자 쓰기 정책
-- ------------------------------------------------------------------

create policy "authenticated users can create reports" on reports
  for insert to authenticated with check (auth.uid() = reporter_id);
create policy "users can view their own reports" on reports
  for select using (auth.uid() = reporter_id);

create policy "authenticated users can upload photos" on spot_photos
  for insert to authenticated with check (auth.uid() = uploader_id);

create policy "authenticated users can verify spots" on spot_verifications
  for insert to authenticated with check (auth.uid() = user_id);
create policy "verifications publicly readable" on spot_verifications
  for select using (true);

create policy "authenticated users can flag spots" on spot_flags
  for insert to authenticated with check (auth.uid() = reporter_id);

create policy "users can like spots" on likes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users can unlike own likes" on likes
  for delete using (auth.uid() = user_id);
create policy "likes publicly readable" on likes for select using (true);

create policy "users manage own visit stamps" on visit_stamps
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own challenge participation" on challenge_participants
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users view own ad unlocks" on ad_unlocks
  for select using (auth.uid() = user_id);
create policy "users create own ad unlocks" on ad_unlocks
  for insert to authenticated with check (auth.uid() = user_id);

create policy "users view own notifications" on notifications
  for select using (auth.uid() = user_id);
create policy "users update own notifications" on notifications
  for update using (auth.uid() = user_id);

create policy "users view own membership" on memberships
  for select using (auth.uid() = user_id);

create policy "users view own score events" on score_events
  for select using (auth.uid() = user_id);

-- ------------------------------------------------------------------
-- unlock_spot_details — 잠금정보 열람 RPC
-- 광고 시청 완료(ad_unlocks) 또는 프리미엄 멤버십이면 잠금정보 반환
-- ------------------------------------------------------------------

create or replace function unlock_spot_details(p_spot_id uuid)
returns table (
  exact_lat double precision,
  exact_lng double precision,
  access_route text,
  parking_tip text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not is_premium_member(auth.uid()) and not exists (
    select 1 from ad_unlocks
    where user_id = auth.uid()
      and spot_id = p_spot_id
      and expires_at > now()
  ) then
    raise exception 'unlock required: watch a rewarded ad or upgrade to premium';
  end if;

  return query
    select sli.exact_lat, sli.exact_lng, sli.access_route, sli.parking_tip
    from spot_locked_info sli
    where sli.spot_id = p_spot_id;
end;
$$;

-- ------------------------------------------------------------------
-- 데이터 검증 자동화 (배치/엣지 함수에서 호출)
-- ------------------------------------------------------------------

-- 1) EXIF GPS vs 신고 좌표 오차 검증
create or replace function verify_photo_gps(
  p_photo_id uuid,
  p_threshold_m numeric default 150
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_spot_lat double precision;
  v_spot_lng double precision;
  v_exif_lat double precision;
  v_exif_lng double precision;
  v_delta_m numeric;
begin
  select sp.exif_lat, sp.exif_lng, s.approx_lat, s.approx_lng
    into v_exif_lat, v_exif_lng, v_spot_lat, v_spot_lng
  from spot_photos sp
  join spots s on s.id = sp.spot_id
  where sp.id = p_photo_id;

  if v_exif_lat is null or v_exif_lng is null then
    update spot_photos set gps_verified = null where id = p_photo_id;
    return;
  end if;

  -- 단순 haversine 근사 (미터)
  v_delta_m := 111320 * sqrt(
    power(v_spot_lat - v_exif_lat, 2) +
    power((v_spot_lng - v_exif_lng) * cos(radians(v_spot_lat)), 2)
  );

  update spot_photos
    set exif_gps_delta_m = v_delta_m,
        gps_verified = (v_delta_m <= p_threshold_m)
    where id = p_photo_id;
end;
$$;

-- 2) 동일 좌표 반경 클러스터링 → 임계 건수 이상 일치 시 자동 "검증됨" 승격
create or replace function promote_spots_by_cluster(
  p_radius_m numeric default 100,
  p_min_reports integer default 3
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promoted integer := 0;
begin
  with clustered as (
    select spot_id, count(*) as report_count
    from reports
    where type = 'new_spot' and status = 'pending'
    group by spot_id
    having count(*) >= p_min_reports
  )
  update spots s
    set status = 'verified', last_verified_at = now(), trust_score = least(trust_score + 20, 100)
  from clustered c
  where s.id = c.spot_id and s.status = 'pending';

  get diagnostics v_promoted = row_count;
  return v_promoted;
end;
$$;

-- 3) 경과일 기반 신뢰도 자동 감쇠 → 임계값 이하 시 "갱신 필요" 배지
create or replace function apply_trust_decay(
  p_days_threshold integer default 180,
  p_decay_per_run numeric default 5,
  p_needs_update_below numeric default 40
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_affected integer;
begin
  update spots
    set trust_score = greatest(trust_score - p_decay_per_run, 0)
  where status in ('verified', 'needs_update')
    and last_verified_at < now() - (p_days_threshold || ' days')::interval;

  update spots
    set status = 'needs_update'
  where status = 'verified'
    and trust_score < p_needs_update_below;

  get diagnostics v_affected = row_count;
  return v_affected;
end;
$$;

-- 4) 오보 신고 누적 임계치 초과 → 자동 비공개 전환 + 재검증 큐 등록
create or replace function auto_hide_flagged_spots(
  p_flag_threshold integer default 5
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hidden integer := 0;
  v_spot record;
begin
  for v_spot in
    select spot_id, count(*) as flag_count
    from spot_flags
    where created_at > now() - interval '30 days'
    group by spot_id
    having count(*) >= p_flag_threshold
  loop
    update spots set status = 'hidden' where id = v_spot.spot_id and status <> 'hidden';

    insert into reports (spot_id, reporter_id, type, payload, status)
    select v_spot.spot_id, first_reporter_id, 'revalidation', '{}'::jsonb, 'pending'
    from spots where id = v_spot.spot_id
    on conflict do nothing;

    v_hidden := v_hidden + 1;
  end loop;

  return v_hidden;
end;
$$;

-- 5) 유저 신뢰도(검증 통과율) 재스코어링
create or replace function recompute_user_trust_scores()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_affected integer;
begin
  with stats as (
    select
      r.reporter_id as user_id,
      count(*) filter (where r.status = 'approved')::numeric as approved,
      count(*)::numeric as total
    from reports r
    where r.status in ('approved', 'rejected')
    group by r.reporter_id
  )
  update profiles p
    set trust_score = least(greatest(round(50 + (stats.approved / nullif(stats.total, 0) - 0.5) * 100), 0), 100)
  from stats
  where p.id = stats.user_id;

  get diagnostics v_affected = row_count;
  return v_affected;
end;
$$;

comment on function verify_photo_gps is '업로드 트리거/엣지 함수에서 사진 등록 직후 호출';
comment on function promote_spots_by_cluster is '배치(cron)에서 주기 호출: 동일 좌표 반경 다중 제보 클러스터링 자동 승격';
comment on function apply_trust_decay is '배치(cron)에서 주기 호출: 경과일 기반 신뢰도 감쇠';
comment on function auto_hide_flagged_spots is '배치(cron)에서 주기 호출: 오보 신고 누적 자동 비공개 + 재검증 큐';
comment on function recompute_user_trust_scores is '배치(cron)에서 주기 호출: 유저 신뢰도 재계산';

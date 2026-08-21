-- 물빛(Mulbit) — 0012: 3단계 참여형/고급 기능 스키마
-- 체크인(20)/생물도감(23)/접근로 변경이력(28)은 외부 서비스 없이 바로 동작합니다.
-- 나머지(19,21,22,25,26,27,29,30)는 스토리지/리얼타임/AR 등 무거운 인프라가 필요해
-- 스키마만 준비하고 feature_flags는 비활성 상태로 둡니다 (추후 연결).
-- ------------------------------------------------------------------

-- ------------------------------------------------------------------
-- spot_checkins — "오늘 여기 있어요" 체크인 → 실시간 방문자 수 (20)
-- 외부 API 불필요. Supabase 테이블 카운트만으로 동작합니다.
-- ------------------------------------------------------------------

create table spot_checkins (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '4 hours'),
  unique (spot_id, user_id)
);

create index spot_checkins_spot_active_idx on spot_checkins (spot_id, expires_at);

alter table spot_checkins enable row level security;

create policy "checkins are publicly readable" on spot_checkins
  for select using (true);

create policy "authenticated users can check in" on spot_checkins
  for insert to authenticated with check (auth.uid() = user_id);

create policy "users can update own checkin (연장)" on spot_checkins
  for update using (auth.uid() = user_id);

create policy "users can remove own checkin" on spot_checkins
  for delete using (auth.uid() = user_id);

comment on table spot_checkins is
  '"오늘 여기 있어요" 체크인. expires_at 이전 row 수 = 실시간 혼잡도(방문자 수) 근사치.';

-- ------------------------------------------------------------------
-- species / spot_species — 수중 생물 도감 연동 (23)
-- 외부 API 불필요. 관리자가 채우는 참조 테이블 + 스팟별 태깅.
-- ------------------------------------------------------------------

create table species (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scientific_name text,
  category text, -- 예: '어류' | '산호' | '연체동물' | '갑각류'
  icon text,
  created_at timestamptz not null default now()
);

create table spot_species (
  spot_id uuid not null references spots (id) on delete cascade,
  species_id uuid not null references species (id) on delete cascade,
  frequency text, -- 'common' | 'occasional' | 'rare'
  primary key (spot_id, species_id)
);

alter table species enable row level security;
alter table spot_species enable row level security;

create policy "species are publicly readable" on species for select using (true);
create policy "spot species are publicly readable" on spot_species for select using (true);

-- ------------------------------------------------------------------
-- spot_photos — 계절별 사진 비교 슬라이더용 촬영월 (24)
-- 외부 API 불필요. 기존 업로드 사진에 촬영월만 추가.
-- ------------------------------------------------------------------

alter table spot_photos add column season_month smallint check (season_month between 1 and 12);

-- ------------------------------------------------------------------
-- spot_access_step_revisions — 접근로 변경 이력 타임라인 (28)
-- 외부 API 불필요. 공사/재해로 스텝이 바뀔 때 이전 버전을 아카이브.
-- (지금은 유저 편집 UI가 없어 관리자가 수동으로 채우는 구조 — 읽기 UI만 우선 제공)
-- ------------------------------------------------------------------

create table spot_access_step_revisions (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots (id) on delete cascade,
  reason text not null, -- 예: '2026년 8월 태풍으로 계단 유실, 우회로로 변경'
  snapshot jsonb not null, -- 변경 전 spot_access_steps 스냅샷
  changed_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index spot_access_step_revisions_spot_id_idx on spot_access_step_revisions (spot_id, created_at desc);

alter table spot_access_step_revisions enable row level security;

create policy "access step revisions are publicly readable" on spot_access_step_revisions
  for select using (true);

-- ------------------------------------------------------------------
-- 아래부터는 스토리지/리얼타임/AR 등 무거운 인프라가 필요해 스키마만 준비합니다.
-- feature_flags에서 비활성 상태이며, UI는 아직 붙이지 않습니다 (추후 연결).
-- ------------------------------------------------------------------

-- 진입로 숏폼 영상 업로드 (19)
create table spot_entry_videos (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots (id) on delete cascade,
  uploader_id uuid references profiles (id) on delete set null,
  storage_path text not null,
  duration_seconds smallint check (duration_seconds <= 15),
  created_at timestamptz not null default now()
);

-- 360도 파노라마 사진 (22)
create table spot_panoramas (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots (id) on delete cascade,
  uploader_id uuid references profiles (id) on delete set null,
  storage_path text not null,
  captured_at date,
  created_at timestamptz not null default now()
);

-- 동행자 위치 공유 임시 링크 (21) — 옵트인, 스노클링 중 육상 동행자용
create table companion_share_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  spot_id uuid not null references spots (id) on delete cascade,
  creator_id uuid not null references profiles (id) on delete cascade,
  last_lat double precision,
  last_lng double precision,
  last_updated_at timestamptz,
  expires_at timestamptz not null default (now() + interval '6 hours'),
  created_at timestamptz not null default now()
);

comment on table companion_share_links is
  '옵트인 임시 위치 공유 링크. 토큰 소유자만 조회 가능하도록 애플리케이션 레이어에서 제어'
  ' (RLS는 생성자만 직접 조회하도록 최소 제한, 토큰 기반 공개 열람은 서버 라우트 경유 예정).';

alter table companion_share_links enable row level security;

create policy "creator can manage own share link" on companion_share_links
  for all using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

-- 실시간 인근 방문자 지도 (30) — 옵트인
create table user_live_locations (
  user_id uuid primary key references profiles (id) on delete cascade,
  spot_id uuid references spots (id) on delete set null,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours')
);

alter table user_live_locations enable row level security;

create policy "users manage own live location" on user_live_locations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "live locations visible to authenticated users (opt-in)" on user_live_locations
  for select to authenticated using (expires_at > now());

-- 오프라인 지도 저장 (25) — 프리미엄 전용, 다운로드 요청 로그
create table offline_map_downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  region region_code not null,
  requested_at timestamptz not null default now()
);

alter table offline_map_downloads enable row level security;

create policy "users view own offline downloads" on offline_map_downloads
  for select using (auth.uid() = user_id);
create policy "premium users request offline downloads" on offline_map_downloads
  for insert to authenticated with check (auth.uid() = user_id and is_premium_member(auth.uid()));

-- 위성사진 갱신 감지 → 관리자 재검증 알림 (29)
create type satellite_flag_status as enum ('pending', 'reviewing', 'resolved');

create table satellite_change_flags (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots (id) on delete cascade,
  detected_at timestamptz not null default now(),
  status satellite_flag_status not null default 'pending',
  detail text,
  reviewed_by uuid references profiles (id) on delete set null,
  reviewed_at timestamptz
);

comment on table satellite_change_flags is
  '위성사진 정기 비교(외부 이미지 API, 추후 연결)에서 유의미한 변경 감지 시 자동 생성.'
  ' 관리자가 검토 후 status를 갱신.';

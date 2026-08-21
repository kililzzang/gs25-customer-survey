-- 물빛(Mulbit) — 0001: 확장, enum, 프로필, 스팟 핵심 테이블
-- ------------------------------------------------------------------

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------
-- ENUM 타입
-- ------------------------------------------------------------------

create type region_code as enum (
  'gyeonggi',   -- 경기
  'gangwon',    -- 강원
  'chungcheong',-- 충청
  'gyeongbuk',  -- 경상북도
  'gyeongnam',  -- 경상남도
  'jeolla',     -- 전라
  'jeju',       -- 제주
  'overseas'    -- 국외
);

create type spot_status as enum (
  'pending',      -- 검토 대기
  'verified',     -- 검증됨
  'needs_update', -- 신뢰도 감쇠로 갱신 필요
  'hidden',       -- 오보 누적으로 비공개 전환
  'rejected'      -- 반려
);

create type current_level as enum ('calm', 'moderate', 'strong', 'unknown');

create type guide_tier as enum ('newbie', 'explorer', 'local_guide', 'master');

create type membership_plan as enum ('free', 'premium');

create type membership_status as enum ('active', 'canceled', 'past_due', 'none');

-- ------------------------------------------------------------------
-- profiles — auth.users 확장
-- ------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  avatar_url text,
  bio text,
  trust_score numeric not null default 50 check (trust_score >= 0 and trust_score <= 100),
  guide_tier guide_tier not null default 'newbie',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column profiles.trust_score is '과거 검증 통과율 기반 자동 스코어링(0~100). 고신뢰 유저는 제보 즉시 반영.';

create table user_titles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  title_key text not null, -- 예: 'first_discoverer'
  spot_id uuid, -- 어떤 스팟으로 획득했는지 (FK는 spots 생성 후 아래에서 추가)
  awarded_at timestamptz not null default now(),
  unique (user_id, title_key, spot_id)
);

create table badges (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  icon text
);

create table user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  badge_id uuid not null references badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- ------------------------------------------------------------------
-- spots — 공개 핵심 정보
-- ------------------------------------------------------------------

create table spots (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  region region_code not null,
  description text,

  -- 공개용 대략 좌표 (의도적으로 살짝 지터링하여 노출)
  approx_lat double precision not null,
  approx_lng double precision not null,

  -- 다이빙 게이지 데이터
  depth_min_m numeric,
  depth_max_m numeric,
  visibility_m numeric,
  current_level current_level not null default 'unknown',
  water_temp_c numeric,

  is_hidden boolean not null default false, -- 히든 스팟 뱃지
  status spot_status not null default 'pending',
  trust_score numeric not null default 50 check (trust_score >= 0 and trust_score <= 100),
  last_verified_at timestamptz,

  like_count integer not null default 0,
  first_reporter_id uuid references profiles (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_titles
  add constraint user_titles_spot_id_fkey
  foreign key (spot_id) references spots (id) on delete set null;

create index spots_region_idx on spots (region);
create index spots_status_idx on spots (status);
create index spots_is_hidden_idx on spots (is_hidden);

-- ------------------------------------------------------------------
-- spot_locked_info — 광고 게이트/멤버십 뒤에 숨는 정보 (RLS로 직접 SELECT 차단)
-- ------------------------------------------------------------------

create table spot_locked_info (
  spot_id uuid primary key references spots (id) on delete cascade,
  exact_lat double precision,
  exact_lng double precision,
  access_route text,
  parking_tip text,
  contributor_id uuid references profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- spot_safety_info — 게이트 예외, 항상 무료 공개
-- ------------------------------------------------------------------

create table spot_safety_info (
  spot_id uuid primary key references spots (id) on delete cascade,
  emergency_contacts jsonb not null default '[]'::jsonb, -- [{label, phone}]
  current_warning text,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- spot_photos — 업로드 사진 + EXIF GPS 자동 검증
-- ------------------------------------------------------------------

create table spot_photos (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots (id) on delete cascade,
  uploader_id uuid references profiles (id) on delete set null,
  storage_path text not null,
  exif_lat double precision,
  exif_lng double precision,
  exif_gps_delta_m numeric, -- 신고 좌표와의 오차(m)
  gps_verified boolean, -- null=검증 전, true/false=자동검증 결과
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index spot_photos_spot_id_idx on spot_photos (spot_id);

-- ------------------------------------------------------------------
-- partner_listings — 업체(장비대여/투어) 제휴 배너 · 예약 슬롯
-- ------------------------------------------------------------------

create table partner_listings (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid references spots (id) on delete cascade,
  partner_name text not null,
  listing_type text not null check (listing_type in ('rental', 'tour')),
  banner_url text,
  cta_url text,
  cta_label text default '예약하기',
  is_active boolean not null default true,
  priority integer not null default 0,
  created_at timestamptz not null default now()
);

create index partner_listings_spot_id_idx on partner_listings (spot_id) where is_active;

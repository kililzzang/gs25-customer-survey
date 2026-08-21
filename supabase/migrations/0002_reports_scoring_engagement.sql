-- 물빛(Mulbit) — 0002: 제보/검증/점수 + 참여 유도(인게이지먼트) + 비즈니스
-- ------------------------------------------------------------------

create type report_type as enum ('new_spot', 'detail_route', 'detail_parking', 'correction', 'revalidation');
create type report_status as enum ('pending', 'approved', 'rejected');
create type score_event_type as enum (
  'new_spot',          -- 일반 스팟 제보 1점
  'hidden_discovery',  -- 히든 스팟 신규 발굴 5점
  'detail_first',      -- 상세 접근정보 최초 기재 3점
  'verification'       -- 타 유저 검증(정확했어요) +1점
);
create type leaderboard_track as enum ('general', 'core');

-- ------------------------------------------------------------------
-- reports — 신규 스팟/상세정보 제보 및 정정
-- ------------------------------------------------------------------

create table reports (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid references spots (id) on delete cascade, -- null = 신규 스팟 제안
  reporter_id uuid not null references profiles (id) on delete cascade,
  type report_type not null,
  payload jsonb not null default '{}'::jsonb, -- 제안된 필드값 (이름/좌표/게이지/접근로 등)
  status report_status not null default 'pending',
  reviewed_by uuid references profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index reports_status_idx on reports (status);
create index reports_reporter_id_idx on reports (reporter_id);

-- ------------------------------------------------------------------
-- spot_verifications — "정확했어요" 타 유저 검증
-- ------------------------------------------------------------------

create table spot_verifications (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  is_accurate boolean not null,
  note text,
  created_at timestamptz not null default now(),
  unique (spot_id, user_id)
);

-- ------------------------------------------------------------------
-- spot_flags — 오보 신고 누적 (임계치 초과 시 자동 비공개 전환)
-- ------------------------------------------------------------------

create table spot_flags (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots (id) on delete cascade,
  reporter_id uuid references profiles (id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index spot_flags_spot_id_idx on spot_flags (spot_id);

-- ------------------------------------------------------------------
-- score_events — append-only 점수 원장 (감사 가능한 리더보드 소스)
-- ------------------------------------------------------------------

create table score_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  spot_id uuid references spots (id) on delete set null,
  event_type score_event_type not null,
  points numeric not null,
  report_id uuid references reports (id) on delete set null,
  created_at timestamptz not null default now()
);

create index score_events_user_id_idx on score_events (user_id);
create index score_events_created_at_idx on score_events (created_at);

-- ------------------------------------------------------------------
-- leaderboard_scores — 집계 결과 (배치/트리거로 갱신)
-- 일반 트랙: 업로드 수, 좋아요 수 기반
-- 핵심 트랙: 히든 스팟 발굴 + 상세정보 기여 가중치 반영
-- ------------------------------------------------------------------

create table leaderboard_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  track leaderboard_track not null,
  period text not null default 'all_time', -- 'all_time' | 'YYYY-MM'
  score numeric not null default 0,
  breakdown jsonb not null default '{}'::jsonb,
  rank integer,
  updated_at timestamptz not null default now(),
  unique (user_id, track, period)
);

create index leaderboard_scores_track_period_idx on leaderboard_scores (track, period, score desc);

-- ------------------------------------------------------------------
-- likes
-- ------------------------------------------------------------------

create table likes (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (spot_id, user_id)
);

-- ------------------------------------------------------------------
-- visit_stamps — 방문 스탬프 지도 (내가 방문한 곳 컬렉션)
-- ------------------------------------------------------------------

create table visit_stamps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  spot_id uuid not null references spots (id) on delete cascade,
  visited_at date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, spot_id)
);

-- ------------------------------------------------------------------
-- challenges — 챌린지 이벤트
-- ------------------------------------------------------------------

create table challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  region region_code,
  criteria jsonb not null default '{}'::jsonb, -- 예: {"type":"visit_count","target":5}
  reward_badge_id uuid references badges (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  joined_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

-- ------------------------------------------------------------------
-- ad_unlocks — 광고 시청 후 잠금 정보 열람 캐싱 (24시간)
-- ------------------------------------------------------------------

create table ad_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  spot_id uuid not null references spots (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  unique (user_id, spot_id)
);

create index ad_unlocks_expires_at_idx on ad_unlocks (expires_at);

-- ------------------------------------------------------------------
-- notifications — 제보 반영 알림 등
-- ------------------------------------------------------------------

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null, -- 'report_approved' | 'report_rejected' | 'badge_awarded' | ...
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_unread_idx on notifications (user_id) where read_at is null;

-- ------------------------------------------------------------------
-- memberships — 프리미엄 플랜 (광고 제거, 상세정보 즉시 열람)
-- ------------------------------------------------------------------

create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles (id) on delete cascade,
  plan membership_plan not null default 'free',
  status membership_status not null default 'none',
  current_period_end timestamptz,
  payment_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

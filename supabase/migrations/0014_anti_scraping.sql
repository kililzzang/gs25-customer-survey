-- 물빛(Mulbit) — 0014: 무단 크롤링/스크래핑 방지
-- 클라이언트 단 텍스트 복사방지(user-select 차단 등)는 넣지 않습니다 — 우회가 쉽고
-- UX만 저해합니다. 대신 API 레벨에서 실제로 강제되는 방어를 둡니다.
--
-- 이중 방어 구조:
--   1) 계정 기준 (신뢰 가능, 우회 불가) — unlock_spot_details RPC/GPX 다운로드처럼
--      실제 데이터를 반환하는 지점 내부에서 auth.uid() 기준으로 체크. DB 레벨이라
--      Supabase REST를 직접 호출해도 못 피합니다.
--   2) IP 기준 (보조 방어) — proxy.ts에서 스팟 상세 페이지/관련 API 경로에 대해
--      해시된 IP 기준으로 체크 (계정 생성 없이 접근하는 스크래핑을 억제).
-- ------------------------------------------------------------------

create table rate_limit_events (
  id bigint generated always as identity primary key,
  identity_key text not null, -- 'user:<uuid>' 또는 'ip:<sha256 해시>'
  path text,
  spot_id uuid references spots (id) on delete set null,
  created_at timestamptz not null default now()
);

create index rate_limit_events_identity_idx on rate_limit_events (identity_key, created_at desc);

comment on table rate_limit_events is
  'rate limit 판정을 위한 요청 로그. identity_key는 원문 IP를 저장하지 않고'
  ' 해시값만 저장합니다 (개인정보 최소화).';

create table anomaly_flags (
  id uuid primary key default gen_random_uuid(),
  identity_key text not null,
  reason text not null, -- 'rate_limit_exceeded' | 'sequential_scrape_pattern'
  metadata jsonb not null default '{}'::jsonb,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

create index anomaly_flags_unreviewed_idx on anomaly_flags (created_at desc) where not reviewed;

comment on table anomaly_flags is
  '이상 탐지 자동 플래그 (자동 차단이 아닌 관리자 검토용). 기존 자동화 배치'
  ' (auto_hide_flagged_spots, apply_trust_decay 등)와 동일한 패턴 — Postgres 함수 +'
  ' 테이블로 자동 기록하고, 실제 조치는 관리자가 검토 후 수행합니다.';

alter table rate_limit_events enable row level security;
alter table anomaly_flags enable row level security;
-- 두 테이블 모두 클라이언트 직접 조회/삽입 불가 — security definer 함수를 통해서만 기록.
-- (관리자 대시보드가 생기면 그때 service-role 또는 관리자 전용 SELECT 정책 추가)

-- ------------------------------------------------------------------
-- check_rate_limit — 계정/IP 공용 판정 함수
-- ------------------------------------------------------------------

create or replace function check_rate_limit(
  p_identity_key text,
  p_path text default null,
  p_spot_id uuid default null,
  p_limit_per_minute integer default 30
)
returns boolean -- true = 허용, false = 제한됨
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_distinct_spots integer;
begin
  select count(*) into v_count
  from rate_limit_events
  where identity_key = p_identity_key
    and created_at > now() - interval '1 minute';

  if v_count >= p_limit_per_minute then
    insert into anomaly_flags (identity_key, reason, metadata)
    values (p_identity_key, 'rate_limit_exceeded', jsonb_build_object('path', p_path, 'count', v_count));
    return false;
  end if;

  -- 짧은 시간 내 다수 스팟을 순차 조회하는 패턴(스크래핑 의심) 탐지
  if p_spot_id is not null then
    select count(distinct spot_id) into v_distinct_spots
    from rate_limit_events
    where identity_key = p_identity_key
      and spot_id is not null
      and created_at > now() - interval '5 minutes';

    if v_distinct_spots >= 15 then
      insert into anomaly_flags (identity_key, reason, metadata)
      values (
        p_identity_key, 'sequential_scrape_pattern',
        jsonb_build_object('distinct_spots_last_5min', v_distinct_spots)
      );
    end if;
  end if;

  insert into rate_limit_events (identity_key, path, spot_id) values (p_identity_key, p_path, p_spot_id);
  return true;
end;
$$;

comment on function check_rate_limit is
  '계정(user:<uuid>) 또는 IP 해시(ip:<hash>) 기준 분당 요청 제한 판정 + 기록.'
  ' 초과 시 anomaly_flags에 자동 기록(차단 아님, 관리자 검토용). 이 함수 자체는'
  ' anon 포함 누구나 호출 가능해야 하므로(IP 기반 체크가 비로그인 요청에도 걸려야 함)'
  ' EXECUTE 권한을 별도로 제한하지 않습니다.';

-- ------------------------------------------------------------------
-- unlock_spot_details RPC — 계정 기준 rate limit 적용 (분당 30건)
-- (0009에서 정의한 시그니처는 그대로 유지, 본문만 rate limit 체크 추가)
-- ------------------------------------------------------------------

create or replace function unlock_spot_details(p_spot_id uuid)
returns table (
  exact_lat double precision,
  exact_lng double precision,
  access_route text,
  parking_tip text,
  estimated_walk_minutes smallint,
  has_restroom boolean,
  has_shower boolean
)
language plpgsql
volatile -- check_rate_limit()가 rate_limit_events/anomaly_flags에 기록(side effect)하므로 stable 아님
security definer
set search_path = public
as $$
begin
  if not can_unlock_spot_details(p_spot_id) then
    raise exception 'unlock required: sign in to view exact location and access details';
  end if;

  if not check_rate_limit('user:' || auth.uid()::text, 'unlock_spot_details', p_spot_id, 30) then
    raise exception 'rate limit exceeded: too many detail views, please try again later';
  end if;

  return query
    select
      sli.exact_lat, sli.exact_lng, sli.access_route, sli.parking_tip,
      sli.estimated_walk_minutes, sli.has_restroom, sli.has_shower
    from spot_locked_info sli
    where sli.spot_id = p_spot_id;
end;
$$;

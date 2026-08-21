-- 물빛(Mulbit) — 0009: "정확한 위치와 접근 방법" 1단계
-- 단계별 접근 스텝, 주차 옵션 세분화, 화장실/샤워실, 응급시설, 리뷰 혼잡도 태그
-- ------------------------------------------------------------------

create type terrain_type as enum ('flat', 'stairs', 'rock', 'sand');
create type parking_type as enum ('free', 'paid');
create type crowd_tag as enum ('quiet', 'moderate', 'crowded');
create type emergency_facility_type as enum ('hospital', 'clinic', 'health_center');

-- ------------------------------------------------------------------
-- spot_access_steps — "① 주차장 도착 → ② 계단 30m 하강 → ③ 우측 진입" 스텝 카드
-- 잠금정보와 동일하게 로그인 게이트 적용 (can_unlock_spot_details, 0008 참고)
-- 좌표가 있는 스텝들을 순서대로 이으면 카카오맵 도보 경로 폴리라인이 됩니다.
-- ------------------------------------------------------------------

create table spot_access_steps (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots (id) on delete cascade,
  step_order smallint not null,
  title text not null,
  description text,
  photo_storage_path text,
  lat double precision,
  lng double precision,
  terrain_type terrain_type,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (spot_id, step_order)
);

create index spot_access_steps_spot_id_idx on spot_access_steps (spot_id, step_order);

comment on table spot_access_steps is
  '유저/관리자가 추가·편집 가능한 순서형 접근 스텝. 좌표가 있으면 지도 경로/로드뷰에도 사용.'
  ' 현재는 reports(type=detail_route) 제보를 검토 후 관리자가 반영하는 구조 (직접 공개 write 정책 없음).';

-- ------------------------------------------------------------------
-- spot_parking_options — 주차 정보 세분화 (무료/유료, 메인/대안)
-- ------------------------------------------------------------------

create table spot_parking_options (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots (id) on delete cascade,
  label text not null,
  parking_type parking_type not null default 'free',
  lat double precision,
  lng double precision,
  note text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index spot_parking_options_spot_id_idx on spot_parking_options (spot_id);

-- ------------------------------------------------------------------
-- spot_locked_info 확장 — 소요시간, 화장실/샤워실 유무
-- ------------------------------------------------------------------

alter table spot_locked_info
  add column estimated_walk_minutes smallint,
  add column has_restroom boolean,
  add column has_shower boolean;

comment on column spot_locked_info.estimated_walk_minutes is '주차장 → 포인트 예상 도보 소요시간(분)';

-- ------------------------------------------------------------------
-- spot_emergency_facilities — 최인접 응급실/보건소 (안전 정보, 게이트 예외)
-- 1단계는 관리자가 입력하는 정적 데이터. 공공 API 자동 연동은 2단계.
-- ------------------------------------------------------------------

create table spot_emergency_facilities (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots (id) on delete cascade,
  name text not null,
  phone text,
  facility_type emergency_facility_type not null default 'hospital',
  distance_km numeric,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

create index spot_emergency_facilities_spot_id_idx on spot_emergency_facilities (spot_id);

comment on table spot_emergency_facilities is
  '최인접 응급실/보건소. 안전 정보라 광고/로그인 게이트 예외 — 항상 무료 공개.'
  ' 1단계는 정적 입력, 2단계에서 공공 API 자동 갱신 예정.';

-- ------------------------------------------------------------------
-- spot_reviews — 혼잡도 태그
-- ------------------------------------------------------------------

alter table spot_reviews add column crowd_tag crowd_tag;

-- ------------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------------

alter table spot_access_steps enable row level security;
alter table spot_parking_options enable row level security;
alter table spot_emergency_facilities enable row level security;

create policy "access steps visible when unlocked" on spot_access_steps
  for select using (can_unlock_spot_details(spot_id));

create policy "parking options visible when unlocked" on spot_parking_options
  for select using (can_unlock_spot_details(spot_id));

-- 안전 정보이므로 게이트 예외 — 항상 공개
create policy "emergency facilities always publicly readable" on spot_emergency_facilities
  for select using (true);

-- ------------------------------------------------------------------
-- unlock_spot_details RPC 확장 — 소요시간/화장실/샤워실 필드 함께 반환
-- (0008에서 정의한 시그니처에 새 컬럼 추가)
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
stable
security definer
set search_path = public
as $$
begin
  if not can_unlock_spot_details(p_spot_id) then
    raise exception 'unlock required: sign in to view exact location and access details';
  end if;

  return query
    select
      sli.exact_lat, sli.exact_lng, sli.access_route, sli.parking_tip,
      sli.estimated_walk_minutes, sli.has_restroom, sli.has_shower
    from spot_locked_info sli
    where sli.spot_id = p_spot_id;
end;
$$;

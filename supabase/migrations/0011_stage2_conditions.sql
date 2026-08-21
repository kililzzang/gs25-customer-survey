-- 물빛(Mulbit) — 0011: 2단계 데이터 연동 강화 스키마
-- 외부 API(카카오/네이버 대중교통, 국립해양조사원, 기상청) 연동은 추후 진행.
-- 지금은 캐시 테이블/구조만 준비하고, 해당 UI는 feature_flags에서 비활성 상태로 둡니다.
-- ------------------------------------------------------------------

-- ------------------------------------------------------------------
-- spot_transit_stops — 최근접 대중교통 정류장 (11)
-- 카카오/네이버 대중교통 API로 주기 배치 갱신 예정. 지금은 스키마만.
-- ------------------------------------------------------------------

create type transit_type as enum ('bus', 'subway');

create table spot_transit_stops (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots (id) on delete cascade,
  stop_name text not null,
  transit_type transit_type not null,
  walk_minutes smallint,
  lat double precision,
  lng double precision,
  fetched_at timestamptz,
  created_at timestamptz not null default now()
);

create index spot_transit_stops_spot_id_idx on spot_transit_stops (spot_id);

comment on table spot_transit_stops is
  '최근접 대중교통 정류장 + 도보시간. 카카오/네이버 대중교통 API 연동 예정 (2단계, 추후 연결).'
  ' fetched_at이 오래되면 배치가 재조회하도록 사용.';

-- ------------------------------------------------------------------
-- spot_conditions_cache — 물때/파고·풍속/자외선 통합 캐시 (12, 13, 15)
-- 국립해양조사원(조위) / 기상청(파고·풍속·자외선) API로 배치 갱신 예정.
-- 안전 관련(물때 경고, 파고·풍속)은 게이트 예외 — 항상 무료 공개될 데이터입니다.
-- ------------------------------------------------------------------

create table spot_conditions_cache (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots (id) on delete cascade,
  observed_date date not null,
  tide_state text, -- 예: 'high_tide_warning' | 'low_tide' | 'normal'
  tide_warning text, -- 예: "만조 시 진입로 침수 주의"
  wave_height_m numeric,
  wind_speed_ms numeric,
  uv_index numeric,
  condition_level text, -- 'good' | 'caution' | 'danger' (지도 위 초록/노랑/빨강 표시용)
  source text, -- 'khoa' | 'kma' 등 출처 API 식별
  fetched_at timestamptz not null default now(),
  unique (spot_id, observed_date)
);

create index spot_conditions_cache_spot_date_idx on spot_conditions_cache (spot_id, observed_date desc);

comment on table spot_conditions_cache is
  '물때/파고/풍속/자외선 일별 캐시. 국립해양조사원(물때) · 기상청(파고/풍속/자외선) API로'
  ' 배치(cron)가 채워 넣는 구조 (2단계, 추후 연결). 안전 관련 필드(tide_warning,'
  ' wave_height_m, wind_speed_ms, condition_level)는 게이트 예외 — 항상 무료 공개.';

alter table spot_conditions_cache enable row level security;

create policy "conditions cache always publicly readable" on spot_conditions_cache
  for select using (true);

-- ------------------------------------------------------------------
-- partner_listings 확장 — 경로 기반 로컬 제휴처 추천 (17)
-- 외부 API 불필요 (우리 자체 제휴 데이터). 지금 바로 동작합니다.
-- ------------------------------------------------------------------

alter table partner_listings
  drop constraint if exists partner_listings_listing_type_check;

alter table partner_listings
  add constraint partner_listings_listing_type_check
  check (listing_type in ('rental', 'tour', 'route_food', 'route_cafe'));

comment on column partner_listings.listing_type is
  'rental/tour: 스팟 상세 제휴 배너. route_food/route_cafe: 가는 길목 맛집/카페 추천(17번, 경로 기반 추천).';

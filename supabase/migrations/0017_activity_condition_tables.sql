-- 물빛(Mulbit) — 0017: 액티비티별 컨디션 서브테이블 (2/5)
-- 스노클링/바다수영은 기존 spots.depth_min_m/max_m, visibility_m, current_level,
-- water_temp_c를 그대로 재사용합니다(1차 우선순위, 기존 데이터 재활용).
-- 서핑/프리다이빙/스쿠버는 필드 구조가 서로 완전히 달라 JSON 한 컬럼 대신
-- spot_access_steps 등 기존 패턴과 일관되게 타입 안전한 서브테이블로 분리합니다.
-- 컨디션 데이터 자체는 수심/시야와 마찬가지로 무료 공개 정보입니다(게이트 없음).
-- ------------------------------------------------------------------

create table spot_surf_conditions (
  spot_id uuid primary key references spots (id) on delete cascade,
  wave_height_min_m numeric,
  wave_height_max_m numeric,
  swell_period_sec numeric,
  wind_direction text, -- 예: 'offshore', 'onshore', 'NW' 등 자유 텍스트
  break_type text check (break_type in ('beach_break', 'reef_break', 'point_break')),
  updated_at timestamptz not null default now()
);

create table spot_freedive_conditions (
  spot_id uuid primary key references spots (id) on delete cascade,
  max_depth_zone_m numeric,
  has_safety_line boolean,
  has_buoy boolean,
  notes text,
  updated_at timestamptz not null default now()
);

create table spot_scuba_conditions (
  spot_id uuid primary key references spots (id) on delete cascade,
  underwater_terrain text check (underwater_terrain in ('wreck', 'wall', 'reef', 'cave', 'artificial_reef')),
  required_cert_level text check (required_cert_level in ('open_water', 'advanced', 'rescue', 'divemaster')),
  max_depth_m numeric,
  notes text,
  updated_at timestamptz not null default now()
);

alter table spot_surf_conditions enable row level security;
alter table spot_freedive_conditions enable row level security;
alter table spot_scuba_conditions enable row level security;

create policy "surf conditions publicly readable" on spot_surf_conditions for select using (true);
create policy "freedive conditions publicly readable" on spot_freedive_conditions for select using (true);
create policy "scuba conditions publicly readable" on spot_scuba_conditions for select using (true);

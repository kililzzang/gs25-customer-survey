-- 물빛(Mulbit) — 0016: "스노클링 전문" → "해양 액티비티 통합 가이드" 확장 (1/5)
-- activities 다중 선택, terrain(지형) 분리, 액티비티별 독립 난이도
-- ------------------------------------------------------------------

create type activity_type as enum ('snorkeling', 'sea_swimming', 'surfing', 'freediving', 'scuba');

-- 스팟이 지원하는 액티비티 목록. GIN 인덱스로 배열 포함검색(WHERE 'surfing' = ANY(activities)) 최적화.
alter table spots add column activities activity_type[] not null default '{snorkeling}';
create index spots_activities_gin_idx on spots using gin (activities);

comment on column spots.activities is
  '이 스팟에서 가능한 액티비티 목록(다중). 기존 스팟은 모두 snorkeling으로 백필됨.';

-- 지형(입수/수중 지형) — 접근로 스텝의 terrain_type(평지/계단/암반/모래, 도보면 종류)과는
-- 별개 개념이라 이름을 spot_terrain_type으로 분리했습니다.
create type spot_terrain_type as enum ('sand_beach', 'rocky_shore', 'breakwater', 'reef_zone');

alter table spots add column terrain spot_terrain_type;

comment on column spots.terrain is
  '입수 지형(백사장/갯바위/방파제/암초지대). activities와 독립적인 속성.';

-- ------------------------------------------------------------------
-- spot_activity_difficulty — 액티비티별 독립 난이도
-- 기존 spots.difficulty는 하위호환을 위해 컬럼 자체는 유지하되(스노클링 기준 값으로 계속 사용),
-- 이 테이블이 다중 액티비티 난이도의 정식 저장소입니다.
-- ------------------------------------------------------------------

create table spot_activity_difficulty (
  spot_id uuid not null references spots (id) on delete cascade,
  activity activity_type not null,
  difficulty spot_difficulty not null,
  primary key (spot_id, activity)
);

alter table spot_activity_difficulty enable row level security;

create policy "activity difficulty publicly readable" on spot_activity_difficulty
  for select using (true);

comment on table spot_activity_difficulty is
  '액티비티별 난이도(예: 같은 스팟이라도 스쿠버 중급 ≠ 스노클링 중급). spots.difficulty는'
  ' 하위호환용 스노클링 기준 값으로 남겨두고, 신규 UI는 이 테이블을 우선 사용합니다.';

-- 기존 spots.difficulty 값을 snorkeling 활동 난이도로 백필 (비파괴적 — 컬럼은 유지)
insert into spot_activity_difficulty (spot_id, activity, difficulty)
select id, 'snorkeling', difficulty
from spots
where difficulty is not null
on conflict do nothing;

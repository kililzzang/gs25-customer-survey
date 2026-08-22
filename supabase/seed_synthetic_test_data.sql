-- ============================================================================
-- 물빛(Mulbit) — 성능/부하 테스트 전용 더미 데이터 (synthetic_test = true)
--
-- ⚠️ 실제 장소가 아닙니다. UI/리더보드/필터/지도 성능을 테스트하기 위해
--    스크립트로 자동 생성한 더미 스팟 240개입니다.
--
-- ⚠️ 실제 서비스 오픈 전 반드시 전량 삭제할 것:
--      delete from spots where synthetic_test = true;
--    (spot_safety_info / spot_locked_info는 spots.id를 FK로 참조하며
--     ON DELETE CASCADE로 걸려 있어 위 한 줄로 함께 정리됩니다.)
--
-- 이 파일은 supabase/seed.sql과 별도로 관리합니다 — 일반 개발용 시딩
-- (`supabase db reset`)에는 포함하지 않고, 성능 테스트가 필요할 때만
-- 수동으로 실행하세요:
--      supabase db execute -f supabase/seed_synthetic_test_data.sql
--   또는 Supabase 대시보드 SQL Editor에 붙여넣어 실행
-- ============================================================================

-- 7개 지역에 고르게 분산되도록 n % 7로 지역/중심좌표를 순환 배정하고,
-- 그 중심좌표 주변에 ±0.3도 랜덤 지터를 줘서 지도에 흩뿌립니다.
-- depth/visibility/current/temp는 실제 다이빙 데이터로 그럴듯한 범위 내에서 랜덤 생성합니다.
with generated as (
  select
    n,
    (array['gyeonggi','gangwon','chungcheong','gyeongbuk','gyeongnam','jeolla','jeju']::region_code[])
      [1 + (n % 7)] as region,
    (array[37.45, 37.75, 36.60, 36.40, 34.90, 34.60, 33.40])[1 + (n % 7)] as center_lat,
    (array[126.60, 128.90, 126.30, 129.40, 128.40, 127.00, 126.50])[1 + (n % 7)] as center_lng,
    (1 + floor(random() * 8))::numeric as depth_min
  from generate_series(1, 240) as n
)
insert into spots (
  slug, name, region, subregion, description,
  approx_lat, approx_lng, coordinates_verified,
  depth_min_m, depth_max_m, visibility_m, current_level, water_temp_c,
  difficulty, is_hidden, status, trust_score, last_verified_at,
  synthetic_test, like_count
)
select
  'test-spot-' || lpad(n::text, 3, '0'),
  '테스트 스팟 #' || lpad(n::text, 3, '0'),
  region,
  '자동생성',
  '성능/부하 테스트용 자동 생성 더미 스팟입니다. 실제 장소가 아니며, 서비스 오픈 전 전량 삭제 대상입니다.',
  center_lat + (random() - 0.5) * 0.6,
  center_lng + (random() - 0.5) * 0.6,
  false,
  depth_min,
  depth_min + 3 + floor(random() * 22),
  round((2 + random() * 18)::numeric, 1),
  (array['calm', 'moderate', 'strong']::current_level[])[1 + floor(random() * 3)::int],
  round((12 + random() * 16)::numeric, 1),
  (array['beginner', 'intermediate', 'advanced']::spot_difficulty[])[1 + floor(random() * 3)::int],
  (random() < 0.15),
  (array['verified', 'verified', 'verified', 'pending', 'needs_update']::spot_status[])[1 + floor(random() * 5)::int],
  round((20 + random() * 79)::numeric),
  case when random() < 0.7 then now() - (floor(random() * 180) || ' days')::interval else null end,
  true,
  floor(random() * 300)::int
from generated;

-- 상세 페이지가 깨지지 않도록 더미 스팟에도 안전정보/잠금정보를 함께 채워줍니다.
insert into spot_safety_info (spot_id, emergency_contacts, current_warning)
select id, '[{"label":"해양경찰 122","phone":"122"}]'::jsonb, null
from spots
where synthetic_test = true;

insert into spot_locked_info (spot_id, exact_lat, exact_lng, access_route, parking_tip)
select id, approx_lat, approx_lng,
  '(테스트 데이터) 접근 경로 정보 없음',
  '(테스트 데이터) 주차 정보 없음'
from spots
where synthetic_test = true;

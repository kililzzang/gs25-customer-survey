-- 물빛(Mulbit) — 개발용 시드 데이터
-- 유저 계정 없이도 UI 개발이 가능하도록 공개 콘텐츠 위주로 시딩합니다.

insert into badges (key, name, description, icon) values
  ('first_report', '첫 제보', '스팟을 처음으로 제보했어요', '🧭'),
  ('hidden_hunter', '히든 스팟 헌터', '히든 스팟을 5곳 이상 발굴했어요', '🕵️'),
  ('detail_master', '디테일 마스터', '접근로/주차 정보를 10건 이상 기재했어요', '🗺️'),
  ('local_guide', '로컬 가이드', '해당 지역 방문 스탬프 10개 달성', '🏅')
on conflict (key) do nothing;

with s as (
  insert into spots (
    slug, name, region, description,
    approx_lat, approx_lng,
    depth_min_m, depth_max_m, visibility_m, current_level, water_temp_c,
    is_hidden, status, trust_score, last_verified_at, like_count
  ) values
    ('munseom-jeju', '문섬 스노클링 포인트', 'jeju', '서귀포 앞바다의 대표 스노클링 스팟. 연산호 군락이 유명합니다.',
      33.223, 126.560, 2, 12, 8, 'moderate', 22, false, 'verified', 88, now() - interval '20 days', 142),
    ('hyeopjae-jeju', '협재 해변 스노클링', 'jeju', '초보자에게 적합한 얕은 수심의 백사장 스노클링존.',
      33.394, 126.239, 1, 4, 6, 'calm', 23, false, 'verified', 91, now() - interval '10 days', 210),
    ('gapado-hidden', '가파도 숨은 여', 'jeju', '현지 다이버들 사이에서만 알려진 조용한 포인트.',
      33.173, 126.271, 3, 9, 7, 'moderate', 21, true, 'verified', 76, now() - interval '40 days', 58),
    ('sokcho-jangsari', '속초 장사항 인근 포인트', 'gangwon', '동해의 맑은 시야가 특징인 암초 지형.',
      38.187, 128.610, 2, 10, 9, 'moderate', 18, false, 'pending', 55, now() - interval '5 days', 19),
    ('goseong-hidden', '고성 무명 여', 'gangwon', '접근로가 까다로워 아는 사람만 찾는 히든 스팟.',
      38.380, 128.478, 4, 14, 10, 'strong', 17, true, 'verified', 82, now() - interval '15 days', 33),
    ('taean-mongsanpo', '태안 몽산포 스노클링존', 'chungcheong', '서해 특유의 갯벌 지형 초입 스노클링 구역.',
      36.786, 126.194, 1, 3, 3, 'moderate', 20, false, 'verified', 70, now() - interval '60 days', 27),
    ('ulleungdo-jeodong', '울릉도 저동항 포인트', 'gyeongbuk', '청정 동해 수심과 다양한 어종을 볼 수 있는 곳.',
      37.503, 130.910, 3, 15, 12, 'moderate', 19, false, 'verified', 93, now() - interval '8 days', 165),
    ('geoje-hakdong', '거제 학동 몽돌해변 포인트', 'gyeongnam', '몽돌해변과 이어지는 완만한 수중 지형.',
      34.782, 128.640, 2, 8, 7, 'calm', 21, false, 'verified', 80, now() - interval '25 days', 74),
    ('yeosu-hidden', '여수 외돌개 뒤편 여', 'jeolla', '현지 어민들만 알던 포인트, 최근 제보로 알려짐.',
      34.708, 127.755, 3, 11, 8, 'moderate', 20, true, 'pending', 48, null, 12),
    ('incheon-muuido', '인천 무의도 스노클링존', 'gyeonggi', '수도권에서 가장 가까운 서해 스노클링 스팟.',
      37.428, 126.373, 1, 4, 4, 'moderate', 19, false, 'needs_update', 35, now() - interval '220 days', 41),
    ('okinawa-blue-cave', '오키나와 블루케이브', 'overseas', '일본 오키나와의 대표 스노클링/다이빙 명소.',
      26.505, 127.955, 2, 18, 15, 'calm', 25, false, 'verified', 96, now() - interval '12 days', 301),
    ('cebu-moalboal', '세부 모알보알 사딘런', 'overseas', '수백만 마리의 정어리떼로 유명한 스노클링 포인트.',
      9.958, 123.397, 3, 20, 18, 'calm', 27, false, 'verified', 97, now() - interval '18 days', 412)
  returning id, slug, is_hidden
)
select id, slug, is_hidden from s;

-- ------------------------------------------------------------------
-- 실제 스팟 21곳 추가 (2026-08 제보 목록 기반)
-- ⚠️ 좌표는 정확한 실사 측정치가 아닌 지도 기준 추정치입니다.
--    coordinates_verified = false 로 표시하며, 런칭 전 반드시 현장 실사로
--    정확한 좌표를 재확인해야 합니다 (spots.coordinates_verified 컬럼 참고,
--    supabase/migrations/0007_spot_metadata_flags.sql).
-- ------------------------------------------------------------------

with s2 as (
  insert into spots (
    slug, name, region, subregion, description,
    approx_lat, approx_lng, coordinates_verified,
    depth_min_m, depth_max_m, visibility_m, current_level, water_temp_c,
    difficulty, is_hidden, status, trust_score, last_verified_at, like_count
  ) values
    -- 강원
    ('jangho-hang-samcheok', '장호항', 'gangwon', '삼척', '한국의 나폴리, 갯바위가 파도를 막아주는 잔잔한 포인트',
      37.024, 129.322, false, 1, 4, 6, 'calm', 19, 'beginner', false, 'verified', 60, null, 0),
    ('galnam-hang-samcheok', '갈남항', 'gangwon', '삼척', '조용한 어촌마을, 맑은 수질의 숨은 명소',
      37.011, 129.317, false, 1, 4, 7, 'calm', 19, 'beginner', true, 'verified', 60, null, 0),
    ('songjiho-beach-goseong', '송지호해수욕장', 'gangwon', '고성', '긴 해변, 서낭바위 쪽 스노클링 포인트 형성',
      38.313, 128.499, false, 1, 3, 5, 'calm', 20, 'beginner', false, 'verified', 60, null, 0),
    ('hajodae-point-yangyang', '하조대전망대 포인트', 'gangwon', '양양', '가두리 지형으로 파도 잔잔, 수심 3~5m 균일',
      38.092, 128.789, false, 3, 5, 6, 'calm', 19, 'beginner', true, 'verified', 60, null, 0),
    ('namae-3ri-yangyang', '남애3리', 'gangwon', '양양', '로컬 서퍼들 사이에서 알려진 조용한 포인트',
      37.995, 128.798, false, 1, 4, 6, 'calm', 19, 'beginner', true, 'verified', 60, null, 0),
    ('sodol-beach-yangyang', '소돌해변', 'gangwon', '양양', '작은 규모의 한적한 스노클링 스팟',
      38.075, 128.628, false, 1, 3, 5, 'calm', 19, 'beginner', true, 'verified', 60, null, 0),
    ('simgok-hang-gangneung', '심곡항', 'gangwon', '강릉', '7번 국도 옆 빨간 등대 아래 비밀의 포인트',
      37.729, 128.909, false, 1, 4, 7, 'calm', 18, 'beginner', true, 'verified', 60, null, 0),
    ('jajakdo-beach-goseong', '자작도해변', 'gangwon', '고성', '완만한 긴 해안선, 소나무숲과 청정 동해',
      38.450, 128.474, false, 1, 3, 6, 'calm', 20, 'beginner', false, 'verified', 60, null, 0),
    ('panji-hang-goseong', '판지항', 'gangwon', '고성', '낚시 명소에서 스노클링 명소로 부상, 안전요원 없음 주의',
      38.466, 128.470, false, 3, 12, 8, 'moderate', 18, 'intermediate', true, 'verified', 55, null, 0),
    -- 경북
    ('nagok-beach-uljin', '나곡해수욕장', 'gyeongbuk', '울진', '동해 대표 스쿠버·스노클링 지역',
      36.993, 129.417, false, 3, 20, 10, 'moderate', 19, 'intermediate', false, 'verified', 60, null, 0),
    ('hujeong-beach-uljin', '후정해수욕장', 'gyeongbuk', '울진', '울진 다이빙 명소 중 한 곳',
      36.982, 129.416, false, 3, 18, 9, 'moderate', 19, 'intermediate', false, 'verified', 60, null, 0),
    ('yangjeong-beach-uljin', '양정해수욕장', 'gyeongbuk', '울진', '다양한 다이빙 포인트가 밀집한 구역',
      36.970, 129.415, false, 3, 15, 9, 'moderate', 19, 'intermediate', true, 'verified', 60, null, 0),
    ('gusan-beach-uljin', '구산해수욕장', 'gyeongbuk', '울진', '난파선 포인트로도 알려진 해안선',
      36.960, 129.414, false, 5, 25, 8, 'moderate', 19, 'intermediate', true, 'verified', 60, null, 0),
    ('hupo-beach-uljin', '후포해수욕장', 'gyeongbuk', '울진', '울진 대표 다이빙 명소',
      36.677, 129.453, false, 3, 18, 10, 'moderate', 19, 'intermediate', false, 'verified', 60, null, 0),
    ('guryongpo-beach-pohang', '구룡포해변', 'gyeongbuk', '포항', '수심 10~30m, 수중바위와 산호초 관찰 가능',
      35.988, 129.559, false, 10, 30, 9, 'moderate', 20, 'intermediate', false, 'verified', 60, null, 0),
    ('gampo-songdaemal-gyeongju', '감포바다 (송대말등대)', 'gyeongbuk', '경주', '에메랄드빛 해변, 조용한 숨은 명소로 부상 중',
      35.799, 129.499, false, 1, 5, 8, 'calm', 21, 'beginner', true, 'verified', 60, null, 0),
    -- 경남/전남
    ('oryukdo-busan', '오륙도 인근', 'gyeongnam', '부산 남구', '도시 속 숨은 다이빙 포인트, 절벽 지형',
      35.101, 129.111, false, 5, 20, 8, 'moderate', 22, 'intermediate', true, 'verified', 55, null, 0),
    ('gujora-yundoldo-geoje', '거제 구조라 윤돌섬', 'gyeongnam', '거제', '카약/제트스키로 접근하는 무인도, 독특한 바위 지형',
      34.775, 128.700, false, 3, 15, 9, 'moderate', 22, 'intermediate', true, 'verified', 55, null, 0),
    ('tongyeong-hongdo', '통영 홍도', 'gyeongnam', '통영', '한려해상국립공원의 보석, 수중동굴과 청정 바다',
      34.397, 128.221, false, 5, 20, 12, 'moderate', 22, 'intermediate', false, 'verified', 60, null, 0),
    ('yeosu-ungcheon', '여수 웅천', 'jeolla', '여수', '블루홀 느낌의 깊고 푸른 바다, 조류 적어 고요함',
      34.708, 127.663, false, 5, 25, 10, 'calm', 22, 'intermediate', true, 'verified', 55, null, 0),
    ('mijo-hang-namhae', '미조항 인근 (남해)', 'gyeongnam', '남해', '근해부터 먼바다까지 다양한 다이빙 포인트',
      34.756, 128.028, false, 5, 20, 10, 'moderate', 23, 'intermediate', false, 'verified', 60, null, 0)
  returning id, slug, is_hidden
)
select id, slug, is_hidden from s2;

-- 안전 정보 (게이트 예외, 항상 공개)
insert into spot_safety_info (spot_id, emergency_contacts, current_warning)
select id,
  '[{"label":"해양경찰 122","phone":"122"},{"label":"인근 파출소","phone":"110"}]'::jsonb,
  case when is_hidden then '히든 스팟은 구조 접근이 어려울 수 있으니 반드시 2인 이상 동행하세요.' else null end
from spots;

-- 잠금 정보 (광고 게이트 뒤 노출)
insert into spot_locked_info (spot_id, exact_lat, exact_lng, access_route, parking_tip)
select id,
  approx_lat + 0.0007, approx_lng - 0.0005,
  '해안도로에서 도보 8분, 방파제 끝 계단으로 진입',
  '인근 공영주차장 이용 (성수기 만차 잦음, 07시 이전 도착 권장)'
from spots;

-- 업체 제휴 배너 (일부 스팟)
insert into partner_listings (spot_id, partner_name, listing_type, banner_url, cta_url, cta_label, priority)
select id, '물빛 파트너 다이브샵', 'rental', null, 'https://example.com/booking', '장비 대여 예약', 1
from spots where slug in ('munseom-jeju', 'okinawa-blue-cave', 'cebu-moalboal');

insert into partner_listings (spot_id, partner_name, listing_type, banner_url, cta_url, cta_label, priority)
select id, '물빛 투어 파트너', 'tour', null, 'https://example.com/tour', '스노클링 투어 예약', 2
from spots where slug in ('hyeopjae-jeju', 'ulleungdo-jeodong');

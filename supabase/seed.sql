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

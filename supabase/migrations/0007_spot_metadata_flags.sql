-- 물빛(Mulbit) — 0007: 스팟 메타데이터 확장
-- 좌표 실사 검증 여부 / 성능 테스트용 더미 데이터 구분 / 난이도 / 세부 지역명
-- ------------------------------------------------------------------

create type spot_difficulty as enum ('beginner', 'intermediate', 'advanced');

alter table spots
  add column coordinates_verified boolean not null default false,
  add column synthetic_test boolean not null default false,
  add column difficulty spot_difficulty,
  add column subregion text;

comment on column spots.coordinates_verified is
  '좌표가 실사(GPS 현장 측정)로 검증되었는지 여부. 기본값 false —'
  ' 지금까지 시딩된 좌표는 모두 지도 기준 추정치이며 실사 검증 전입니다.'
  ' 런칭 전 전 스팟 현장 검증 후 운영자가 true로 갱신할 것.'
  ' false인 스팟은 상세 페이지에 "좌표 미검증" 안내를 노출합니다.';

comment on column spots.synthetic_test is
  '성능/부하 테스트용으로 스크립트 자동 생성된 더미 스팟 여부.'
  ' true인 행은 실제 서비스 오픈 전 전량 삭제 대상입니다: delete from spots where synthetic_test = true;'
  ' (spot_safety_info/spot_locked_info는 spots FK가 ON DELETE CASCADE라 함께 삭제됨)';

comment on column spots.difficulty is '체감 난이도 (초급/중급/고급). 선택 항목, 미입력 가능.';
comment on column spots.subregion is '시/군 단위 세부 지역명 (예: "삼척", "울진"). region enum보다 세분화된 표시용 텍스트.';

-- 합성 테스트 데이터 정리 시 빠르게 스캔할 수 있도록 부분 인덱스
create index spots_synthetic_test_idx on spots (synthetic_test) where synthetic_test;

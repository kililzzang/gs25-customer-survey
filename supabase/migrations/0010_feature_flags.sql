-- 물빛(Mulbit) — 0010: 스팟 상세 "정확한 위치와 접근 방법" 기능 로드맵 feature flag
-- 1/2/3단계 30개 기능을 배포 없이 켜고 끌 수 있도록 관리. 초기엔 1단계만 활성화.
-- ------------------------------------------------------------------

create table feature_flags (
  key text primary key,
  label text not null,
  stage smallint not null check (stage in (1, 2, 3)),
  enabled boolean not null default false,
  description text,
  updated_at timestamptz not null default now()
);

comment on table feature_flags is
  '스팟 상세페이지 "정확한 위치와 접근 방법" 로드맵(1~3단계) 기능 온/오프 스위치.'
  ' 배포 없이 enabled 값만 바꿔서 기능을 켜고 끌 수 있음.';

alter table feature_flags enable row level security;

create policy "feature flags are publicly readable" on feature_flags
  for select using (true);

insert into feature_flags (key, label, stage, enabled, description) values
  -- 1단계 — MVP 필수 (기본 활성화)
  ('map_pin_route_polyline', '지도 핀 + 접근 경로 폴리라인', 1, true, '카카오맵에 정확한 좌표 핀과 주차장→포인트 도보 경로 표시'),
  ('kakao_roadview', '카카오 로드뷰 임베드', 1, true, '진입로 실제 도로 모습 미리보기'),
  ('access_step_cards', '단계별 접근 스텝 카드', 1, true, '사진+텍스트로 구성된 순서형 접근 안내 카드'),
  ('parking_options_detail', '주차 정보 세분화', 1, true, '무료/유료 주차장 구분 및 대안 주차 위치'),
  ('terrain_difficulty_tags', '경사도/난이도 태그', 1, true, '평지/계단/암벽 등 진입로 지형 아이콘'),
  ('estimated_walk_time', '예상 도보 소요시간', 1, true, '주차장 → 포인트 예상 소요시간 표시'),
  ('restroom_shower_markers', '화장실/샤워실 마커', 1, true, '스팟 인근 화장실·샤워실 유무 표시'),
  ('nearest_emergency_facilities', '최인접 응급실/보건소', 1, true, '게이트 예외(항상 무료 공개). 1단계는 정적 데이터'),
  ('sos_button', '긴급 SOS 버튼', 1, true, '게이트 예외(항상 무료 공개). 현재 위치 + 해양경찰(122) 연결'),
  ('review_crowd_tag', '리뷰 혼잡도 태그', 1, true, '한적함/붐빔 등 짧은 태그형 혼잡도 리뷰'),

  -- 2단계 — 데이터 연동 강화 (기본 비활성화)
  ('transit_access_info', '대중교통 접근 정보', 2, false, '최근접 정류장 + 도보시간 자동 계산'),
  ('tide_accessibility_warning', '물때 연동 접근성 경고', 2, false, '게이트 예외 예정(안전 정보). 국립해양조사원 조위 데이터 기반'),
  ('wave_wind_overlay', '당일 파고·풍속 오버레이', 2, false, '게이트 예외 예정(안전 정보). 기상청 API 연동'),
  ('sunrise_sunset_times', '일출·일몰 시간', 2, false, '외부 API 없이 좌표 기반 계산'),
  ('uv_index', '자외선 지수 안내', 2, false, '기상청 API 연동'),
  ('spot_map_clustering', '근처 스팟 클러스터링', 2, false, '지도상 밀집 스팟 자동 클러스터링'),
  ('route_based_partner_recs', '경로 기반 제휴처 추천', 2, false, '가는 길목 맛집/카페 등 제휴 슬롯'),
  ('gpx_route_download', 'GPX 경로 다운로드', 2, false, '외부 트레킹 앱 임포트용 파일 생성'),

  -- 3단계 — 참여형/고급 기능 (기본 비활성화)
  ('entry_video_upload', '진입로 숏폼 영상 업로드', 3, false, '15초 이내 유저 촬영 영상'),
  ('live_checkin_crowd_count', '실시간 체크인 혼잡도', 3, false, '"오늘 여기 있어요" 체크인 기반 실시간 방문자 수'),
  ('companion_location_share', '동행자 위치 공유 링크', 3, false, '옵트인, 스노클링 중 육상 동행자용 임시 링크'),
  ('panorama_360_photos', '360도 파노라마 사진', 3, false, '업로드/뷰어'),
  ('species_field_guide', '수중 생물 도감 연동', 3, false, '스팟별 관찰 가능 어종/산호 태깅'),
  ('seasonal_photo_compare', '계절별 사진 비교 슬라이더', 3, false, '동일 스팟의 계절별 비교'),
  ('offline_map_download', '오프라인 지도 저장', 3, false, '프리미엄 멤버십 전용'),
  ('ar_navigation', 'AR 길찾기 모드', 3, false, '카메라 오버레이 방향 안내'),
  ('voice_guidance', '음성 안내 모드', 3, false, '내비게이션 연동'),
  ('access_route_change_history', '접근로 변경 이력 타임라인', 3, false, '공사/재해로 인한 경로 변경 아카이브'),
  ('satellite_update_detection', '위성사진 갱신 감지', 3, false, '변경 감지 시 관리자 재검증 알림'),
  ('nearby_visitors_live_map', '실시간 인근 방문자 지도', 3, false, '옵트인, 안전/동행 목적');

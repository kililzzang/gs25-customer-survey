-- 물빛(Mulbit) — 0013: 2·3단계 중 외부 API 없이 실제로 동작 구현된 기능 활성화
-- 나머지(대중교통/물때/파고풍속/자외선/영상/파노라마/동행공유/오프라인지도/AR/음성/
-- 위성감지/실시간 인근지도)는 계속 비활성 상태로 둡니다 (스키마만 준비, 추후 연결).
-- ------------------------------------------------------------------

update feature_flags set enabled = true, updated_at = now()
where key in (
  'sunrise_sunset_times',       -- 14: 순수 계산, 외부 API 불필요
  'gpx_route_download',         -- 18: 자체 데이터(spot_access_steps) 기반
  'route_based_partner_recs',   -- 17: 자체 제휴 데이터 기반
  'spot_map_clustering',        -- 16: 카카오맵 클러스터러(키 필요, 로직은 준비 완료)
  'live_checkin_crowd_count',   -- 20: Supabase 테이블 카운트만으로 동작
  'species_field_guide',        -- 23: 정적 참조 데이터
  'access_route_change_history' -- 28: 읽기 전용 이력 표시
);

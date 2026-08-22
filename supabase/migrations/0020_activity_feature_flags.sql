-- 물빛(Mulbit) — 0020: 액티비티 순차 오픈 feature flag (5/5)
-- 콘텐츠 우선순위: 1차 스노클링+바다수영(기존 데이터 재활용) → 2차 서핑 → 3차 프리다이빙/스쿠버
-- ------------------------------------------------------------------

insert into feature_flags (key, label, stage, enabled, description) values
  ('activity_sea_swimming', '바다수영 액티비티', 1, true, '1차 오픈 — 스노클링과 동일 컨디션 필드 재사용'),
  ('activity_surfing', '서핑 액티비티', 2, false, '2차 오픈 — 강원 양양 등 서핑 명소 시딩 후 활성화'),
  ('activity_freediving', '프리다이빙 액티비티', 3, false, '3차 오픈 — 전문 자격 영역, 안전라인 데이터 확보 후 활성화'),
  ('activity_scuba', '스쿠버다이빙 액티비티', 3, false, '3차 오픈 — 전문 자격 영역, 인증레벨 데이터 확보 후 활성화'),
  ('community_board', '액티비티별 커뮤니티 게시판', 2, false, '신규 기능 — 최소 스키마로 준비, UI 완성도 확인 후 활성화'),
  ('certifications_profile', '프로필 공인 자격증 표시', 2, true, 'PADI/AIDA 등 자격증 등록 및 인증된 전문가 뱃지')
on conflict (key) do update set label = excluded.label, description = excluded.description;

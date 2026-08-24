import { createClient } from "@/lib/supabase/server";

/**
 * 스팟 상세 "정확한 위치와 접근 방법" 로드맵(1~3단계) 기능 스위치.
 * DB(feature_flags 테이블)가 단일 소스이며, Supabase 미연결 시에는 이 기본값으로 폴백합니다.
 * 배포 없이 DB 값만 바꿔서 기능을 켜고 끌 수 있습니다 (supabase/migrations/0010_feature_flags.sql).
 */
export const FEATURE_FLAG_DEFAULTS = {
  // 1단계 — 기본 활성화
  map_pin_route_polyline: true,
  kakao_roadview: true,
  access_step_cards: true,
  parking_options_detail: true,
  terrain_difficulty_tags: true,
  estimated_walk_time: true,
  restroom_shower_markers: true,
  nearest_emergency_facilities: true,
  sos_button: true,
  review_crowd_tag: true,
  // 2단계 — 외부 API(대중교통/물때/파고풍속/자외선) 연동 전까지 비활성화.
  // 나머지는 외부 API 없이 실제로 동작하도록 구현되어 기본 활성화합니다.
  transit_access_info: false, // 카카오/네이버 대중교통 API 연동 예정 (추후 연결)
  tide_accessibility_warning: false, // 국립해양조사원 API 연동 예정 (추후 연결)
  wave_wind_overlay: false, // 기상청 API 연동 예정 (추후 연결)
  sunrise_sunset_times: true, // 순수 계산 (lib/sun.ts), 외부 API 불필요
  uv_index: false, // 기상청 API 연동 예정 (추후 연결)
  spot_map_clustering: true, // 카카오맵 클러스터러 — 로직 준비 완료(API 키 필요)
  route_based_partner_recs: true, // 자체 제휴 데이터 기반
  gpx_route_download: true, // 자체 데이터(spot_access_steps) 기반
  // 3단계 — 스토리지/리얼타임/AR 등 무거운 인프라가 필요한 기능은 비활성 유지.
  // 자체 DB만으로 동작하는 기능(체크인/생물도감/변경이력)은 활성화합니다.
  entry_video_upload: false, // 영상 업로드/트랜스코딩 파이프라인 필요 (추후 연결)
  live_checkin_crowd_count: true, // Supabase 테이블 카운트만으로 동작
  companion_location_share: false, // 리얼타임 위치 공유 UI 미구현 (추후 연결)
  panorama_360_photos: false, // 360 사진 업로드/뷰어 미구현 (추후 연결)
  species_field_guide: true, // 정적 참조 데이터
  seasonal_photo_compare: false, // 실제 계절별 업로드 사진 부족, UI 미구현 (추후 연결)
  offline_map_download: false, // 오프라인 지도 캐싱 미구현 (추후 연결)
  ar_navigation: false, // WebXR/네이티브 검토 필요 (추후 연결)
  voice_guidance: false, // 내비게이션 연동 필요 (추후 연결)
  access_route_change_history: true, // 읽기 전용 이력 표시, 자체 데이터
  satellite_update_detection: false, // 외부 위성 이미지 API 필요 (추후 연결)
  nearby_visitors_live_map: false,
  // 해양 액티비티 통합 가이드 확장 — supabase/migrations/0020_activity_feature_flags.sql과 동일하게 유지.
  // 콘텐츠 우선순위: 1차 스노클링+바다수영 → 2차 서핑 → 3차 프리다이빙/스쿠버.
  activity_sea_swimming: true, // 1차 오픈 — 스노클링과 동일 컨디션 필드 재사용
  activity_surfing: false, // 2차 오픈 — 강원 양양 등 서핑 명소 시딩 후 활성화
  activity_freediving: false, // 3차 오픈 — 전문 자격 영역, 안전라인 데이터 확보 후 활성화
  activity_scuba: false, // 3차 오픈 — 전문 자격 영역, 인증레벨 데이터 확보 후 활성화
  community_board: false, // 신규 기능 — 최소 스키마로 준비, UI 완성도 확인 후 활성화
  certifications_profile: true, // PADI/AIDA 등 자격증 등록 및 인증된 전문가 뱃지
  creator_links: true, // 정보 제공자 블로그/유튜브 링크 — 승인 없이 즉시 공개 (supabase/migrations/0021)
} as const satisfies Record<string, boolean>;

export type FeatureFlagKey = keyof typeof FEATURE_FLAG_DEFAULTS;

let cachedFlags: Record<string, boolean> | null = null;

/** 요청마다 다시 조회하지 않도록 프로세스 수명 동안 캐시 (운영 반영은 재배포/재시작 기준). */
async function loadFeatureFlags(): Promise<Record<string, boolean>> {
  if (cachedFlags) return cachedFlags;

  const supabase = await createClient();
  if (!supabase) {
    cachedFlags = { ...FEATURE_FLAG_DEFAULTS };
    return cachedFlags;
  }

  const { data, error } = await supabase.from("feature_flags").select("key, enabled");
  if (error || !data) {
    cachedFlags = { ...FEATURE_FLAG_DEFAULTS };
    return cachedFlags;
  }

  cachedFlags = { ...FEATURE_FLAG_DEFAULTS };
  for (const row of data) {
    cachedFlags[row.key] = row.enabled;
  }
  return cachedFlags;
}

export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  const flags = await loadFeatureFlags();
  return flags[key] ?? FEATURE_FLAG_DEFAULTS[key] ?? false;
}

/** 스팟 상세페이지에서 여러 플래그를 한 번에 조회할 때 사용. */
export async function getFeatureFlags<K extends FeatureFlagKey>(
  keys: readonly K[]
): Promise<Record<K, boolean>> {
  const flags = await loadFeatureFlags();
  return Object.fromEntries(keys.map((k) => [k, flags[k] ?? FEATURE_FLAG_DEFAULTS[k]])) as Record<
    K,
    boolean
  >;
}

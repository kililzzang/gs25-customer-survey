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
  // 2단계 — 기본 비활성화
  transit_access_info: false,
  tide_accessibility_warning: false,
  wave_wind_overlay: false,
  sunrise_sunset_times: false,
  uv_index: false,
  spot_map_clustering: false,
  route_based_partner_recs: false,
  gpx_route_download: false,
  // 3단계 — 기본 비활성화
  entry_video_upload: false,
  live_checkin_crowd_count: false,
  companion_location_share: false,
  panorama_360_photos: false,
  species_field_guide: false,
  seasonal_photo_compare: false,
  offline_map_download: false,
  ar_navigation: false,
  voice_guidance: false,
  access_route_change_history: false,
  satellite_update_detection: false,
  nearby_visitors_live_map: false,
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

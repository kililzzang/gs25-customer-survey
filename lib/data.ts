import { createClient } from "@/lib/supabase/server";
import {
  MOCK_SPOTS,
  MOCK_SYNTHETIC_TEST_SPOTS,
  MOCK_SAFETY_INFO,
  MOCK_LOCKED_INFO,
  MOCK_ACCESS_STEPS,
  MOCK_PARKING_OPTIONS,
  MOCK_EMERGENCY_FACILITIES,
  MOCK_SPOT_SPECIES,
  MOCK_ACCESS_STEP_REVISIONS,
  MOCK_PARTNER_LISTINGS,
  MOCK_LEADERBOARD_GENERAL,
  MOCK_LEADERBOARD_CORE,
  MOCK_REVIEWS,
  MOCK_PROFILE,
  MOCK_BADGES,
  type MockLeaderboardEntry,
  type MockProfile,
} from "@/lib/mock-data";
import type {
  SpotRow,
  SpotSafetyInfoRow,
  SpotLockedInfoRow,
  SpotAccessStepRow,
  SpotParkingOptionRow,
  SpotEmergencyFacilityRow,
  SpotAccessStepRevisionRow,
  SpeciesRow,
  SpeciesFrequency,
  PartnerListingRow,
  SpotReviewRow,
  RegionCode,
} from "@/lib/types/database";

/**
 * 데이터 접근 레이어.
 * Supabase 환경변수가 설정되어 있으면 실제 DB를 조회하고,
 * 그렇지 않으면(로컬 개발 초기 단계) 목업 데이터로 폴백합니다.
 * 실제 프로젝트 연결 후에도 함수 시그니처는 그대로 유지됩니다.
 */

/**
 * 목업 모드에서 사용할 스팟 풀. NEXT_PUBLIC_INCLUDE_SYNTHETIC_TEST_SPOTS=true 일 때만
 * 성능 테스트용 더미 스팟 240개를 함께 노출합니다 (기본은 실제 스팟만).
 */
function getMockSpotPool(): SpotRow[] {
  return process.env.NEXT_PUBLIC_INCLUDE_SYNTHETIC_TEST_SPOTS === "true"
    ? [...MOCK_SPOTS, ...MOCK_SYNTHETIC_TEST_SPOTS]
    : MOCK_SPOTS;
}

export async function getSpotsByRegion(region: RegionCode): Promise<SpotRow[]> {
  const supabase = await createClient();

  if (!supabase) {
    return getMockSpotPool().filter(
      (s) => s.region === region && s.status !== "hidden" && s.status !== "rejected"
    );
  }

  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .eq("region", region)
    .in("status", ["verified", "pending", "needs_update"])
    .order("trust_score", { ascending: false });

  if (error) {
    console.error("getSpotsByRegion error", error);
    return [];
  }
  return data ?? [];
}

export async function getAllSpots(): Promise<SpotRow[]> {
  const supabase = await createClient();

  if (!supabase) {
    return getMockSpotPool().filter((s) => s.status !== "hidden" && s.status !== "rejected");
  }

  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .in("status", ["verified", "pending", "needs_update"])
    .order("like_count", { ascending: false });

  if (error) {
    console.error("getAllSpots error", error);
    return [];
  }
  return data ?? [];
}

export async function getSpotBySlug(slug: string): Promise<{
  spot: SpotRow | null;
  safety: SpotSafetyInfoRow | null;
  partners: PartnerListingRow[];
}> {
  const supabase = await createClient();

  if (!supabase) {
    const spot = getMockSpotPool().find((s) => s.slug === slug) ?? null;
    const fallbackSafety: SpotSafetyInfoRow | null = spot?.synthetic_test
      ? {
          spot_id: spot.id,
          emergency_contacts: [{ label: "해양경찰 122", phone: "122" }],
          current_warning: null,
          updated_at: spot.updated_at,
        }
      : null;
    return {
      spot,
      safety: spot ? (MOCK_SAFETY_INFO[slug] ?? fallbackSafety) : null,
      partners: MOCK_PARTNER_LISTINGS.filter((p) => p.spot_id === spot?.id),
    };
  }

  const { data: spot, error } = await supabase.from("spots").select("*").eq("slug", slug).single();
  if (error || !spot) return { spot: null, safety: null, partners: [] };

  const [{ data: safety }, { data: partners }] = await Promise.all([
    supabase.from("spot_safety_info").select("*").eq("spot_id", spot.id).maybeSingle(),
    supabase.from("partner_listings").select("*").eq("spot_id", spot.id).eq("is_active", true),
  ]);

  return { spot, safety: safety ?? null, partners: partners ?? [] };
}

/**
 * 잠금 정보(정확한 좌표/접근로/주차팁/소요시간/화장실·샤워실 유무) 조회.
 *
 * 열람 조건은 unlock_condition (기본 'login')을 따르며, 실제 판정은 서버에서
 * can_unlock_spot_details()/unlock_spot_details RPC가 담당합니다 — 여기서는
 * 그 결과를 그대로 전달할 뿐, 클라이언트가 "unlocked" 여부를 임의로 넘길 수 없습니다
 * (과거 { unlocked: boolean } 파라미터 방식은 잠금정보를 비로그인 상태에서도
 *  서버 렌더링 페이로드에 그대로 실어버리는 구멍이 있어 제거했습니다).
 *
 * 목업 모드(Supabase 미연결)에서는 로컬 개발/데모 편의를 위해 로그인 여부와
 * 무관하게 항상 반환합니다 — 실 서비스 보안은 아래 Supabase 분기에서 강제됩니다.
 */
export async function getSpotLockedInfo(slug: string): Promise<SpotLockedInfoRow | null> {
  const supabase = await createClient();

  if (!supabase) {
    return MOCK_LOCKED_INFO[slug] ?? null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: spot } = await supabase.from("spots").select("id").eq("slug", slug).single();
  if (!spot) return null;

  const { data, error } = await supabase.rpc("unlock_spot_details", { p_spot_id: spot.id });
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    spot_id: spot.id,
    contributor_id: null,
    updated_at: new Date().toISOString(),
    exact_lat: row.exact_lat,
    exact_lng: row.exact_lng,
    access_route: row.access_route,
    parking_tip: row.parking_tip,
    estimated_walk_minutes: row.estimated_walk_minutes,
    has_restroom: row.has_restroom,
    has_shower: row.has_shower,
  };
}

/**
 * 단계별 접근 스텝 카드. 실 서비스에서는 spot_access_steps RLS
 * (can_unlock_spot_details)가 로그인하지 않은 유저에게 빈 배열을 돌려줍니다.
 */
export async function getSpotAccessSteps(spotId: string, slug: string): Promise<SpotAccessStepRow[]> {
  const supabase = await createClient();
  if (!supabase) {
    return MOCK_ACCESS_STEPS[slug] ?? [];
  }

  const { data, error } = await supabase
    .from("spot_access_steps")
    .select("*")
    .eq("spot_id", spotId)
    .order("step_order", { ascending: true });

  if (error || !data) return [];
  return data;
}

/** 주차 옵션 (무료/유료, 메인/대안). spot_access_steps와 동일한 로그인 게이트 적용. */
export async function getSpotParkingOptions(
  spotId: string,
  slug: string
): Promise<SpotParkingOptionRow[]> {
  const supabase = await createClient();
  if (!supabase) {
    return MOCK_PARKING_OPTIONS[slug] ?? [];
  }

  const { data, error } = await supabase
    .from("spot_parking_options")
    .select("*")
    .eq("spot_id", spotId)
    .order("is_primary", { ascending: false });

  if (error || !data) return [];
  return data;
}

/** 최인접 응급실/보건소. 안전 정보라 게이트 예외 — 항상 공개 조회. */
export async function getSpotEmergencyFacilities(
  spotId: string,
  slug: string
): Promise<SpotEmergencyFacilityRow[]> {
  const supabase = await createClient();
  if (!supabase) {
    return MOCK_EMERGENCY_FACILITIES[slug] ?? [];
  }

  const { data, error } = await supabase
    .from("spot_emergency_facilities")
    .select("*")
    .eq("spot_id", spotId)
    .order("distance_km", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function getSpotReviews(slug: string, spotId: string): Promise<SpotReviewRow[]> {
  const supabase = await createClient();

  if (!supabase) {
    return MOCK_REVIEWS[slug] ?? [];
  }

  const { data, error } = await supabase
    .from("spot_reviews")
    .select("*, profiles:user_id(username)")
    .eq("spot_id", spotId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as (SpotReviewRow & { profiles: { username: string } | null })[]).map((r) => ({
    ...r,
    username: r.profiles?.username,
  }));
}

export async function getProfileByUsername(username: string): Promise<MockProfile | null> {
  // TODO: Supabase 연결 후 profiles/visit_stamps/user_badges/user_titles/reports 조인 쿼리로 교체
  if (username !== MOCK_PROFILE.username) return null;
  return MOCK_PROFILE;
}

export function getAllBadges() {
  return MOCK_BADGES;
}

export async function getLeaderboard(
  track: "general" | "core"
): Promise<MockLeaderboardEntry[]> {
  const supabase = await createClient();

  if (!supabase) {
    return track === "general" ? MOCK_LEADERBOARD_GENERAL : MOCK_LEADERBOARD_CORE;
  }

  const { data, error } = await supabase
    .from("leaderboard_scores")
    .select("rank, score, breakdown, user_id, profiles:user_id(username, display_name, guide_tier)")
    .eq("track", track)
    .eq("period", "all_time")
    .order("score", { ascending: false })
    .limit(20);

  if (error || !data) {
    console.error("getLeaderboard error", error);
    return [];
  }

  type LeaderboardJoinRow = {
    rank: number | null;
    score: number;
    breakdown: Record<string, number> | null;
    profiles: { username: string; display_name: string | null; guide_tier: string } | null;
  };

  return (data as unknown as LeaderboardJoinRow[]).map((row) => ({
    rank: row.rank ?? 0,
    username: row.profiles?.username ?? "unknown",
    displayName: row.profiles?.display_name ?? row.profiles?.username ?? "익명",
    guideTier: row.profiles?.guide_tier ?? "newbie",
    score: row.score,
    breakdown: row.breakdown ?? {},
  }));
}

// ------------------------------------------------------------------
// 2·3단계 — 외부 API 없이 동작하는 기능들
// ------------------------------------------------------------------

/** 수중 생물 도감 태깅 (feature flag: species_field_guide). 공개 정보, 게이트 없음. */
export async function getSpotSpecies(
  spotId: string,
  slug: string
): Promise<(SpeciesRow & { frequency: SpeciesFrequency | null })[]> {
  const supabase = await createClient();
  if (!supabase) {
    return MOCK_SPOT_SPECIES[slug] ?? [];
  }

  const { data, error } = await supabase
    .from("spot_species")
    .select("frequency, species:species_id(id, name, scientific_name, category, icon, created_at)")
    .eq("spot_id", spotId);

  if (error || !data) return [];
  type Row = { frequency: SpeciesFrequency | null; species: SpeciesRow | null };
  return (data as unknown as Row[])
    .filter((r): r is Row & { species: SpeciesRow } => r.species !== null)
    .map((r) => ({ ...r.species, frequency: r.frequency }));
}

/** "오늘 여기 있어요" 체크인 현황 (feature flag: live_checkin_crowd_count). 카운트는 공개. */
export async function getSpotCheckinInfo(
  spotId: string,
  slug: string
): Promise<{ activeCount: number; isCheckedIn: boolean }> {
  const supabase = await createClient();

  if (!supabase) {
    // 목업 모드: 실 체크인이 없으니 스팟 좋아요 수를 기반으로 그럴듯한 값만 보여줍니다.
    const spot = MOCK_SPOTS.find((s) => s.slug === slug);
    return { activeCount: spot ? Math.min(12, Math.floor(spot.like_count / 20)) : 0, isCheckedIn: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count } = await supabase
    .from("spot_checkins")
    .select("id", { count: "exact", head: true })
    .eq("spot_id", spotId)
    .gt("expires_at", new Date().toISOString());

  let isCheckedIn = false;
  if (user) {
    const { data: mine } = await supabase
      .from("spot_checkins")
      .select("id")
      .eq("spot_id", spotId)
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    isCheckedIn = !!mine;
  }

  return { activeCount: count ?? 0, isCheckedIn };
}

/** 접근로 변경 이력 (feature flag: access_route_change_history). 공개 정보. */
export async function getSpotAccessStepRevisions(
  spotId: string,
  slug: string
): Promise<SpotAccessStepRevisionRow[]> {
  const supabase = await createClient();
  if (!supabase) {
    return MOCK_ACCESS_STEP_REVISIONS[slug] ?? [];
  }

  const { data, error } = await supabase
    .from("spot_access_step_revisions")
    .select("*")
    .eq("spot_id", spotId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

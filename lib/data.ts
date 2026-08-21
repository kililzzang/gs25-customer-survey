import { createClient } from "@/lib/supabase/server";
import {
  MOCK_SPOTS,
  MOCK_SAFETY_INFO,
  MOCK_LOCKED_INFO,
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

export async function getSpotsByRegion(region: RegionCode): Promise<SpotRow[]> {
  const supabase = await createClient();

  if (!supabase) {
    return MOCK_SPOTS.filter((s) => s.region === region && s.status !== "hidden" && s.status !== "rejected");
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
    return MOCK_SPOTS.filter((s) => s.status !== "hidden" && s.status !== "rejected");
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
    const spot = MOCK_SPOTS.find((s) => s.slug === slug) ?? null;
    return {
      spot,
      safety: spot ? MOCK_SAFETY_INFO[slug] ?? null : null,
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
 * 잠금 정보(정확한 좌표/접근로/주차팁) 조회.
 * 실 서비스에서는 supabase.rpc('unlock_spot_details', { p_spot_id }) 로 호출하며,
 * 광고 시청 완료(ad_unlocks) 또는 프리미엄 멤버십이 아니면 서버에서 예외를 반환합니다.
 */
export async function getSpotLockedInfo(
  slug: string,
  opts: { unlocked: boolean }
): Promise<SpotLockedInfoRow | null> {
  if (!opts.unlocked) return null;

  const supabase = await createClient();
  if (!supabase) {
    return MOCK_LOCKED_INFO[slug] ?? null;
  }

  const spot = MOCK_SPOTS.find((s) => s.slug === slug);
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
  };
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

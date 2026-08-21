import type {
  SpotRow,
  SpotSafetyInfoRow,
  SpotLockedInfoRow,
  PartnerListingRow,
  BadgeRow,
  SpotReviewRow,
} from "@/lib/types/database";

/**
 * Supabase 프로젝트가 아직 연결되지 않은 개발 단계를 위한 목업 데이터.
 * supabase/seed.sql 의 데이터와 동일한 스팟 목록을 사용합니다.
 * lib/data.ts 가 Supabase 클라이언트 미설정 시 이 데이터로 폴백합니다.
 */

export const MOCK_SPOTS: SpotRow[] = [
  spot("munseom-jeju", "문섬 스노클링 포인트", "jeju",
    "서귀포 앞바다의 대표 스노클링 스팟. 연산호 군락이 유명합니다.",
    33.223, 126.56, 2, 12, 8, "moderate", 22, false, "verified", 88, 20, 142),
  spot("hyeopjae-jeju", "협재 해변 스노클링", "jeju",
    "초보자에게 적합한 얕은 수심의 백사장 스노클링존.",
    33.394, 126.239, 1, 4, 6, "calm", 23, false, "verified", 91, 10, 210),
  spot("gapado-hidden", "가파도 숨은 여", "jeju",
    "현지 다이버들 사이에서만 알려진 조용한 포인트.",
    33.173, 126.271, 3, 9, 7, "moderate", 21, true, "verified", 76, 40, 58),
  spot("sokcho-jangsari", "속초 장사항 인근 포인트", "gangwon",
    "동해의 맑은 시야가 특징인 암초 지형.",
    38.187, 128.61, 2, 10, 9, "moderate", 18, false, "pending", 55, 5, 19),
  spot("goseong-hidden", "고성 무명 여", "gangwon",
    "접근로가 까다로워 아는 사람만 찾는 히든 스팟.",
    38.38, 128.478, 4, 14, 10, "strong", 17, true, "verified", 82, 15, 33),
  spot("taean-mongsanpo", "태안 몽산포 스노클링존", "chungcheong",
    "서해 특유의 갯벌 지형 초입 스노클링 구역.",
    36.786, 126.194, 1, 3, 3, "moderate", 20, false, "verified", 70, 60, 27),
  spot("ulleungdo-jeodong", "울릉도 저동항 포인트", "gyeongbuk",
    "청정 동해 수심과 다양한 어종을 볼 수 있는 곳.",
    37.503, 130.91, 3, 15, 12, "moderate", 19, false, "verified", 93, 8, 165),
  spot("geoje-hakdong", "거제 학동 몽돌해변 포인트", "gyeongnam",
    "몽돌해변과 이어지는 완만한 수중 지형.",
    34.782, 128.64, 2, 8, 7, "calm", 21, false, "verified", 80, 25, 74),
  spot("yeosu-hidden", "여수 외돌개 뒤편 여", "jeolla",
    "현지 어민들만 알던 포인트, 최근 제보로 알려짐.",
    34.708, 127.755, 3, 11, 8, "moderate", 20, true, "pending", 48, null, 12),
  spot("incheon-muuido", "인천 무의도 스노클링존", "gyeonggi",
    "수도권에서 가장 가까운 서해 스노클링 스팟.",
    37.428, 126.373, 1, 4, 4, "moderate", 19, false, "needs_update", 35, 220, 41),
  spot("okinawa-blue-cave", "오키나와 블루케이브", "overseas",
    "일본 오키나와의 대표 스노클링/다이빙 명소.",
    26.505, 127.955, 2, 18, 15, "calm", 25, false, "verified", 96, 12, 301),
  spot("cebu-moalboal", "세부 모알보알 사딘런", "overseas",
    "수백만 마리의 정어리떼로 유명한 스노클링 포인트.",
    9.958, 123.397, 3, 20, 18, "calm", 27, false, "verified", 97, 18, 412),
];

export const MOCK_SAFETY_INFO: Record<string, SpotSafetyInfoRow> = Object.fromEntries(
  MOCK_SPOTS.map((s) => [
    s.slug,
    {
      spot_id: s.id,
      emergency_contacts: [
        { label: "해양경찰 122", phone: "122" },
        { label: "인근 파출소", phone: "110" },
      ],
      current_warning: s.is_hidden
        ? "히든 스팟은 구조 접근이 어려울 수 있으니 반드시 2인 이상 동행하세요."
        : null,
      updated_at: s.updated_at,
    },
  ])
);

export const MOCK_LOCKED_INFO: Record<string, SpotLockedInfoRow> = Object.fromEntries(
  MOCK_SPOTS.map((s) => [
    s.slug,
    {
      spot_id: s.id,
      exact_lat: s.approx_lat + 0.0007,
      exact_lng: s.approx_lng - 0.0005,
      access_route: "해안도로에서 도보 8분, 방파제 끝 계단으로 진입",
      parking_tip: "인근 공영주차장 이용 (성수기 만차 잦음, 07시 이전 도착 권장)",
      contributor_id: null,
      updated_at: s.updated_at,
    },
  ])
);

export const MOCK_PARTNER_LISTINGS: PartnerListingRow[] = [
  partner("munseom-jeju", "물빛 파트너 다이브샵", "rental", "장비 대여 예약"),
  partner("okinawa-blue-cave", "물빛 파트너 다이브샵", "rental", "장비 대여 예약"),
  partner("cebu-moalboal", "물빛 파트너 다이브샵", "rental", "장비 대여 예약"),
  partner("hyeopjae-jeju", "물빛 투어 파트너", "tour", "스노클링 투어 예약"),
  partner("ulleungdo-jeodong", "물빛 투어 파트너", "tour", "스노클링 투어 예약"),
];

export const MOCK_REVIEWS: Record<string, SpotReviewRow[]> = {
  "munseom-jeju": [
    {
      id: "r1", spot_id: "munseom-jeju", user_id: "u1", username: "aqua_min",
      rating: 5, body: "연산호가 정말 예뻐요. 오전에 가면 시야가 훨씬 좋습니다.",
      visited_at: "2026-07-12", created_at: iso(15),
    },
    {
      id: "r2", spot_id: "munseom-jeju", user_id: "u2", username: "seabreeze",
      rating: 4, body: "조류가 조금 있는 편이라 초보자는 가이드 동반 추천.",
      visited_at: "2026-06-30", created_at: iso(30),
    },
  ],
  "hyeopjae-jeju": [
    {
      id: "r3", spot_id: "hyeopjae-jeju", user_id: "u3", username: "finfollower",
      rating: 5, body: "아이랑 같이 가기 좋아요. 수심이 얕고 안전합니다.",
      visited_at: "2026-08-01", created_at: iso(5),
    },
  ],
  "gapado-hidden": [
    {
      id: "r4", spot_id: "gapado-hidden", user_id: "u4", username: "hidden_seeker",
      rating: 5, body: "사람이 거의 없어서 조용히 즐기기 좋았어요. 접근로가 헷갈리니 상세정보 꼭 확인하세요.",
      visited_at: "2026-07-20", created_at: iso(10),
    },
  ],
};

function iso(daysAgo: number) {
  return new Date(Date.now() - daysAgo * 86400000).toISOString();
}

export interface MockProfile {
  username: string;
  displayName: string;
  guideTier: string;
  trustScore: number;
  bio: string;
  titles: string[];
  visitedSpotSlugs: { slug: string; visitedAt: string }[];
  badgeKeys: string[];
  reports: { spotName: string; type: string; status: string; createdAt: string; points: number }[];
}

export const MOCK_PROFILE: MockProfile = {
  username: "aqua_min",
  displayName: "아쿠아민",
  guideTier: "master",
  trustScore: 92,
  bio: "제주·오키나와 위주로 스노클링 다니는 중. 히든 스팟 찾는 걸 좋아해요.",
  titles: ["가파도 숨은 여 최초 발견자"],
  visitedSpotSlugs: [
    { slug: "munseom-jeju", visitedAt: "2026-07-12" },
    { slug: "hyeopjae-jeju", visitedAt: "2026-06-02" },
    { slug: "gapado-hidden", visitedAt: "2026-05-18" },
    { slug: "okinawa-blue-cave", visitedAt: "2026-04-30" },
  ],
  badgeKeys: ["first_report", "hidden_hunter", "local_guide"],
  reports: [
    { spotName: "가파도 숨은 여", type: "신규 스팟", status: "승인됨", createdAt: "2026-05-15", points: 5 },
    { spotName: "문섬 스노클링 포인트", type: "상세정보(접근로)", status: "승인됨", createdAt: "2026-06-01", points: 3 },
    { spotName: "협재 해변 스노클링", type: "정확했어요 검증", status: "승인됨", createdAt: "2026-06-10", points: 1 },
    { spotName: "여수 외돌개 뒤편 여", type: "신규 스팟", status: "검토중", createdAt: "2026-08-10", points: 0 },
  ],
};

export const MOCK_BADGES: BadgeRow[] = [
  { id: "b1", key: "first_report", name: "첫 제보", description: "스팟을 처음으로 제보했어요", icon: "🧭" },
  { id: "b2", key: "hidden_hunter", name: "히든 스팟 헌터", description: "히든 스팟을 5곳 이상 발굴했어요", icon: "🕵️" },
  { id: "b3", key: "detail_master", name: "디테일 마스터", description: "접근로/주차 정보를 10건 이상 기재했어요", icon: "🗺️" },
  { id: "b4", key: "local_guide", name: "로컬 가이드", description: "해당 지역 방문 스탬프 10개 달성", icon: "🏅" },
];

export interface MockLeaderboardEntry {
  rank: number;
  username: string;
  displayName: string;
  guideTier: string;
  score: number;
  breakdown: Record<string, number>;
}

export const MOCK_LEADERBOARD_GENERAL: MockLeaderboardEntry[] = [
  { rank: 1, username: "aqua_min", displayName: "아쿠아민", guideTier: "master", score: 812, breakdown: { uploads: 58, likes_received: 754 } },
  { rank: 2, username: "diver_sol", displayName: "다이버솔", guideTier: "local_guide", score: 640, breakdown: { uploads: 41, likes_received: 599 } },
  { rank: 3, username: "coral_hunter", displayName: "코랄헌터", guideTier: "local_guide", score: 511, breakdown: { uploads: 33, likes_received: 478 } },
  { rank: 4, username: "seabreeze", displayName: "씨브리즈", guideTier: "explorer", score: 340, breakdown: { uploads: 22, likes_received: 318 } },
  { rank: 5, username: "finfollower", displayName: "핀팔로워", guideTier: "explorer", score: 265, breakdown: { uploads: 19, likes_received: 246 } },
];

export const MOCK_LEADERBOARD_CORE: MockLeaderboardEntry[] = [
  { rank: 1, username: "hidden_seeker", displayName: "히든시커", guideTier: "master", score: 96, breakdown: { hidden_discovery: 65, detail_first: 24, verification: 7 } },
  { rank: 2, username: "route_master", displayName: "루트마스터", guideTier: "local_guide", score: 78, breakdown: { hidden_discovery: 40, detail_first: 33, verification: 5 } },
  { rank: 3, username: "aqua_min", displayName: "아쿠아민", guideTier: "master", score: 61, breakdown: { hidden_discovery: 35, detail_first: 21, verification: 5 } },
  { rank: 4, username: "deepdiver_jo", displayName: "딥다이버조", guideTier: "explorer", score: 44, breakdown: { hidden_discovery: 20, detail_first: 18, verification: 6 } },
  { rank: 5, username: "coral_hunter", displayName: "코랄헌터", guideTier: "explorer", score: 33, breakdown: { hidden_discovery: 15, detail_first: 15, verification: 3 } },
];

function spot(
  slug: string,
  name: string,
  region: SpotRow["region"],
  description: string,
  approx_lat: number,
  approx_lng: number,
  depth_min_m: number,
  depth_max_m: number,
  visibility_m: number,
  current_level: SpotRow["current_level"],
  water_temp_c: number,
  is_hidden: boolean,
  status: SpotRow["status"],
  trust_score: number,
  verifiedDaysAgo: number | null,
  like_count: number
): SpotRow {
  const now = Date.now();
  const iso = (daysAgo: number | null) =>
    daysAgo === null ? null : new Date(now - daysAgo * 86400000).toISOString();
  return {
    id: slug,
    slug,
    name,
    region,
    description,
    approx_lat,
    approx_lng,
    depth_min_m,
    depth_max_m,
    visibility_m,
    current_level,
    water_temp_c,
    is_hidden,
    status,
    trust_score,
    last_verified_at: iso(verifiedDaysAgo),
    like_count,
    first_reporter_id: null,
    created_at: iso(verifiedDaysAgo ?? 30)!,
    updated_at: iso(verifiedDaysAgo ?? 30)!,
  };
}

function partner(
  spotSlug: string,
  partner_name: string,
  listing_type: "rental" | "tour",
  cta_label: string
): PartnerListingRow {
  const s = MOCK_SPOTS.find((s) => s.slug === spotSlug);
  return {
    id: `${spotSlug}-${listing_type}`,
    spot_id: s?.id ?? spotSlug,
    partner_name,
    listing_type,
    banner_url: null,
    cta_url: "https://example.com/booking",
    cta_label,
    is_active: true,
    priority: 1,
    created_at: new Date().toISOString(),
  };
}

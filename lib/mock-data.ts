import type {
  SpotRow,
  SpotSafetyInfoRow,
  SpotLockedInfoRow,
  SpotAccessStepRow,
  SpotParkingOptionRow,
  SpotEmergencyFacilityRow,
  PartnerListingRow,
  BadgeRow,
  SpotReviewRow,
  SpeciesRow,
  SpeciesFrequency,
  SpotAccessStepRevisionRow,
  SpotSurfConditionsRow,
  SpotActivityDifficultyRow,
  ActivitySafetyTemplateRow,
  UserCertificationRow,
  CommunityPostRow,
  CommunityReplyRow,
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
    33.394, 126.239, 1, 4, 6, "calm", 23, false, "verified", 91, 10, 210,
    { activities: ["snorkeling", "sea_swimming"], terrain: "sand_beach" }),
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
    36.786, 126.194, 1, 3, 3, "moderate", 20, false, "verified", 70, 60, 27,
    { activities: ["snorkeling", "sea_swimming"], terrain: "sand_beach" }),
  spot("ulleungdo-jeodong", "울릉도 저동항 포인트", "gyeongbuk",
    "청정 동해 수심과 다양한 어종을 볼 수 있는 곳.",
    37.503, 130.91, 3, 15, 12, "moderate", 19, false, "verified", 93, 8, 165),
  spot("geoje-hakdong", "거제 학동 몽돌해변 포인트", "gyeongnam",
    "몽돌해변과 이어지는 완만한 수중 지형.",
    34.782, 128.64, 2, 8, 7, "calm", 21, false, "verified", 80, 25, 74,
    { activities: ["snorkeling", "sea_swimming"] }),
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

  // ------------------------------------------------------------------
  // 실제 스팟 21곳 (2026-08 제보 목록 기반)
  // ⚠️ 좌표는 실사 측정치가 아닌 지도 기준 추정치입니다 (coordinatesVerified: false).
  //    런칭 전 반드시 현장 실사로 정확한 좌표를 재확인해야 합니다.
  // ------------------------------------------------------------------

  // 강원
  spot("jangho-hang-samcheok", "장호항", "gangwon",
    "한국의 나폴리, 갯바위가 파도를 막아주는 잔잔한 포인트",
    37.024, 129.322, 1, 4, 6, "calm", 19, false, "verified", 60, null, 0,
    { subregion: "삼척", difficulty: "beginner" }),
  spot("galnam-hang-samcheok", "갈남항", "gangwon",
    "조용한 어촌마을, 맑은 수질의 숨은 명소",
    37.011, 129.317, 1, 4, 7, "calm", 19, true, "verified", 60, null, 0,
    { subregion: "삼척", difficulty: "beginner" }),
  spot("songjiho-beach-goseong", "송지호해수욕장", "gangwon",
    "긴 해변, 서낭바위 쪽 스노클링 포인트 형성",
    38.313, 128.499, 1, 3, 5, "calm", 20, false, "verified", 60, null, 0,
    { subregion: "고성", difficulty: "beginner" }),
  spot("hajodae-point-yangyang", "하조대전망대 포인트", "gangwon",
    "가두리 지형으로 파도 잔잔, 수심 3~5m 균일",
    38.092, 128.789, 3, 5, 6, "calm", 19, true, "verified", 60, null, 0,
    { subregion: "양양", difficulty: "beginner" }),
  spot("namae-3ri-yangyang", "남애3리", "gangwon",
    "로컬 서퍼들 사이에서 알려진 조용한 포인트",
    37.995, 128.798, 1, 4, 6, "calm", 19, true, "verified", 60, null, 0,
    { subregion: "양양", difficulty: "beginner" }),
  spot("sodol-beach-yangyang", "소돌해변", "gangwon",
    "작은 규모의 한적한 스노클링 스팟",
    38.075, 128.628, 1, 3, 5, "calm", 19, true, "verified", 60, null, 0,
    { subregion: "양양", difficulty: "beginner" }),
  spot("simgok-hang-gangneung", "심곡항", "gangwon",
    "7번 국도 옆 빨간 등대 아래 비밀의 포인트",
    37.729, 128.909, 1, 4, 7, "calm", 18, true, "verified", 60, null, 0,
    { subregion: "강릉", difficulty: "beginner" }),
  spot("jajakdo-beach-goseong", "자작도해변", "gangwon",
    "완만한 긴 해안선, 소나무숲과 청정 동해",
    38.450, 128.474, 1, 3, 6, "calm", 20, false, "verified", 60, null, 0,
    { subregion: "고성", difficulty: "beginner" }),
  spot("panji-hang-goseong", "판지항", "gangwon",
    "낚시 명소에서 스노클링 명소로 부상, 안전요원 없음 주의",
    38.466, 128.470, 3, 12, 8, "moderate", 18, true, "verified", 55, null, 0,
    { subregion: "고성", difficulty: "intermediate" }),

  // 경북
  spot("nagok-beach-uljin", "나곡해수욕장", "gyeongbuk",
    "동해 대표 스쿠버·스노클링 지역",
    36.993, 129.417, 3, 20, 10, "moderate", 19, false, "verified", 60, null, 0,
    { subregion: "울진", difficulty: "intermediate" }),
  spot("hujeong-beach-uljin", "후정해수욕장", "gyeongbuk",
    "울진 다이빙 명소 중 한 곳",
    36.982, 129.416, 3, 18, 9, "moderate", 19, false, "verified", 60, null, 0,
    { subregion: "울진", difficulty: "intermediate" }),
  spot("yangjeong-beach-uljin", "양정해수욕장", "gyeongbuk",
    "다양한 다이빙 포인트가 밀집한 구역",
    36.970, 129.415, 3, 15, 9, "moderate", 19, true, "verified", 60, null, 0,
    { subregion: "울진", difficulty: "intermediate" }),
  spot("gusan-beach-uljin", "구산해수욕장", "gyeongbuk",
    "난파선 포인트로도 알려진 해안선",
    36.960, 129.414, 5, 25, 8, "moderate", 19, true, "verified", 60, null, 0,
    { subregion: "울진", difficulty: "intermediate" }),
  spot("hupo-beach-uljin", "후포해수욕장", "gyeongbuk",
    "울진 대표 다이빙 명소",
    36.677, 129.453, 3, 18, 10, "moderate", 19, false, "verified", 60, null, 0,
    { subregion: "울진", difficulty: "intermediate" }),
  spot("guryongpo-beach-pohang", "구룡포해변", "gyeongbuk",
    "수심 10~30m, 수중바위와 산호초 관찰 가능",
    35.988, 129.559, 10, 30, 9, "moderate", 20, false, "verified", 60, null, 0,
    { subregion: "포항", difficulty: "intermediate" }),
  spot("gampo-songdaemal-gyeongju", "감포바다 (송대말등대)", "gyeongbuk",
    "에메랄드빛 해변, 조용한 숨은 명소로 부상 중",
    35.799, 129.499, 1, 5, 8, "calm", 21, true, "verified", 60, null, 0,
    { subregion: "경주", difficulty: "beginner" }),

  // 경남/전남
  spot("oryukdo-busan", "오륙도 인근", "gyeongnam",
    "도시 속 숨은 다이빙 포인트, 절벽 지형",
    35.101, 129.111, 5, 20, 8, "moderate", 22, true, "verified", 55, null, 0,
    { subregion: "부산 남구", difficulty: "intermediate" }),
  spot("gujora-yundoldo-geoje", "거제 구조라 윤돌섬", "gyeongnam",
    "카약/제트스키로 접근하는 무인도, 독특한 바위 지형",
    34.775, 128.700, 3, 15, 9, "moderate", 22, true, "verified", 55, null, 0,
    { subregion: "거제", difficulty: "intermediate" }),
  spot("tongyeong-hongdo", "통영 홍도", "gyeongnam",
    "한려해상국립공원의 보석, 수중동굴과 청정 바다",
    34.397, 128.221, 5, 20, 12, "moderate", 22, false, "verified", 60, null, 0,
    { subregion: "통영", difficulty: "intermediate" }),
  spot("yeosu-ungcheon", "여수 웅천", "jeolla",
    "블루홀 느낌의 깊고 푸른 바다, 조류 적어 고요함",
    34.708, 127.663, 5, 25, 10, "calm", 22, true, "verified", 55, null, 0,
    { subregion: "여수", difficulty: "intermediate" }),
  spot("mijo-hang-namhae", "미조항 인근 (남해)", "gyeongnam",
    "근해부터 먼바다까지 다양한 다이빙 포인트",
    34.756, 128.028, 5, 20, 10, "moderate", 23, false, "verified", 60, null, 0,
    { subregion: "남해", difficulty: "intermediate" }),

  // ------------------------------------------------------------------
  // 서핑 스팟 2곳 (2차 우선순위 — 강원 양양)
  // ------------------------------------------------------------------
  spot("jukdo-beach-yangyang", "죽도해변", "gangwon",
    "국내 대표 서핑 스팟, 초보자 서핑 스쿨이 밀집한 해변",
    38.113, 128.799, 1, 3, 6, "moderate", 19, false, "verified", 75, 20, 0,
    { subregion: "양양", activities: ["surfing"], terrain: "sand_beach" }),
  spot("ingu-beach-yangyang", "인구해변", "gangwon",
    "죽도해변 인근의 또 다른 서핑 명소, 상대적으로 한적함",
    38.099, 128.789, 1, 3, 6, "moderate", 19, true, "verified", 65, 30, 0,
    { subregion: "양양", activities: ["surfing"], terrain: "sand_beach" }),
];

export const MOCK_SURF_CONDITIONS: Record<string, SpotSurfConditionsRow> = {
  "jukdo-beach-yangyang": {
    spot_id: "jukdo-beach-yangyang",
    wave_height_min_m: 0.5,
    wave_height_max_m: 1.2,
    swell_period_sec: 8,
    wind_direction: "offshore",
    break_type: "beach_break",
    updated_at: new Date().toISOString(),
  },
  "ingu-beach-yangyang": {
    spot_id: "ingu-beach-yangyang",
    wave_height_min_m: 0.6,
    wave_height_max_m: 1.5,
    swell_period_sec: 9,
    wind_direction: "offshore",
    break_type: "beach_break",
    updated_at: new Date().toISOString(),
  },
};

export const MOCK_ACTIVITY_DIFFICULTY: Record<string, SpotActivityDifficultyRow[]> = {
  "jukdo-beach-yangyang": [{ spot_id: "jukdo-beach-yangyang", activity: "surfing", difficulty: "beginner" }],
  "ingu-beach-yangyang": [{ spot_id: "ingu-beach-yangyang", activity: "surfing", difficulty: "intermediate" }],
};

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
      estimated_walk_minutes: 8,
      has_restroom: true,
      has_shower: false,
      contributor_id: null,
      updated_at: s.updated_at,
    },
  ])
);

// ------------------------------------------------------------------
// "정확한 위치와 접근 방법" 1단계 — 스텝 카드 / 주차 옵션 / 응급시설
// 대표 스팟 위주로 시딩. 나머지 스팟은 빈 배열(정보 없음 상태)로 자연스럽게 처리됩니다.
// ------------------------------------------------------------------

let stepIdCounter = 0;

function step(
  spotSlug: string,
  step_order: number,
  title: string,
  description: string,
  terrain_type: SpotAccessStepRow["terrain_type"],
  photo_storage_path: string | null = null
): SpotAccessStepRow {
  const s = MOCK_SPOTS.find((sp) => sp.slug === spotSlug);
  stepIdCounter += 1;
  return {
    id: `${spotSlug}-step-${stepIdCounter}`,
    spot_id: s?.id ?? spotSlug,
    step_order,
    title,
    description,
    photo_storage_path,
    lat: s ? s.approx_lat + step_order * 0.0002 : null,
    lng: s ? s.approx_lng - step_order * 0.0002 : null,
    terrain_type,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

let parkingIdCounter = 0;

function parking(
  spotSlug: string,
  label: string,
  parking_type: SpotParkingOptionRow["parking_type"],
  is_primary: boolean,
  note: string | null
): SpotParkingOptionRow {
  const s = MOCK_SPOTS.find((sp) => sp.slug === spotSlug);
  parkingIdCounter += 1;
  return {
    id: `${spotSlug}-parking-${parkingIdCounter}`,
    spot_id: s?.id ?? spotSlug,
    label,
    parking_type,
    lat: s ? s.approx_lat + 0.001 : null,
    lng: s ? s.approx_lng + 0.001 : null,
    note,
    is_primary,
    created_at: new Date().toISOString(),
  };
}

let facilityIdCounter = 0;

function facility(
  spotSlug: string,
  name: string,
  phone: string,
  facility_type: SpotEmergencyFacilityRow["facility_type"],
  distance_km: number
): SpotEmergencyFacilityRow {
  const s = MOCK_SPOTS.find((sp) => sp.slug === spotSlug);
  facilityIdCounter += 1;
  return {
    id: `${spotSlug}-facility-${facilityIdCounter}`,
    spot_id: s?.id ?? spotSlug,
    name,
    phone,
    facility_type,
    distance_km,
    lat: null,
    lng: null,
    created_at: new Date().toISOString(),
  };
}

export const MOCK_ACCESS_STEPS: Record<string, SpotAccessStepRow[]> = {
  "munseom-jeju": [
    step("munseom-jeju", 1, "새섬 주차장 도착", "공영주차장에 주차 후 도보 시작", "flat"),
    step("munseom-jeju", 2, "산책로 300m 이동", "새섬 연결다리 방향 평탄한 산책로", "flat"),
    step("munseom-jeju", 3, "계단 40m 하강", "방파제 옆 계단으로 하강, 미끄럼 주의", "stairs"),
    step("munseom-jeju", 4, "우측 진입", "표지판 지나 우측 바위 진입로로 입수", "rock"),
  ],
  "hyeopjae-jeju": [
    step("hyeopjae-jeju", 1, "협재해수욕장 주차장 도착", "해변 바로 앞 주차장", "flat"),
    step("hyeopjae-jeju", 2, "백사장 진입", "완만한 백사장으로 바로 입수 가능", "sand"),
  ],
  "gapado-hidden": [
    step("gapado-hidden", 1, "가파도 선착장 도착", "운진항에서 도선 이용 (사전 예약 필요)", "flat"),
    step("gapado-hidden", 2, "해안 산책로 500m", "청보리밭 옆 산책로를 따라 이동", "flat"),
    step("gapado-hidden", 3, "암반 지대 진입", "돌출된 암반을 조심히 넘어 진입", "rock"),
  ],
  "jangho-hang-samcheok": [
    step("jangho-hang-samcheok", 1, "장호항 공영주차장", "항구 초입 무료 공영주차장", "flat"),
    step("jangho-hang-samcheok", 2, "갯바위 방향 도보 5분", "해안 데크길을 따라 이동", "flat"),
    step("jangho-hang-samcheok", 3, "계단 20m 하강 후 진입", "갯바위 계단으로 내려가 진입", "stairs"),
  ],
  "guryongpo-beach-pohang": [
    step("guryongpo-beach-pohang", 1, "구룡포해변 주차장", "해변 인접 유료 주차장", "flat"),
    step("guryongpo-beach-pohang", 2, "방파제 끝까지 이동", "방파제를 따라 끝까지 도보 이동", "flat"),
    step("guryongpo-beach-pohang", 3, "수중바위 지대 진입", "너울 있는 날은 진입 자제 권장", "rock"),
  ],
};

export const MOCK_PARKING_OPTIONS: Record<string, SpotParkingOptionRow[]> = {
  "munseom-jeju": [
    parking("munseom-jeju", "새섬 공영주차장", "free", true, "성수기 만차 잦음, 07시 이전 권장"),
    parking("munseom-jeju", "서귀포항 대형 주차장", "paid", false, "도보 12분, 만차 시 대안"),
  ],
  "hyeopjae-jeju": [parking("hyeopjae-jeju", "협재해수욕장 공영주차장", "paid", true, "성수기 혼잡")],
  "gapado-hidden": [parking("gapado-hidden", "운진항 주차장 (본섬)", "free", true, "가파도 내 차량 진입 불가")],
  "jangho-hang-samcheok": [parking("jangho-hang-samcheok", "장호항 공영주차장", "free", true, null)],
  "guryongpo-beach-pohang": [
    parking("guryongpo-beach-pohang", "구룡포해변 주차장", "paid", true, "성수기 회전 빠름"),
    parking("guryongpo-beach-pohang", "구룡포항 갓길 주차", "free", false, "성수기에만 대안으로 이용"),
  ],
};

export const MOCK_EMERGENCY_FACILITIES: Record<string, SpotEmergencyFacilityRow[]> = {
  "munseom-jeju": [facility("munseom-jeju", "서귀포의료원", "064-730-3000", "hospital", 3.8)],
  "hyeopjae-jeju": [facility("hyeopjae-jeju", "한림공공보건의료센터", "064-796-7575", "health_center", 4.1)],
  "gapado-hidden": [facility("gapado-hidden", "대정보건지소 가파출장소", "064-760-4141", "health_center", 1.2)],
  "jangho-hang-samcheok": [facility("jangho-hang-samcheok", "삼척의료원", "033-570-9241", "hospital", 12.5)],
  "guryongpo-beach-pohang": [facility("guryongpo-beach-pohang", "포항의료원", "054-289-7000", "hospital", 9.2)],
};

export const MOCK_PARTNER_LISTINGS: PartnerListingRow[] = [
  partner("munseom-jeju", "물빛 파트너 다이브샵", "rental", "장비 대여 예약"),
  partner("okinawa-blue-cave", "물빛 파트너 다이브샵", "rental", "장비 대여 예약"),
  partner("cebu-moalboal", "물빛 파트너 다이브샵", "rental", "장비 대여 예약"),
  partner("hyeopjae-jeju", "물빛 투어 파트너", "tour", "스노클링 투어 예약"),
  partner("ulleungdo-jeodong", "물빛 투어 파트너", "tour", "스노클링 투어 예약"),
  // 경로 기반 로컬 제휴처 추천 (17번) — 가는 길목 맛집/카페
  partner("munseom-jeju", "새섬 해녀의 집", "route_food", "가는 길 해녀 물회 맛집"),
  partner("hyeopjae-jeju", "협재 브레이크타임", "route_cafe", "해변 앞 오션뷰 카페"),
  partner("jangho-hang-samcheok", "장호항 회센터", "route_food", "장호항 대표 활어회 거리"),
];

function species(
  id: string,
  name: string,
  scientific_name: string,
  category: string,
  icon: string
): SpeciesRow {
  return { id, name, scientific_name, category, icon, created_at: new Date().toISOString() };
}

export const MOCK_SPECIES: SpeciesRow[] = [
  species("clownfish", "흰동가리", "Amphiprion ocellaris", "어류", "🐠"),
  species("soft-coral", "연산호", "Dendronephthya", "산호", "🪸"),
  species("sea-urchin", "성게", "Strongylocentrotus", "극피동물", "🦔"),
  species("abalone", "전복", "Haliotis discus", "연체동물", "🐚"),
  species("rockfish", "쏨뱅이", "Sebastiscus marmoratus", "어류", "🐟"),
];

function speciesTag(key: string, frequency: SpeciesFrequency) {
  const s = MOCK_SPECIES.find((sp) => sp.id === key);
  if (!s) throw new Error(`unknown species key: ${key}`);
  return { ...s, frequency };
}

export const MOCK_SPOT_SPECIES: Record<string, (SpeciesRow & { frequency: SpeciesFrequency })[]> = {
  "munseom-jeju": [speciesTag("soft-coral", "common"), speciesTag("rockfish", "occasional")],
  "hyeopjae-jeju": [speciesTag("sea-urchin", "common")],
  "gapado-hidden": [speciesTag("abalone", "occasional"), speciesTag("rockfish", "common")],
  "okinawa-blue-cave": [speciesTag("clownfish", "common"), speciesTag("soft-coral", "common")],
  "cebu-moalboal": [speciesTag("clownfish", "common")],
};

export const MOCK_ACCESS_STEP_REVISIONS: Record<string, SpotAccessStepRevisionRow[]> = {
  "jangho-hang-samcheok": [
    {
      id: "jangho-hang-samcheok-rev-1",
      spot_id: "jangho-hang-samcheok",
      reason: "2026년 7월 폭우로 갯바위 계단 일부 유실, 임시 우회로로 안내",
      snapshot: { note: "3번 스텝(계단 20m 하강)이 기존에는 15m였음" },
      changed_by: null,
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
  ],
};

export const MOCK_REVIEWS: Record<string, SpotReviewRow[]> = {
  "munseom-jeju": [
    {
      id: "r1", spot_id: "munseom-jeju", user_id: "u1", username: "aqua_min",
      rating: 5, body: "연산호가 정말 예뻐요. 오전에 가면 시야가 훨씬 좋습니다.",
      crowd_tag: "moderate",
      visited_at: "2026-07-12", created_at: iso(15),
    },
    {
      id: "r2", spot_id: "munseom-jeju", user_id: "u2", username: "seabreeze",
      rating: 4, body: "조류가 조금 있는 편이라 초보자는 가이드 동반 추천.",
      crowd_tag: "crowded",
      visited_at: "2026-06-30", created_at: iso(30),
    },
  ],
  "hyeopjae-jeju": [
    {
      id: "r3", spot_id: "hyeopjae-jeju", user_id: "u3", username: "finfollower",
      rating: 5, body: "아이랑 같이 가기 좋아요. 수심이 얕고 안전합니다.",
      crowd_tag: "crowded",
      visited_at: "2026-08-01", created_at: iso(5),
    },
  ],
  "gapado-hidden": [
    {
      id: "r4", spot_id: "gapado-hidden", user_id: "u4", username: "hidden_seeker",
      rating: 5, body: "사람이 거의 없어서 조용히 즐기기 좋았어요. 접근로가 헷갈리니 상세정보 꼭 확인하세요.",
      crowd_tag: "quiet",
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

/**
 * 핵심 트랙의 액티비티별 서브랭킹 (leaderboard_scores.activity, supabase/migrations/0018).
 * 아직 서핑만 시드 스팟이 있어 서핑만 채워두고, 나머지 액티비티는 데이터가 쌓이면 추가합니다.
 */
export const MOCK_LEADERBOARD_CORE_BY_ACTIVITY: Partial<Record<string, MockLeaderboardEntry[]>> = {
  surfing: [
    { rank: 1, username: "seabreeze", displayName: "씨브리즈", guideTier: "explorer", score: 12, breakdown: { new_spot: 2, detail_first: 6 } },
    { rank: 2, username: "finfollower", displayName: "핀팔로워", guideTier: "explorer", score: 8, breakdown: { new_spot: 1, detail_first: 5 } },
  ],
};

// ------------------------------------------------------------------
// 액티비티 안전정보 템플릿 — supabase/migrations/0018 시딩값과 동일하게 유지
// ------------------------------------------------------------------
export const MOCK_ACTIVITY_SAFETY_TEMPLATES: ActivitySafetyTemplateRow[] = [
  { activity: "snorkeling", title: "조류 경고", body: "조류가 강한 날은 입수를 자제하고, 반드시 구조 튜브·부이를 착용하세요." },
  { activity: "sea_swimming", title: "조류 경고", body: "이안류(역조류) 발생 시 당황하지 말고 해안과 평행하게 헤엄쳐 빠져나오세요." },
  { activity: "surfing", title: "리프/암초 주의", body: "간조 시 리프 브레이크 지형은 수심이 얕아질 수 있습니다. 핀 부상에 유의하세요." },
  { activity: "freediving", title: "블랙아웃 위험", body: "얕은물 블랙아웃(shallow water blackout)은 예고 없이 발생합니다. 반드시 버디와 동행하고 혼자 잠수하지 마세요." },
  { activity: "scuba", title: "감압병·비상상승 절차", body: "무감압한계(NDL)를 넘기지 말고, 상승 시 분당 9m 이하로 천천히 상승하며 안전정지(5m, 3분)를 지키세요. 감압병 의심 증상 발생 시 즉시 최인접 고압산소 치료 시설로 이동하세요." },
];

// ------------------------------------------------------------------
// 공인 자격증 (프로필 표시용, MOCK_PROFILE 소유자 기준)
// ------------------------------------------------------------------
export const MOCK_CERTIFICATIONS: UserCertificationRow[] = [
  {
    id: "cert1", user_id: "u1", org: "PADI", level: "Advanced Open Water",
    cert_number: "PA-2024-88214", issued_at: "2024-03-02", verified: true, created_at: iso(120),
  },
  {
    id: "cert2", user_id: "u1", org: "AIDA", level: "Freediver Level 2",
    cert_number: null, issued_at: "2025-01-10", verified: false, created_at: iso(20),
  },
];

// ------------------------------------------------------------------
// 액티비티별 커뮤니티 게시판 (신규 기능, feature_flags.community_board)
// ------------------------------------------------------------------
export const MOCK_COMMUNITY_POSTS: CommunityPostRow[] = [
  {
    id: "cp1", author_id: "u2", username: "seabreeze", activity: "snorkeling",
    title: "문섬 요즘 시야 어떤가요?", body: "이번 주말에 문섬 가려는데 최근 시야 정보 아시는 분 계신가요?",
    reply_count: 2, created_at: iso(3), updated_at: iso(3),
  },
  {
    id: "cp2", author_id: "u3", username: "finfollower", activity: "surfing",
    title: "죽도해변 초보 서핑 스쿨 추천해주세요", body: "9월 초에 양양 죽도해변에서 처음 서핑 배워보려고 합니다. 강습 후기 있으신 분?",
    reply_count: 1, created_at: iso(6), updated_at: iso(6),
  },
];

export const MOCK_COMMUNITY_REPLIES: Record<string, CommunityReplyRow[]> = {
  cp1: [
    { id: "cr1", post_id: "cp1", author_id: "u1", username: "aqua_min", body: "지난 화요일 기준으로 6m 정도 나왔어요. 오전이 더 좋았습니다.", created_at: iso(2) },
    { id: "cr2", post_id: "cp1", author_id: "u4", username: "hidden_seeker", body: "저도 이번 주말 갈 예정이라 궁금하네요 :)", created_at: iso(1) },
  ],
  cp2: [
    { id: "cr3", post_id: "cp2", author_id: "u1", username: "aqua_min", body: "죽도 서핑스쿨 다 비슷한데 오전반이 파도가 조금 더 순해서 초보자에게 좋아요.", created_at: iso(5) },
  ],
};

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
  like_count: number,
  opts: {
    subregion?: string;
    /** 좌표 실사 검증 여부. 미지정 시 false(미검증) — 지금까지의 시드 좌표는 전부 추정치입니다. */
    coordinatesVerified?: boolean;
    difficulty?: SpotRow["difficulty"];
    syntheticTest?: boolean;
    /** 미지정 시 ["snorkeling"] — 기존 스팟은 전부 스노클링 스팟이었으므로 하위호환 기본값. */
    activities?: SpotRow["activities"];
    terrain?: SpotRow["terrain"];
  } = {}
): SpotRow {
  const now = Date.now();
  const iso = (daysAgo: number | null) =>
    daysAgo === null ? null : new Date(now - daysAgo * 86400000).toISOString();
  return {
    id: slug,
    slug,
    name,
    region,
    subregion: opts.subregion ?? null,
    description,
    approx_lat,
    approx_lng,
    coordinates_verified: opts.coordinatesVerified ?? false,
    depth_min_m,
    depth_max_m,
    visibility_m,
    current_level,
    water_temp_c,
    difficulty: opts.difficulty ?? null,
    activities: opts.activities ?? ["snorkeling"],
    terrain: opts.terrain ?? null,
    is_hidden,
    status,
    trust_score,
    last_verified_at: iso(verifiedDaysAgo),
    like_count,
    first_reporter_id: null,
    synthetic_test: opts.syntheticTest ?? false,
    unlock_condition_override: null,
    created_at: iso(verifiedDaysAgo ?? 30)!,
    updated_at: iso(verifiedDaysAgo ?? 30)!,
  };
}

function partner(
  spotSlug: string,
  partner_name: string,
  listing_type: PartnerListingRow["listing_type"],
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

// ------------------------------------------------------------------
// 성능/부하 테스트 전용 더미 데이터 (synthetic_test: true)
//
// ⚠️ 실제 장소가 아닙니다. UI/리더보드/필터/지도 성능을 테스트하기 위한
//    용도로만 사용하세요. MOCK_SPOTS에는 기본 포함하지 않으며,
//    NEXT_PUBLIC_INCLUDE_SYNTHETIC_TEST_SPOTS=true 환경변수로만 켜집니다
//    (lib/data.ts 참고). Supabase 쪽 동급 데이터는
//    supabase/seed_synthetic_test_data.sql 이며, 그 파일 역시
//    실제 서비스 오픈 전 전량 삭제 대상입니다.
// ------------------------------------------------------------------

const REGION_CENTERS: { region: SpotRow["region"]; lat: number; lng: number }[] = [
  { region: "gyeonggi", lat: 37.45, lng: 126.6 },
  { region: "gangwon", lat: 37.75, lng: 128.9 },
  { region: "chungcheong", lat: 36.6, lng: 126.3 },
  { region: "gyeongbuk", lat: 36.4, lng: 129.4 },
  { region: "gyeongnam", lat: 34.9, lng: 128.4 },
  { region: "jeolla", lat: 34.6, lng: 127.0 },
  { region: "jeju", lat: 33.4, lng: 126.5 },
];

const CURRENT_LEVELS: SpotRow["current_level"][] = ["calm", "moderate", "strong"];
const DIFFICULTIES: SpotRow["difficulty"][] = ["beginner", "intermediate", "advanced"];
const STATUSES: SpotRow["status"][] = ["verified", "verified", "verified", "pending", "needs_update"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSyntheticTestSpots(count = 240): SpotRow[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const label = String(n).padStart(3, "0");
    const center = REGION_CENTERS[n % REGION_CENTERS.length];
    const depthMin = 1 + Math.floor(Math.random() * 8);
    const verifiedDaysAgo = Math.random() < 0.7 ? Math.floor(Math.random() * 180) : null;

    return spot(
      `test-spot-${label}`,
      `테스트 스팟 #${label}`,
      center.region,
      "성능/부하 테스트용 자동 생성 더미 스팟입니다. 실제 장소가 아니며, 서비스 오픈 전 전량 삭제 대상입니다.",
      center.lat + (Math.random() - 0.5) * 0.6,
      center.lng + (Math.random() - 0.5) * 0.6,
      depthMin,
      depthMin + 3 + Math.floor(Math.random() * 22),
      Math.round((2 + Math.random() * 18) * 10) / 10,
      pick(CURRENT_LEVELS),
      Math.round((12 + Math.random() * 16) * 10) / 10,
      Math.random() < 0.15,
      pick(STATUSES),
      Math.round(20 + Math.random() * 79),
      verifiedDaysAgo,
      Math.floor(Math.random() * 300),
      { subregion: "자동생성", difficulty: pick(DIFFICULTIES), syntheticTest: true }
    );
  });
}

/** 240개 합성 테스트 스팟. 기본적으로는 아무 곳에서도 import되지 않습니다 — 필요할 때만 사용하세요. */
export const MOCK_SYNTHETIC_TEST_SPOTS: SpotRow[] = generateSyntheticTestSpots();

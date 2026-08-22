import type { ActivityType, SpotRow, SpotTerrainType } from "@/lib/types/database";

/**
 * 해양 액티비티 통합 가이드 — 5종 액티비티 메타데이터 (라벨/아이콘/지도 핀 색상).
 * 콘텐츠 우선순위(supabase/migrations/0020_activity_feature_flags.sql)와 동일한 순서로 정렬:
 * 1차 스노클링·바다수영 → 2차 서핑 → 3차 프리다이빙·스쿠버.
 */
export interface ActivityMeta {
  key: ActivityType;
  label: string;
  shortLabel: string;
  icon: string;
  /** 지도 핀/뱃지 색상 (hex). 기존 navy/foam/coral 팔레트와 어울리는 톤으로 확장. */
  color: string;
  /** feature_flags 키 (스노클링은 항상 활성화라 플래그가 없습니다). */
  featureFlag: `activity_${string}` | null;
  /** 온보딩 카드 등에서 쓰는 한줄 설명. */
  description: string;
}

export const ACTIVITIES: ActivityMeta[] = [
  {
    key: "snorkeling", label: "스노클링", shortLabel: "스노클링", icon: "🤿", color: "#8fe3d8", featureFlag: null,
    description: "장비 없이도 시작하기 쉬운 입문 액티비티. 얕은 수심에서 물속 풍경을 즐겨요.",
  },
  {
    key: "sea_swimming", label: "바다수영", shortLabel: "바다수영", icon: "🏊", color: "#1f8890", featureFlag: "activity_sea_swimming",
    description: "탁 트인 바다에서 자유형으로 즐기는 오픈워터 수영.",
  },
  {
    key: "surfing", label: "서핑", shortLabel: "서핑", icon: "🏄", color: "#ff6f5e", featureFlag: "activity_surfing",
    description: "파도를 타는 역동적인 액티비티. 초보자 스쿨이 있는 스팟부터 시작해보세요.",
  },
  {
    key: "freediving", label: "프리다이빙", shortLabel: "프리다이빙", icon: "🫧", color: "#5b7fd6", featureFlag: "activity_freediving",
    description: "숨을 참고 잠수하는 프리다이빙. 반드시 버디와 함께, 공인 교육 이수 후 시작하세요.",
  },
  {
    key: "scuba", label: "스쿠버다이빙", shortLabel: "스쿠버", icon: "🐙", color: "#a877e0", featureFlag: "activity_scuba",
    description: "장비를 메고 깊은 수중을 탐험. PADI 등 공인 자격증이 필요해요.",
  },
];

export const ACTIVITY_LABEL: Record<ActivityType, string> = Object.fromEntries(
  ACTIVITIES.map((a) => [a.key, a.label])
) as Record<ActivityType, string>;

export const ACTIVITY_ICON: Record<ActivityType, string> = Object.fromEntries(
  ACTIVITIES.map((a) => [a.key, a.icon])
) as Record<ActivityType, string>;

export const ACTIVITY_COLOR: Record<ActivityType, string> = Object.fromEntries(
  ACTIVITIES.map((a) => [a.key, a.color])
) as Record<ActivityType, string>;

export function getActivityMeta(activity: ActivityType): ActivityMeta {
  return ACTIVITIES.find((a) => a.key === activity) ?? ACTIVITIES[0];
}

export const TERRAIN_LABEL: Record<SpotTerrainType, string> = {
  sand_beach: "백사장",
  rocky_shore: "암반 해안",
  breakwater: "방파제",
  reef_zone: "리프 지대",
};

// ------------------------------------------------------------------
// 컨디션 신호등 — 초보자 기준 "지금 이 조건이 괜찮은지"를 한눈에 보여주는 표시.
// 안전정보 템플릿(경고 문구)과는 별개로, 게이지 수치를 3단계 색상으로 요약합니다.
// ------------------------------------------------------------------
export type TrafficLightLevel = "good" | "caution" | "avoid";

export const TRAFFIC_LIGHT_META: Record<TrafficLightLevel, { color: string; label: string }> = {
  good: { color: "#3ddc84", label: "양호" },
  caution: { color: "#f5c542", label: "주의" },
  avoid: { color: "#ff6f5e", label: "위험" },
};

/** 조류 강도 → 신호등 (스노클링/바다수영 공통 지표). */
export function currentLevelTrafficLight(level: SpotRow["current_level"]): TrafficLightLevel {
  if (level === "calm") return "good";
  if (level === "moderate") return "caution";
  return "avoid"; // strong | unknown — 정보가 없을 때도 보수적으로 주의 이상 처리
}

/** 파고(최대) → 신호등. 초보 서퍼 기준 임계값이며, 상급자에게는 반대로 해석될 수 있어 라벨에 병기합니다. */
export function surfWaveTrafficLight(waveHeightMaxM: number | null): TrafficLightLevel {
  if (waveHeightMaxM == null) return "caution";
  if (waveHeightMaxM <= 1.2) return "good";
  if (waveHeightMaxM <= 2) return "caution";
  return "avoid";
}

// ------------------------------------------------------------------
// 홈 "오늘 뭐가 좋을까" 모듈 — 외부 기상 API 없이, 달(月) 기준의 단순 계절 추천.
// 실제 물때/파고/수온 API 연동 전까지의 잠정 로직입니다 (연동 시 이 함수를 교체).
// ------------------------------------------------------------------
export interface SeasonalRecommendation {
  activities: ActivityType[];
  reason: string;
}

export function getSeasonalRecommendation(date: Date = new Date()): SeasonalRecommendation {
  const month = date.getMonth() + 1; // 1-12

  if (month >= 6 && month <= 9) {
    return {
      activities: ["snorkeling", "sea_swimming", "surfing"],
      reason: "수온이 가장 따뜻한 성수기예요. 장비 부담 없이 물놀이 액티비티를 즐기기 좋아요.",
    };
  }
  if ((month >= 3 && month <= 5) || (month >= 10 && month <= 11)) {
    return {
      activities: ["surfing", "freediving"],
      reason: "웨트슈트 시즌 — 스웰이 꾸준하고 사람도 붐비지 않아요.",
    };
  }
  return {
    activities: ["scuba", "freediving"],
    reason: "수온이 낮아 드라이슈트/전문 장비를 갖춘 다이버 위주의 시즌이에요.",
  };
}

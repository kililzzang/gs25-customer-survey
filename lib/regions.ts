import type { RegionCode } from "@/lib/types/database";

export interface RegionMeta {
  code: RegionCode;
  name: string;
  shortName: string;
  /** 스키매틱 타일맵에서의 그리드 위치 (1-indexed) */
  gridCol: number;
  gridRow: number;
}

/**
 * 대한민국을 단순화한 3x4 스키매틱 그리드 배치.
 * 추후 카카오맵 실좌표 연동 시 이 메타데이터는 지역 필터 목록으로만 사용.
 */
export const REGIONS: RegionMeta[] = [
  { code: "gangwon", name: "강원", shortName: "강원", gridCol: 3, gridRow: 1 },
  { code: "gyeonggi", name: "경기", shortName: "경기", gridCol: 2, gridRow: 1 },
  { code: "gyeongbuk", name: "경상북도", shortName: "경북", gridCol: 3, gridRow: 2 },
  { code: "chungcheong", name: "충청", shortName: "충청", gridCol: 2, gridRow: 2 },
  { code: "jeolla", name: "전라", shortName: "전라", gridCol: 1, gridRow: 3 },
  { code: "gyeongnam", name: "경상남도", shortName: "경남", gridCol: 3, gridRow: 3 },
  { code: "jeju", name: "제주", shortName: "제주", gridCol: 2, gridRow: 4 },
];

export const OVERSEAS_REGION: RegionMeta = {
  code: "overseas",
  name: "국외",
  shortName: "국외",
  gridCol: 4,
  gridRow: 4,
};

export const ALL_REGIONS = [...REGIONS, OVERSEAS_REGION];

export function getRegionMeta(code: RegionCode): RegionMeta {
  return ALL_REGIONS.find((r) => r.code === code) ?? OVERSEAS_REGION;
}

export const CURRENT_LEVEL_LABEL: Record<string, string> = {
  calm: "약함",
  moderate: "보통",
  strong: "강함",
  unknown: "정보없음",
};

export const SPOT_STATUS_LABEL: Record<string, string> = {
  pending: "검토중",
  verified: "검증됨",
  needs_update: "갱신 필요",
  hidden: "비공개",
  rejected: "반려",
};

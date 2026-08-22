"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getActivityMeta } from "@/lib/activities";
import { getRegionMeta } from "@/lib/regions";
import { ONBOARDING_PREF_STORAGE_KEY } from "@/components/onboarding-flow";
import type { ActivityType, RegionCode } from "@/lib/types/database";

interface StoredPref {
  activity: ActivityType;
  region: RegionCode;
}

/** /onboarding에서 저장한 마지막 선택을 이 브라우저에서만 다시 보여주는 개인화 배너. */
export function OnboardingRecall() {
  const [pref, setPref] = useState<StoredPref | null>(null);

  useEffect(() => {
    // 마운트 후 1회만 localStorage를 읽습니다 — SSR에는 window가 없어 렌더 중에는 읽을 수 없고,
    // 서버 렌더 결과(배너 없음)와 하이드레이션 불일치가 나지 않도록 effect에서 비동기로 반영합니다.
    function readStoredPref() {
      try {
        const raw = localStorage.getItem(ONBOARDING_PREF_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<StoredPref>;
        if (parsed.activity && parsed.region) {
          setPref({ activity: parsed.activity, region: parsed.region });
        }
      } catch {
        // localStorage 접근 불가 — 그냥 배너를 표시하지 않습니다.
      }
    }
    readStoredPref();
  }, []);

  if (!pref) return null;

  const activityMeta = getActivityMeta(pref.activity);
  const regionMeta = getRegionMeta(pref.region);

  return (
    <Link
      href={`/regions/${pref.region}/${pref.activity}`}
      className="inline-flex items-center gap-2 rounded-full border border-foam/25 bg-navy/50 px-4 py-2 text-xs text-sand/70 transition hover:border-foam hover:text-foam"
    >
      <span aria-hidden>{activityMeta.icon}</span>
      지난번엔 {regionMeta.name} {activityMeta.label}을(를) 봤어요 — 이어서 보기 →
    </Link>
  );
}

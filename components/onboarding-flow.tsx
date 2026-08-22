"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ACTIVITIES } from "@/lib/activities";
import { ALL_REGIONS } from "@/lib/regions";
import type { ActivityType, RegionCode } from "@/lib/types/database";

/** 홈 "오늘 뭐가 좋을까" 모듈의 개인화 표시가 참조하는 localStorage 키. */
export const ONBOARDING_PREF_STORAGE_KEY = "mulbit:onboarding-pref";

export function OnboardingFlow({ enabledMap }: { enabledMap: Record<ActivityType, boolean> }) {
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityType | null>(null);
  const [region, setRegion] = useState<RegionCode | null>(null);

  function handleStart() {
    if (!activity || !region) return;
    try {
      localStorage.setItem(
        ONBOARDING_PREF_STORAGE_KEY,
        JSON.stringify({ activity, region, savedAt: Date.now() })
      );
    } catch {
      // 프라이빗 모드 등 localStorage 접근이 막힌 환경에서도 이동은 계속 진행합니다.
    }
    router.push(`/regions/${region}/${activity}`);
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="mb-3 text-xs uppercase tracking-wider text-sand/50">1. 액티비티 선택</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ACTIVITIES.map((a) => {
            const enabled = enabledMap[a.key];
            const selected = activity === a.key;
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => setActivity(a.key)}
                className="flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition"
                style={{
                  borderColor: selected ? a.color : "rgba(143,227,216,0.15)",
                  background: selected ? `${a.color}1a` : "rgba(10,46,54,0.4)",
                }}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-sand">
                  <span aria-hidden>{a.icon}</span>
                  {a.label}
                  {!enabled && (
                    <span className="rounded-full border border-sand/20 px-1.5 py-0.5 text-[10px] text-sand/40">
                      준비중
                    </span>
                  )}
                </span>
                <span className="text-xs text-sand/50">{a.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs uppercase tracking-wider text-sand/50">2. 지역 선택</p>
        <div className="flex flex-wrap gap-2">
          {ALL_REGIONS.map((r) => (
            <button
              key={r.code}
              type="button"
              onClick={() => setRegion(r.code)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                region === r.code
                  ? "border-foam bg-foam text-navy-deep"
                  : "border-foam/20 text-sand/70 hover:border-foam/50"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={!activity || !region}
        className="w-full rounded-full bg-teal-light px-6 py-3 text-sm font-medium text-navy-deep transition hover:bg-foam disabled:cursor-not-allowed disabled:opacity-40"
      >
        스팟 보러가기
      </button>
    </div>
  );
}

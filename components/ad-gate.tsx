"use client";

import { useEffect, useRef, useState } from "react";
import type { SpotLockedInfoRow } from "@/lib/types/database";

interface AdGateProps {
  spotId: string;
  lockedInfo: SpotLockedInfoRow | null;
  isPremium?: boolean;
}

const AD_DURATION_SEC = 8; // 실제 리워드 광고 SDK 연동 전 목업 (5~15초 스펙 내)
const UNLOCK_TTL_MS = 24 * 60 * 60 * 1000; // 24시간 캐싱

function storageKey(spotId: string) {
  return `mulbit_unlock_${spotId}`;
}

export function AdGate({ spotId, lockedInfo, isPremium = false }: AdGateProps) {
  // 서버 렌더(HTML)와 하이드레이션 결과가 항상 일치하도록 초기값은 isPremium만 반영하고,
  // localStorage 캐시 확인은 마운트 이후 이펙트에서 수행합니다(브라우저 전용 API 동기화).
  const [unlocked, setUnlocked] = useState(isPremium);
  const [watching, setWatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPremium) return;
    try {
      const raw = localStorage.getItem(storageKey(spotId));
      if (!raw) return;
      const expiresAt = Number(raw);
      if (expiresAt > Date.now()) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 전용 저장소(localStorage) 동기화이므로 마운트 후 1회 반영이 올바른 패턴입니다.
        setUnlocked(true);
      } else {
        localStorage.removeItem(storageKey(spotId));
      }
    } catch {
      // localStorage 접근 불가 환경 (프라이빗 모드 등) — 게이트 유지
    }
  }, [spotId, isPremium]);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  function startAd() {
    setWatching(true);
    setProgress(0);
    const startedAt = Date.now();
    intervalRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - startedAt) / (AD_DURATION_SEC * 1000)) * 100);
      setProgress(pct);
      if (pct >= 100) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setWatching(false);
        setUnlocked(true);
        try {
          localStorage.setItem(storageKey(spotId), String(Date.now() + UNLOCK_TTL_MS));
        } catch {
          // 캐싱 실패 시에도 이번 세션에서는 열람 유지
        }
      }
    }, 100);
  }

  if (unlocked) {
    return (
      <div className="rounded-xl border border-foam/25 bg-teal/20 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg text-foam">상세 접근 정보</h3>
          <span className="rounded-full bg-foam/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-foam">
            {isPremium ? "멤버십 무료 열람" : "24시간 열람 가능"}
          </span>
        </div>
        {lockedInfo ? (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-sand/50">정확한 좌표</dt>
              <dd className="font-mono text-sand">
                {lockedInfo.exact_lat?.toFixed(5)}, {lockedInfo.exact_lng?.toFixed(5)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-sand/50">접근 경로</dt>
              <dd className="text-sand/80">{lockedInfo.access_route}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-sand/50">주차 팁</dt>
              <dd className="text-sand/80">{lockedInfo.parking_tip}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-sand/50">아직 등록된 상세 접근 정보가 없습니다.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-foam/15 bg-navy/60 p-5">
      <h3 className="font-serif text-lg text-sand">상세 접근 정보 🔒</h3>
      <p className="mt-1 text-sm text-sand/50">
        정확한 좌표 · 접근 경로 · 주차 팁은 광고 시청 후 24시간 동안 열람할 수 있어요.
      </p>

      {watching ? (
        <div className="mt-4">
          <div className="gauge-track">
            <div className="gauge-fill transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 font-mono text-xs text-foam/70">광고 재생 중… {Math.round(progress)}%</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={startAd}
            className="rounded-full bg-coral px-5 py-2 text-sm font-medium text-navy-deep transition hover:brightness-110"
          >
            ▶ 광고 시청 후 열람 (약 {AD_DURATION_SEC}초)
          </button>
          <a
            href="/membership"
            className="text-xs text-foam/80 underline decoration-foam/40 underline-offset-4 hover:text-foam"
          >
            멤버십 가입하면 광고 없이 즉시 열람
          </a>
        </div>
      )}
      <p className="mt-3 text-[11px] text-sand/30">
        * 목업 UI입니다. 실제 리워드 광고 SDK는 추후 연동됩니다.
      </p>
    </div>
  );
}

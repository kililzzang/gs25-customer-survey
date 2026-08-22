"use client";

import { useState } from "react";

/**
 * feature flag: sos_button (supabase/migrations/0010_feature_flags.sql)
 * 안전 정보라 게이트 예외 — 항상 무료 공개.
 */
export function SosButton({ spotName }: { spotName: string }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "done" | "error">("idle");

  function handleLocate() {
    setStatus("locating");
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("done");
      },
      () => setStatus("error"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div className="rounded-xl border border-coral/40 bg-coral/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-serif text-base text-coral">긴급 SOS</p>
          <p className="text-xs text-sand/50">현재 위치를 확보한 뒤 해양경찰(122)로 바로 연결하세요.</p>
        </div>
        <a
          href="tel:122"
          onClick={handleLocate}
          className="rounded-full bg-coral px-5 py-2 text-sm font-semibold text-navy-deep transition hover:brightness-110"
        >
          🆘 122 연결
        </a>
      </div>
      {status === "locating" && <p className="mt-3 text-xs text-sand/40">위치 확인 중…</p>}
      {status === "done" && coords && (
        <p className="mt-3 font-mono text-xs text-sand/70">
          현재 위치: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} — {spotName} 인근. 신고 시 불러주세요.
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 text-xs text-coral">
          위치 확인에 실패했습니다. 육안으로 보이는 표지판/지형지물을 대신 불러주세요.
        </p>
      )}
    </div>
  );
}

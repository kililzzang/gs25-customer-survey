"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakao/load-kakao-maps";

interface KakaoRoadviewProps {
  lat: number;
  lng: number;
  height?: number;
}

type Status = "loading" | "ready" | "unavailable" | "no_panorama";

/** feature flag: kakao_roadview (supabase/migrations/0010_feature_flags.sql) */
export function KakaoRoadview({ lat, lng, height = 280 }: KakaoRoadviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const hasAppKey = Boolean(process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY);

  useEffect(() => {
    // hasAppKey가 false면 아래에서 null을 반환해 이 컴포넌트를 렌더링하지 않으므로,
    // containerRef가 애초에 마운트되지 않아 이 effect의 결과는 사용되지 않습니다.
    let cancelled = false;

    loadKakaoMaps().then((maps) => {
      if (cancelled || !maps || !containerRef.current) {
        if (!cancelled) setStatus("unavailable");
        return;
      }

      const position = new maps.LatLng(lat, lng);
      const client = new maps.RoadviewClient();

      client.getNearestPanoId(position, 50, (panoId: number | null) => {
        if (cancelled) return;
        if (!panoId) {
          setStatus("no_panorama");
          return;
        }
        const roadview = new maps.Roadview(containerRef.current);
        roadview.setPanoId(panoId, position);
        setStatus("ready");
      });
    });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  if (!hasAppKey) return null; // 지도 컴포넌트 쪽에서 이미 키 미설정 안내를 하므로 중복 노출하지 않음

  return (
    <div className="relative overflow-hidden rounded-xl border border-foam/15" style={{ height }}>
      <div ref={containerRef} className="h-full w-full" />
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy/60 px-4 text-center text-sm text-sand/40">
          {status === "no_panorama"
            ? "이 위치는 로드뷰를 제공하지 않습니다."
            : status === "unavailable"
              ? "로드뷰를 불러올 수 없습니다."
              : "로드뷰 불러오는 중…"}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakao/load-kakao-maps";

interface RegionSpotPin {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  isHidden: boolean;
}

type Status = "loading" | "ready" | "unavailable";

/**
 * feature flag: spot_map_clustering (supabase/migrations/0010_feature_flags.sql)
 * 지역 내 스팟이 많을 때 카카오맵 MarkerClusterer로 자동 클러스터링합니다.
 * 스키매틱 타일맵(RegionTileMap)과 병행 노출 — 실좌표 지도가 필요한 유저를 위한 보조 뷰입니다.
 */
export function RegionKakaoMap({ spots, height = 360 }: { spots: RegionSpotPin[]; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const hasAppKey = Boolean(process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY);

  const depsKey = JSON.stringify(spots);

  useEffect(() => {
    let cancelled = false;

    loadKakaoMaps().then((maps) => {
      if (cancelled || !maps || !containerRef.current || spots.length === 0) {
        if (!cancelled) setStatus("unavailable");
        return;
      }

      const avgLat = spots.reduce((sum, s) => sum + s.lat, 0) / spots.length;
      const avgLng = spots.reduce((sum, s) => sum + s.lng, 0) / spots.length;
      const map = new maps.Map(containerRef.current, {
        center: new maps.LatLng(avgLat, avgLng),
        level: 9,
      });

      const clusterer = new maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: 6,
        disableClickZoom: false,
      });

      const markers = spots.map((s) => {
        const marker = new maps.Marker({ position: new maps.LatLng(s.lat, s.lng) });
        const infoWindow = new maps.InfoWindow({
          content: `<div style="padding:6px 10px;font-size:12px;white-space:nowrap;">
            ${s.isHidden ? "◆ " : ""}<a href="/spots/${s.slug}" style="color:#0A2E36;font-weight:600;">${s.name}</a>
          </div>`,
        });
        maps.event.addListener(marker, "click", () => infoWindow.open(map, marker));
        return marker;
      });

      clusterer.addMarkers(markers);
      setStatus("ready");
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey]);

  if (!hasAppKey) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-foam/15 bg-navy/40 px-4 text-center text-sm text-sand/40"
        style={{ height }}
      >
        카카오맵 API 키가 설정되지 않았습니다 (NEXT_PUBLIC_KAKAO_MAP_APP_KEY)
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-foam/15" style={{ height }}>
      <div ref={containerRef} className="h-full w-full" />
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy/60 text-sm text-sand/40">
          지도 불러오는 중…
        </div>
      )}
    </div>
  );
}

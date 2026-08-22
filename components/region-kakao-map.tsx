"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakao/load-kakao-maps";
import { ACTIVITIES, ACTIVITY_COLOR } from "@/lib/activities";
import type { ActivityType } from "@/lib/types/database";

interface RegionSpotPin {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  isHidden: boolean;
  /** 미지정 시 ["snorkeling"]으로 취급 (하위호환). */
  activities?: ActivityType[];
}

type Status = "loading" | "ready" | "unavailable";

/** 핀 색상의 hex를 카카오맵 SVG 마커 아이콘으로 변환 (물방울 모양). */
function pinSvgDataUrl(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">
    <path d="M13 0C5.8 0 0 5.8 0 13c0 9.75 13 21 13 21s13-11.25 13-21C26 5.8 20.2 0 13 0z" fill="${color}" stroke="#0a2e36" stroke-width="1.5"/>
    <circle cx="13" cy="13" r="5" fill="#0a2e36"/>
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/**
 * feature flag: spot_map_clustering (supabase/migrations/0010_feature_flags.sql)
 * 지역 내 스팟이 많을 때 카카오맵 MarkerClusterer로 자동 클러스터링합니다.
 * 액티비티별로 핀 색상을 다르게 표시하고, 상단 레이어 토글로 특정 액티비티만
 * 골라볼 수 있습니다 (스팟이 여러 액티비티를 겸하면 활성화된 토글 중 하나만 겹쳐도 노출됩니다).
 * 스키매틱 타일맵(RegionTileMap)과 병행 노출 — 실좌표 지도가 필요한 유저를 위한 보조 뷰입니다.
 */
export function RegionKakaoMap({ spots, height = 360 }: { spots: RegionSpotPin[]; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const hasAppKey = Boolean(process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY);

  const normalizedSpots = useMemo(
    () =>
      spots.map((s) => ({
        ...s,
        activities: s.activities && s.activities.length > 0 ? s.activities : (["snorkeling"] as ActivityType[]),
      })),
    [spots]
  );

  const activityOptions = useMemo(() => {
    const present = new Set(normalizedSpots.flatMap((s) => s.activities));
    return ACTIVITIES.filter((a) => present.has(a.key));
  }, [normalizedSpots]);

  // 페이지 진입 시 등장하는 액티비티는 전부 켜둔 상태로 시작합니다.
  // spots 자체는 서버에서 한 번 내려온 뒤 이 컴포넌트 생애주기 동안 바뀌지 않으므로
  // (지역 페이지가 다시 마운트될 때 재계산됩니다) 별도 리셋 로직 없이 lazy init만으로 충분합니다.
  const [activeActivities, setActiveActivities] = useState<Set<ActivityType>>(
    () => new Set(activityOptions.map((a) => a.key))
  );

  const depsKey = JSON.stringify(normalizedSpots);
  const activeKey = [...activeActivities].sort().join(",");

  useEffect(() => {
    let cancelled = false;
    const visibleSpots = normalizedSpots.filter((s) => s.activities.some((a) => activeActivities.has(a)));

    loadKakaoMaps().then((maps) => {
      if (cancelled || !maps || !containerRef.current || normalizedSpots.length === 0) {
        if (!cancelled) setStatus("unavailable");
        return;
      }

      if (visibleSpots.length === 0) {
        // 모든 레이어가 꺼진 상태 — 빈 지도만 보여줍니다.
        const map = new maps.Map(containerRef.current, {
          center: new maps.LatLng(normalizedSpots[0].lat, normalizedSpots[0].lng),
          level: 9,
        });
        void map;
        setStatus("ready");
        return;
      }

      const avgLat = visibleSpots.reduce((sum, s) => sum + s.lat, 0) / visibleSpots.length;
      const avgLng = visibleSpots.reduce((sum, s) => sum + s.lng, 0) / visibleSpots.length;
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

      const markers = visibleSpots.map((s) => {
        const primaryColor = ACTIVITY_COLOR[s.activities[0]];
        const marker = new maps.Marker({
          position: new maps.LatLng(s.lat, s.lng),
          image: new maps.MarkerImage(pinSvgDataUrl(primaryColor), new maps.Size(26, 34), {
            offset: new maps.Point(13, 34),
          }),
        });
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
  }, [depsKey, activeKey]);

  function toggleActivity(key: ActivityType) {
    setActiveActivities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

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
    <div>
      {activityOptions.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {activityOptions.map((a) => {
            const active = activeActivities.has(a.key);
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => toggleActivity(a.key)}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-opacity"
                style={{
                  borderColor: a.color,
                  color: active ? "#0a2e36" : a.color,
                  background: active ? a.color : "transparent",
                  opacity: active ? 1 : 0.55,
                }}
              >
                <span aria-hidden>{a.icon}</span>
                {a.shortLabel}
              </button>
            );
          })}
        </div>
      )}
      <div className="relative overflow-hidden rounded-xl border border-foam/15" style={{ height }}>
        <div ref={containerRef} className="h-full w-full" />
        {status !== "ready" && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy/60 text-sm text-sand/40">
            지도 불러오는 중…
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakao/load-kakao-maps";

interface MapPoint {
  lat: number;
  lng: number;
}

interface ParkingPin extends MapPoint {
  label: string;
  type: "free" | "paid";
}

interface KakaoMapProps {
  /** 대략 위치 — 항상 공개되는 정보라 로그인 여부와 무관하게 항상 표시 */
  approxCenter: MapPoint;
  /** 정확한 좌표 — 잠금 해제(로그인) 상태일 때만 전달 */
  exactPin?: MapPoint | null;
  /** 접근 스텝 좌표 나열 — 2개 이상이면 도보 경로 폴리라인으로 이어서 표시 */
  routeSteps?: MapPoint[];
  parkingPins?: ParkingPin[];
  height?: number;
}

type Status = "loading" | "ready" | "unavailable";

/** feature flag: map_pin_route_polyline (supabase/migrations/0010_feature_flags.sql) */
export function KakaoMap({
  approxCenter,
  exactPin,
  routeSteps = [],
  parkingPins = [],
  height = 320,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const hasAppKey = Boolean(process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY);

  const depsKey = JSON.stringify({ approxCenter, exactPin, routeSteps, parkingPins });

  useEffect(() => {
    // hasAppKey가 false면 아래 JSX에서 지도를 아예 렌더링하지 않아 containerRef가 비어 있으므로,
    // loadKakaoMaps()가 null을 반환하는 분기에서 자연스럽게 "unavailable" 처리됩니다.
    let cancelled = false;

    loadKakaoMaps().then((maps) => {
      if (cancelled || !maps || !containerRef.current) {
        if (!cancelled) setStatus("unavailable");
        return;
      }

      const center = new maps.LatLng(approxCenter.lat, approxCenter.lng);
      const map = new maps.Map(containerRef.current, { center, level: 4 });

      // 대략 위치 — 정확하지 않은 반경임을 원으로 시각화 (항상 표시)
      new maps.Circle({
        map,
        center,
        radius: 150,
        strokeWeight: 1,
        strokeColor: "#8FE3D8",
        strokeOpacity: 0.7,
        fillColor: "#1F8890",
        fillOpacity: 0.25,
      });

      if (exactPin) {
        const marker = new maps.Marker({
          map,
          position: new maps.LatLng(exactPin.lat, exactPin.lng),
        });
        const overlay = new maps.CustomOverlay({
          position: new maps.LatLng(exactPin.lat, exactPin.lng),
          yAnchor: 2.4,
          content:
            '<div style="background:#FF6F5E;color:#061E24;font-size:11px;font-weight:600;padding:2px 8px;border-radius:9999px;white-space:nowrap;">정확한 위치</div>',
        });
        marker.setMap(map);
        overlay.setMap(map);
      }

      parkingPins.forEach((p) => {
        const overlay = new maps.CustomOverlay({
          position: new maps.LatLng(p.lat, p.lng),
          content: `<div style="background:${
            p.type === "free" ? "#1F8890" : "#0A2E36"
          };border:1px solid #8FE3D8;color:#F3ECDC;font-size:11px;padding:2px 8px;border-radius:9999px;white-space:nowrap;">🅿 ${p.label}</div>`,
        });
        overlay.setMap(map);
      });

      if (routeSteps.length > 1) {
        const path = routeSteps.map((s) => new maps.LatLng(s.lat, s.lng));
        new maps.Polyline({
          map,
          path,
          strokeWeight: 4,
          strokeColor: "#FF6F5E",
          strokeOpacity: 0.85,
          strokeStyle: "shortdash",
        });
      }

      setStatus("ready");
    });

    return () => {
      cancelled = true;
    };
    // depsKey가 좌표/스텝 내용 변경을 대신 감지하므로 개별 참조는 의도적으로 제외합니다.
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

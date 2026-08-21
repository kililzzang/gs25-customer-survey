"use client";

/**
 * 카카오맵 JS SDK는 공식 TypeScript 타입을 제공하지 않아 window.kakao를 느슨하게(any) 선언합니다.
 * 사용 범위가 지도/마커/폴리라인/로드뷰 정도로 제한적이라 별도 타입 패키지 없이 진행합니다.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- 카카오맵 SDK 공식 타입 없음, 의도적 any */
declare global {
  interface Window {
    kakao: any;
  }
}

let loadPromise: Promise<any> | null = null;

/**
 * 카카오맵 JS SDK를 1회만 로드하고 kakao.maps 네임스페이스를 반환합니다.
 * NEXT_PUBLIC_KAKAO_MAP_APP_KEY가 없으면 null을 반환하며, 호출부(컴포넌트)가
 * 폴백 UI("지도를 불러올 수 없습니다")를 보여줘야 합니다.
 */
export function loadKakaoMaps(): Promise<any | null> {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;
  if (!appKey || typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao.maps);
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("kakao-maps-sdk") as HTMLScriptElement | null;

    const onReady = () => {
      window.kakao.maps.load(() => resolve(window.kakao.maps));
    };

    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services,clusterer`;
    script.async = true;
    script.onload = onReady;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("카카오맵 SDK 로드 실패"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

import Link from "next/link";
import { ALL_REGIONS } from "@/lib/regions";
import type { RegionCode } from "@/lib/types/database";

interface RegionTileMapProps {
  activeRegion?: RegionCode;
  spotCounts?: Partial<Record<RegionCode, number>>;
}

/**
 * 스키매틱 타일맵. 실좌표 지도가 아닌, 대한민국 지형을 단순화한 그리드 배치입니다.
 * 추후 카카오맵 실좌표 연동 시 이 컴포넌트를 지도 컴포넌트로 교체합니다.
 */
export function RegionTileMap({ activeRegion, spotCounts }: RegionTileMapProps) {
  return (
    <div className="rounded-2xl border border-foam/15 bg-navy/50 p-6">
      <div
        className="depth-lines mx-auto grid max-w-md gap-3"
        style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
      >
        {ALL_REGIONS.map((region) => {
          const isActive = region.code === activeRegion;
          const count = spotCounts?.[region.code];
          const isOverseas = region.code === "overseas";
          return (
            <Link
              key={region.code}
              href={`/regions/${region.code}`}
              style={{ gridColumn: region.gridCol, gridRow: region.gridRow }}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border text-center transition ${
                isActive
                  ? "border-foam bg-teal-light/30 text-foam shadow-[0_0_0_1px_rgba(143,227,216,0.4)]"
                  : "border-foam/20 bg-navy-deep/60 text-sand/70 hover:border-foam/50 hover:text-foam"
              } ${isOverseas ? "border-dashed" : ""}`}
            >
              <span className="text-sm font-medium">{region.shortName}</span>
              {typeof count === "number" && (
                <span className="font-mono text-[10px] text-foam/70">{count}곳</span>
              )}
            </Link>
          );
        })}
      </div>
      <p className="mt-4 text-center text-[11px] text-sand/40">
        * 초기 버전은 스키매틱 타일맵입니다. 추후 카카오맵 실좌표 연동 예정.
      </p>
    </div>
  );
}

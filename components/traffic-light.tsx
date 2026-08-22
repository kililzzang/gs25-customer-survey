import { TRAFFIC_LIGHT_META, type TrafficLightLevel } from "@/lib/activities";

/** 컨디션 신호등 — 초록/노랑/빨강 점 + 라벨. lib/activities.ts의 판정 함수와 함께 사용합니다. */
export function TrafficLight({ level, note }: { level: TrafficLightLevel; note?: string }) {
  const meta = TRAFFIC_LIGHT_META[level];
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: meta.color }}
        aria-hidden
      />
      <span className="font-medium" style={{ color: meta.color }}>
        {meta.label}
      </span>
      {note && <span className="text-xs text-sand/50">{note}</span>}
    </div>
  );
}

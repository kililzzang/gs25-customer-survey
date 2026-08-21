interface GaugeBarProps {
  label: string;
  value: number | null;
  max: number;
  unit: string;
  formatted?: string;
}

/** 다이빙 게이지 느낌의 미니 수치 바 (수심/시야 등) */
export function GaugeBar({ label, value, max, unit, formatted }: GaugeBarProps) {
  const pct = value === null ? 0 : Math.min(100, Math.max(4, (value / max) * 100));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="uppercase tracking-wider text-foam/70">{label}</span>
        <span className="font-mono text-sand">
          {value === null ? "—" : formatted ?? `${value}${unit}`}
        </span>
      </div>
      <div className="gauge-track">
        <div className="gauge-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

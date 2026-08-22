import type { SpotParkingOptionRow } from "@/lib/types/database";

/** feature flag: parking_options_detail (supabase/migrations/0010_feature_flags.sql) */
export function ParkingOptions({ options }: { options: SpotParkingOptionRow[] }) {
  if (options.length === 0) {
    return <p className="text-sm text-sand/40">아직 등록된 주차 정보가 없습니다.</p>;
  }

  return (
    <div className="space-y-2">
      {options.map((p) => (
        <div
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-foam/10 bg-navy/40 px-4 py-2.5 text-sm"
        >
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                p.parking_type === "free" ? "bg-teal-light/30 text-foam" : "bg-sand/10 text-sand/70"
              }`}
            >
              {p.parking_type === "free" ? "무료" : "유료"}
            </span>
            <span className="text-sand">{p.label}</span>
            {p.is_primary && <span className="text-[10px] text-foam/50">기본</span>}
          </div>
          {p.note && <span className="text-xs text-sand/40">{p.note}</span>}
        </div>
      ))}
    </div>
  );
}

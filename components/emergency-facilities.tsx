import type { SpotEmergencyFacilityRow } from "@/lib/types/database";

const TYPE_LABEL: Record<string, string> = {
  hospital: "병원",
  clinic: "의원",
  health_center: "보건소",
};

/**
 * feature flag: nearest_emergency_facilities (supabase/migrations/0010_feature_flags.sql)
 * 안전 정보라 게이트 예외 — 항상 무료 공개.
 */
export function EmergencyFacilities({ facilities }: { facilities: SpotEmergencyFacilityRow[] }) {
  if (facilities.length === 0) return null;

  return (
    <ul className="mt-3 space-y-1.5 text-sm">
      {facilities.map((f) => (
        <li key={f.id} className="flex flex-wrap items-center gap-2 text-sand/80">
          <span className="rounded-full border border-coral/30 px-2 py-0.5 text-[10px] text-coral">
            {TYPE_LABEL[f.facility_type]}
          </span>
          <span>{f.name}</span>
          {f.phone && (
            <a href={`tel:${f.phone}`} className="font-mono text-foam/80 hover:text-foam">
              {f.phone}
            </a>
          )}
          {f.distance_km != null && <span className="text-xs text-sand/40">약 {f.distance_km}km</span>}
        </li>
      ))}
    </ul>
  );
}

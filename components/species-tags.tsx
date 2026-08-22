import type { SpeciesRow, SpeciesFrequency } from "@/lib/types/database";

const FREQUENCY_LABEL: Record<SpeciesFrequency, string> = {
  common: "자주 보임",
  occasional: "가끔 보임",
  rare: "희귀",
};

/** feature flag: species_field_guide (supabase/migrations/0010_feature_flags.sql) */
export function SpeciesTags({
  species,
}: {
  species: (SpeciesRow & { frequency: SpeciesFrequency | null })[];
}) {
  if (species.length === 0) {
    return <p className="text-sm text-sand/40">아직 등록된 관찰 생물이 없습니다.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {species.map((s) => (
        <span
          key={s.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-foam/20 bg-navy/40 px-3 py-1.5 text-sm text-sand/80"
          title={s.scientific_name ?? undefined}
        >
          <span>{s.icon}</span>
          <span>{s.name}</span>
          {s.frequency && (
            <span className="text-[10px] text-foam/60">· {FREQUENCY_LABEL[s.frequency]}</span>
          )}
        </span>
      ))}
    </div>
  );
}

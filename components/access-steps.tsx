import type { SpotAccessStepRow } from "@/lib/types/database";

const TERRAIN_LABEL: Record<string, string> = {
  flat: "평지",
  stairs: "계단",
  rock: "암반",
  sand: "모래",
};

const TERRAIN_ICON: Record<string, string> = {
  flat: "▬",
  stairs: "⌐",
  rock: "▲",
  sand: "≈",
};

/** feature flag: access_step_cards (supabase/migrations/0010_feature_flags.sql) */
export function AccessSteps({ steps }: { steps: SpotAccessStepRow[] }) {
  if (steps.length === 0) {
    return <p className="text-sm text-sand/40">아직 등록된 접근 스텝이 없습니다.</p>;
  }

  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={step.id} className="flex gap-4 rounded-xl border border-foam/10 bg-navy/40 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-foam/30 font-mono text-sm text-foam">
            {i + 1}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sand">{step.title}</p>
              {step.terrain_type && (
                <span className="rounded-full border border-foam/20 px-2 py-0.5 text-[10px] text-foam/70">
                  {TERRAIN_ICON[step.terrain_type]} {TERRAIN_LABEL[step.terrain_type]}
                </span>
              )}
            </div>
            {step.description && <p className="mt-1 text-sm text-sand/60">{step.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

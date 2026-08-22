import Link from "next/link";
import type { SpotRow } from "@/lib/types/database";
import { HiddenBadge } from "@/components/hidden-badge";
import { GaugeBar } from "@/components/gauge-bar";
import { SPOT_STATUS_LABEL } from "@/lib/regions";
import { getActivityMeta } from "@/lib/activities";

export function SpotCard({ spot }: { spot: SpotRow }) {
  const activities = spot.activities && spot.activities.length > 0 ? spot.activities : (["snorkeling"] as const);

  return (
    <Link
      href={`/spots/${spot.slug}`}
      className="group flex flex-col gap-4 rounded-xl border border-foam/15 bg-navy/60 p-5 transition hover:border-foam/40 hover:bg-navy/80"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg leading-snug text-sand group-hover:text-foam">
            {spot.name}
          </h3>
          <p className="mt-1 text-xs text-sand/50">{SPOT_STATUS_LABEL[spot.status]}</p>
        </div>
        {spot.is_hidden && <HiddenBadge />}
      </div>

      <div className="flex flex-wrap gap-1.5" aria-label="지원 액티비티">
        {activities.map((activity) => {
          const meta = getActivityMeta(activity);
          return (
            <span
              key={activity}
              title={meta.label}
              className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
              style={{ borderColor: `${meta.color}66`, color: meta.color }}
            >
              <span aria-hidden>{meta.icon}</span>
              {meta.shortLabel}
            </span>
          );
        })}
      </div>

      {spot.description && (
        <p className="line-clamp-2 text-sm text-sand/70">{spot.description}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <GaugeBar
          label="수심"
          value={spot.depth_max_m}
          max={30}
          unit="m"
          formatted={
            spot.depth_min_m != null && spot.depth_max_m != null
              ? `${spot.depth_min_m}–${spot.depth_max_m}m`
              : undefined
          }
        />
        <GaugeBar label="시야" value={spot.visibility_m} max={20} unit="m" />
      </div>

      <div className="flex items-center justify-between border-t border-foam/10 pt-3 text-xs text-sand/50">
        <span className="font-mono">신뢰도 {spot.trust_score}</span>
        <span>♥ {spot.like_count}</span>
      </div>
    </Link>
  );
}

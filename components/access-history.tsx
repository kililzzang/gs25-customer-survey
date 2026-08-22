import type { SpotAccessStepRevisionRow } from "@/lib/types/database";

/** feature flag: access_route_change_history (supabase/migrations/0010_feature_flags.sql) */
export function AccessHistory({ revisions }: { revisions: SpotAccessStepRevisionRow[] }) {
  if (revisions.length === 0) {
    return <p className="text-sm text-sand/40">접근로 변경 이력이 없습니다.</p>;
  }

  return (
    <ul className="space-y-2">
      {revisions.map((r) => (
        <li key={r.id} className="rounded-lg border border-foam/10 bg-navy/40 px-4 py-2.5 text-sm">
          <p className="text-sand/80">{r.reason}</p>
          <p className="mt-1 text-[11px] text-sand/30">
            {new Date(r.created_at).toLocaleDateString("ko-KR")}
          </p>
        </li>
      ))}
    </ul>
  );
}

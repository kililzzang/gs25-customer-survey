import type { MockLeaderboardEntry } from "@/lib/mock-data";

const TIER_LABEL: Record<string, string> = {
  newbie: "뉴비",
  explorer: "익스플로러",
  local_guide: "로컬 가이드",
  master: "마스터",
};

const BREAKDOWN_LABEL: Record<string, string> = {
  uploads: "업로드",
  likes_received: "받은 좋아요",
  hidden_discovery: "히든 발굴",
  detail_first: "상세 기여",
  verification: "검증 보너스",
};

export function LeaderboardTable({
  entries,
  track,
}: {
  entries: MockLeaderboardEntry[];
  track: "general" | "core";
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-foam/15">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-foam/15 bg-navy/60 text-left text-xs uppercase tracking-wider text-sand/40">
            <th className="px-4 py-3">순위</th>
            <th className="px-4 py-3">유저</th>
            <th className="px-4 py-3">등급</th>
            <th className="px-4 py-3">항목</th>
            <th className="px-4 py-3 text-right">점수</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.username} className="border-b border-foam/5 last:border-0 hover:bg-navy/40">
              <td className="px-4 py-3">
                <span
                  className={`font-mono ${
                    entry.rank <= 3 ? "text-coral" : "text-sand/60"
                  }`}
                >
                  #{entry.rank}
                </span>
              </td>
              <td className="px-4 py-3 text-sand">{entry.displayName}</td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-foam/20 px-2 py-0.5 text-[11px] text-foam/70">
                  {TIER_LABEL[entry.guideTier] ?? entry.guideTier}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-sand/50">
                {Object.entries(entry.breakdown)
                  .map(([k, v]) => `${BREAKDOWN_LABEL[k] ?? k} ${v}`)
                  .join(" · ")}
              </td>
              <td className="px-4 py-3 text-right font-mono text-foam">
                {entry.score}
                {track === "core" ? "pt" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import Link from "next/link";
import { getLeaderboard } from "@/lib/data";
import { getFeatureFlags } from "@/lib/feature-flags";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { ACTIVITIES } from "@/lib/activities";
import type { ActivityType, LeaderboardActivity } from "@/lib/types/database";

const ACTIVITY_FLAG_KEYS = [
  "activity_sea_swimming",
  "activity_surfing",
  "activity_freediving",
  "activity_scuba",
] as const;

function isActivitySlug(value: string): value is ActivityType {
  return ACTIVITIES.some((a) => a.key === value);
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string; activity?: string }>;
}) {
  const { track: trackParam, activity: activityParam } = await searchParams;
  const track = trackParam === "core" ? "core" : "general";
  // 일반 트랙은 액티비티 구분이 없어 항상 'all' 기준입니다.
  const activity: LeaderboardActivity =
    track === "core" && activityParam && isActivitySlug(activityParam) ? activityParam : "all";

  const [entries, flags] = await Promise.all([
    getLeaderboard(track, activity),
    getFeatureFlags(ACTIVITY_FLAG_KEYS),
  ]);

  const enabledMap: Record<ActivityType, boolean> = {
    snorkeling: true,
    sea_swimming: flags.activity_sea_swimming,
    surfing: flags.activity_surfing,
    freediving: flags.activity_freediving,
    scuba: flags.activity_scuba,
  };
  const activityFilterOptions = ACTIVITIES.filter((a) => enabledMap[a.key]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-foam/60">Leaderboard</p>
      <h1 className="mt-1 font-serif text-3xl text-sand">리더보드</h1>
      <p className="mt-2 text-sm text-sand/50">
        일반 트랙과 핵심 트랙, 2가지 기준으로 기여도를 집계합니다.
      </p>

      <div className="mt-8 flex gap-2 border-b border-foam/10">
        <TrackTab href="/leaderboard?track=general" active={track === "general"}>
          일반 트랙
        </TrackTab>
        <TrackTab href="/leaderboard?track=core" active={track === "core"}>
          핵심 트랙
        </TrackTab>
      </div>

      <p className="mt-4 text-xs text-sand/40">
        {track === "general"
          ? "최다 업로드 · 최다 좋아요 기준"
          : "히든 스팟 발굴왕 · 상세정보(좌표/접근로/주차팁) 기여왕 — 가중치가 별도로 적용됩니다."}
      </p>

      {track === "core" && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Link
            href="/leaderboard?track=core"
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              activity === "all"
                ? "border-foam bg-foam text-navy-deep"
                : "border-foam/20 text-sand/60 hover:border-foam/50"
            }`}
          >
            전체
          </Link>
          {activityFilterOptions.map((a) => (
            <Link
              key={a.key}
              href={`/leaderboard?track=core&activity=${a.key}`}
              className="rounded-full border px-3 py-1 text-xs font-medium transition"
              style={
                activity === a.key
                  ? { borderColor: a.color, color: "#0a2e36", background: a.color }
                  : { borderColor: `${a.color}55`, color: a.color }
              }
            >
              {a.icon} {a.shortLabel}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6">
        <LeaderboardTable entries={entries} track={track} />
      </div>

      <div className="mt-8 rounded-xl border border-foam/10 bg-navy/40 p-5 text-xs text-sand/40">
        <p className="font-mono">점수 체계</p>
        <ul className="mt-2 space-y-1">
          <li>일반 스팟 제보 <span className="text-foam/70">1점</span></li>
          <li>히든 스팟 신규 발굴 <span className="text-foam/70">5점</span></li>
          <li>상세 접근정보 최초 기재 <span className="text-foam/70">3점</span></li>
          <li>타 유저 검증(정확했어요) <span className="text-foam/70">+1점</span></li>
        </ul>
        <p className="mt-3">
          첫 제보자에게는 <Link href="/membership" className="text-foam/80 underline underline-offset-4">
            &ldquo;최초 발견자&rdquo;
          </Link> 영구 타이틀이 부여됩니다.
        </p>
      </div>
    </div>
  );
}

function TrackTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`-mb-px border-b-2 px-4 py-2 text-sm transition ${
        active ? "border-foam text-foam" : "border-transparent text-sand/50 hover:text-sand"
      }`}
    >
      {children}
    </Link>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { getCommunityPosts } from "@/lib/data";
import { getFeatureFlags } from "@/lib/feature-flags";
import { ACTIVITIES } from "@/lib/activities";
import { CommunityPostComposer } from "@/components/community-post-composer";
import type { ActivityType } from "@/lib/types/database";

const ACTIVITY_FLAG_KEYS = [
  "community_board",
  "activity_sea_swimming",
  "activity_surfing",
  "activity_freediving",
  "activity_scuba",
] as const;

function isActivitySlug(value: string): value is ActivityType {
  return ACTIVITIES.some((a) => a.key === value);
}

export const metadata: Metadata = {
  title: "커뮤니티 | 물빛",
  description: "액티비티별로 정보를 나누고 질문하는 물빛 커뮤니티 게시판입니다.",
};

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ activity?: string }>;
}) {
  const { activity: activityParam } = await searchParams;
  const flags = await getFeatureFlags(ACTIVITY_FLAG_KEYS);

  if (!flags.community_board) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-lg text-sand/70">🚧 준비 중인 기능입니다</p>
        <p className="mt-2 text-sm text-sand/40">
          액티비티별 커뮤니티 게시판을 곧 만나보실 수 있어요.
        </p>
      </div>
    );
  }

  const enabledMap: Record<ActivityType, boolean> = {
    snorkeling: true,
    sea_swimming: flags.activity_sea_swimming,
    surfing: flags.activity_surfing,
    freediving: flags.activity_freediving,
    scuba: flags.activity_scuba,
  };
  const activityOptions = ACTIVITIES.filter((a) => enabledMap[a.key]);
  const activity: ActivityType | undefined =
    activityParam && isActivitySlug(activityParam) && enabledMap[activityParam] ? activityParam : undefined;

  const posts = await getCommunityPosts(activity);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-foam/60">Community</p>
      <h1 className="mt-1 font-serif text-3xl text-sand">커뮤니티</h1>
      <p className="mt-2 text-sm text-sand/50">액티비티별로 정보를 나누고 질문해보세요.</p>

      <div className="mt-6 flex flex-wrap gap-1.5">
        <Link
          href="/community"
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
            !activity
              ? "border-foam bg-foam text-navy-deep"
              : "border-foam/20 text-sand/60 hover:border-foam/50"
          }`}
        >
          전체
        </Link>
        {activityOptions.map((a) => (
          <Link
            key={a.key}
            href={`/community?activity=${a.key}`}
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

      <div className="mt-8">
        <CommunityPostComposer
          activityOptions={activityOptions}
          defaultActivity={activity ?? activityOptions[0]?.key ?? "snorkeling"}
        />
      </div>

      <div className="mt-8 space-y-3">
        {posts.length === 0 ? (
          <p className="rounded-xl border border-foam/10 bg-navy/40 p-8 text-center text-sand/50">
            아직 게시글이 없습니다. 첫 글을 남겨보세요.
          </p>
        ) : (
          posts.map((p) => {
            const meta = ACTIVITIES.find((a) => a.key === p.activity);
            return (
              <Link
                key={p.id}
                href={`/community/${p.id}`}
                className="block rounded-xl border border-foam/10 bg-navy/40 p-4 transition hover:border-foam/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-sand">
                    {meta && <span aria-hidden>{meta.icon}</span>}
                    {p.title}
                  </span>
                  <span className="shrink-0 text-xs text-sand/40">💬 {p.reply_count}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-sand/50">{p.body}</p>
                <p className="mt-2 text-[11px] text-sand/30">
                  {p.username ?? "익명"} · {new Date(p.created_at).toLocaleDateString("ko-KR")}
                </p>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

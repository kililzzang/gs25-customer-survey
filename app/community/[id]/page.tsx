import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommunityPost } from "@/lib/data";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getActivityMeta } from "@/lib/activities";
import { CommunityReplyComposer } from "@/components/community-reply-composer";

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flags = await getFeatureFlags(["community_board"] as const);
  if (!flags.community_board) notFound();

  const { post, replies } = await getCommunityPost(id);
  if (!post) notFound();

  const meta = getActivityMeta(post.activity);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <nav className="mb-6 text-xs text-sand/40">
        <Link href="/community" className="hover:text-foam">
          커뮤니티
        </Link>
        <span className="mx-1.5">/</span>
        <span>{meta.label}</span>
      </nav>

      <span
        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
        style={{ borderColor: `${meta.color}66`, color: meta.color }}
      >
        <span aria-hidden>{meta.icon}</span> {meta.label}
      </span>
      <h1 className="mt-3 font-serif text-2xl text-sand">{post.title}</h1>
      <p className="mt-1 text-xs text-sand/40">
        {post.username ?? "익명"} · {new Date(post.created_at).toLocaleDateString("ko-KR")}
      </p>
      <p className="mt-5 whitespace-pre-wrap text-sm text-sand/80">{post.body}</p>

      <section className="mt-10">
        <h2 className="font-serif text-lg text-sand">
          댓글 {replies.length > 0 && <span className="text-sand/40">({replies.length})</span>}
        </h2>
        <div className="mt-4 space-y-3">
          {replies.map((r) => (
            <div key={r.id} className="rounded-xl border border-foam/10 bg-navy/40 p-4">
              <div className="flex items-center justify-between text-xs text-sand/40">
                <span>{r.username ?? "익명"}</span>
                <span>{new Date(r.created_at).toLocaleDateString("ko-KR")}</span>
              </div>
              <p className="mt-2 text-sm text-sand/80">{r.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <CommunityReplyComposer postId={post.id} />
        </div>
      </section>
    </div>
  );
}

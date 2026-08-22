"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ActivityMeta } from "@/lib/activities";
import type { ActivityType } from "@/lib/types/database";

type Status = "idle" | "loading" | "unconfigured" | "need_login" | "error";

export function CommunityPostComposer({
  activityOptions,
  defaultActivity,
}: {
  activityOptions: ActivityMeta[];
  defaultActivity: ActivityType;
}) {
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityType>(defaultActivity);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    const supabase = createClient();
    if (!supabase) {
      setStatus("unconfigured");
      return;
    }

    setStatus("loading");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("need_login");
      return;
    }

    const { data, error } = await supabase
      .from("community_posts")
      .insert({ author_id: user.id, activity, title: title.trim(), body: body.trim() } as never)
      .select("id")
      .single();

    if (error || !data) {
      setStatus("error");
      return;
    }

    setTitle("");
    setBody("");
    setStatus("idle");
    router.push(`/community/${(data as { id: string }).id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-foam/15 bg-navy/40 p-4">
      <div className="flex flex-wrap gap-1.5">
        {activityOptions.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setActivity(a.key)}
            className="rounded-full border px-2.5 py-1 text-xs font-medium transition"
            style={
              activity === a.key
                ? { borderColor: a.color, color: "#0a2e36", background: a.color }
                : { borderColor: `${a.color}55`, color: a.color }
            }
          >
            {a.icon} {a.shortLabel}
          </button>
        ))}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="w-full rounded-lg border border-foam/15 bg-navy-deep/60 px-3 py-2 text-sm text-sand placeholder:text-sand/30 focus:border-foam/50 focus:outline-none"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="내용을 입력하세요"
        rows={3}
        className="w-full rounded-lg border border-foam/15 bg-navy-deep/60 px-3 py-2 text-sm text-sand placeholder:text-sand/30 focus:border-foam/50 focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-coral">
          {status === "need_login" && "로그인 후 글을 작성할 수 있어요."}
          {status === "unconfigured" && "Supabase 연결 후 사용할 수 있어요."}
          {status === "error" && "글 작성에 실패했어요. 다시 시도해주세요."}
        </div>
        <button
          type="submit"
          disabled={status === "loading" || !title.trim() || !body.trim()}
          className="shrink-0 rounded-full bg-teal-light px-5 py-2 text-sm font-medium text-navy-deep transition hover:bg-foam disabled:cursor-not-allowed disabled:opacity-40"
        >
          글 작성
        </button>
      </div>
    </form>
  );
}

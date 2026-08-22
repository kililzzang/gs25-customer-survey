"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "unconfigured" | "need_login" | "error";

export function CommunityReplyComposer({ postId }: { postId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

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

    const { error } = await supabase
      .from("community_replies")
      .insert({ post_id: postId, author_id: user.id, body: body.trim() } as never);

    if (error) {
      setStatus("error");
      return;
    }

    setBody("");
    setStatus("idle");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="댓글을 입력하세요"
        rows={2}
        className="w-full rounded-lg border border-foam/15 bg-navy-deep/60 px-3 py-2 text-sm text-sand placeholder:text-sand/30 focus:border-foam/50 focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-coral">
          {status === "need_login" && "로그인 후 댓글을 작성할 수 있어요."}
          {status === "unconfigured" && "Supabase 연결 후 사용할 수 있어요."}
          {status === "error" && "댓글 작성에 실패했어요. 다시 시도해주세요."}
        </div>
        <button
          type="submit"
          disabled={status === "loading" || !body.trim()}
          className="shrink-0 rounded-full border border-foam/30 px-4 py-1.5 text-sm text-sand/80 transition hover:border-foam hover:text-foam disabled:cursor-not-allowed disabled:opacity-40"
        >
          댓글 작성
        </button>
      </div>
    </form>
  );
}

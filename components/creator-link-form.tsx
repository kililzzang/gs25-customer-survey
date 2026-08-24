"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isAllowedCreatorLinkUrl, CREATOR_LINK_TYPE_LABEL } from "@/lib/creator-links";
import type { CreatorLinkType } from "@/lib/types/database";

type Status = "idle" | "loading" | "unconfigured" | "need_login" | "invalid_url" | "error";

const LINK_TYPES: CreatorLinkType[] = ["youtube", "blog"];

/**
 * 방문자가 자기 블로그/유튜브 링크를 스팟에 등록하는 폼. 승인 대기 없이 즉시 공개되며,
 * 스팸 방지를 위해 허용된 도메인(lib/creator-links.ts)만 등록 가능합니다.
 */
export function CreatorLinkForm({ spotId }: { spotId: string }) {
  const router = useRouter();
  const [linkType, setLinkType] = useState<CreatorLinkType>("youtube");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    if (!isAllowedCreatorLinkUrl(url.trim(), linkType)) {
      setStatus("invalid_url");
      return;
    }

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

    const { error } = await supabase.from("spot_creator_links").insert({
      spot_id: spotId,
      user_id: user.id,
      link_type: linkType,
      url: url.trim(),
      title: title.trim(),
    } as never);

    if (error) {
      setStatus("error");
      return;
    }

    setTitle("");
    setUrl("");
    setStatus("idle");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-foam/15 bg-navy/40 p-4">
      <div className="flex gap-1.5">
        {LINK_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setLinkType(t)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              linkType === t
                ? "border-foam bg-foam text-navy-deep"
                : "border-foam/20 text-sand/60 hover:border-foam/50"
            }`}
          >
            {CREATOR_LINK_TYPE_LABEL[t]}
          </button>
        ))}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="콘텐츠 제목"
        className="w-full rounded-lg border border-foam/15 bg-navy-deep/60 px-3 py-2 text-sm text-sand placeholder:text-sand/30 focus:border-foam/50 focus:outline-none"
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={linkType === "youtube" ? "https://youtube.com/watch?v=..." : "https://blog.naver.com/..."}
        className="w-full rounded-lg border border-foam/15 bg-navy-deep/60 px-3 py-2 text-sm text-sand placeholder:text-sand/30 focus:border-foam/50 focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-coral">
          {status === "need_login" && "로그인 후 등록할 수 있어요."}
          {status === "unconfigured" && "Supabase 연결 후 사용할 수 있어요."}
          {status === "invalid_url" &&
            `허용된 ${CREATOR_LINK_TYPE_LABEL[linkType]} 도메인만 등록할 수 있어요 (예: ${
              linkType === "youtube" ? "youtube.com, youtu.be" : "blog.naver.com, tistory.com 등"
            })`}
          {status === "error" && "등록에 실패했어요. 다시 시도해주세요."}
        </div>
        <button
          type="submit"
          disabled={status === "loading" || !title.trim() || !url.trim()}
          className="shrink-0 rounded-full bg-teal-light px-5 py-2 text-sm font-medium text-navy-deep transition hover:bg-foam disabled:cursor-not-allowed disabled:opacity-40"
        >
          링크 등록
        </button>
      </div>
    </form>
  );
}

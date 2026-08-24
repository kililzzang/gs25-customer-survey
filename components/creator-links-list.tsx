import { extractYoutubeVideoId, CREATOR_LINK_TYPE_LABEL } from "@/lib/creator-links";
import type { SpotCreatorLinkRow } from "@/lib/types/database";

/** 스팟에 달린 크리에이터 링크(블로그/유튜브) 목록. 유튜브는 썸네일을 함께 보여줍니다. */
export function CreatorLinksList({ links }: { links: SpotCreatorLinkRow[] }) {
  if (links.length === 0) {
    return <p className="text-sm text-sand/40">아직 등록된 콘텐츠가 없습니다. 첫 콘텐츠를 공유해보세요.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {links.map((link) => {
        const videoId = link.link_type === "youtube" ? extractYoutubeVideoId(link.url) : null;
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex gap-3 overflow-hidden rounded-xl border border-foam/10 bg-navy/40 p-3 transition hover:border-foam/30"
          >
            {videoId ? (
              // eslint-disable-next-line @next/next/no-img-element -- 외부 유튜브 썸네일, next/image 도메인 설정 불필요한 단순 미리보기
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt=""
                className="h-16 w-24 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-teal/20 text-2xl">
                📝
              </div>
            )}
            <div className="min-w-0">
              <span className="rounded-full border border-foam/20 px-2 py-0.5 text-[10px] text-foam/70">
                {CREATOR_LINK_TYPE_LABEL[link.link_type]}
              </span>
              <p className="mt-1 line-clamp-2 text-sm text-sand">{link.title}</p>
              <p className="mt-1 text-[11px] text-sand/40">by {link.username ?? "익명"}</p>
            </div>
          </a>
        );
      })}
    </div>
  );
}

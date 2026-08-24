import type { CreatorLinkType } from "@/lib/types/database";

/**
 * 크리에이터 링크(블로그/유튜브) 허용 도메인 화이트리스트.
 * 승인 대기 없이 즉시 공개하는 대신, 임의 URL 스팸을 막기 위해 앱 레벨에서
 * 이 화이트리스트로만 등록을 허용합니다 (supabase/migrations/0021_creator_links.sql).
 */
const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"];
const BLOG_HOSTS = [
  "blog.naver.com",
  "tistory.com", // *.tistory.com 서브도메인은 endsWith로 별도 처리
  "brunch.co.kr",
  "velog.io",
  "medium.com",
  "instagram.com",
  "www.instagram.com",
];

function getHost(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function matchesHost(host: string, allowed: string[]): boolean {
  return allowed.some((a) => host === a || host.endsWith(`.${a}`));
}

/** 링크 타입(blog/youtube/other)에 맞는 URL인지 검증. other는 화이트리스트 없이 허용하지 않습니다(스팸 방지). */
export function isAllowedCreatorLinkUrl(url: string, linkType: CreatorLinkType): boolean {
  const host = getHost(url);
  if (!host) return false;
  if (linkType === "youtube") return matchesHost(host, YOUTUBE_HOSTS);
  if (linkType === "blog") return matchesHost(host, BLOG_HOSTS);
  return false; // "other" 타입은 현재 화이트리스트가 없어 등록 불가 — 필요 시 도메인 추가 후 허용
}

/** youtube.com/watch?v=, youtu.be/ 등에서 영상 ID를 추출 (썸네일 표시용). 실패 시 null. */
export function extractYoutubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] || null;
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] || null;
    }
    return null;
  } catch {
    return null;
  }
}

export const CREATOR_LINK_TYPE_LABEL: Record<CreatorLinkType, string> = {
  blog: "블로그",
  youtube: "유튜브",
  other: "기타",
};

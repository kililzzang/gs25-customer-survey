import type { MetadataRoute } from "next";

/**
 * 크롤러 정책. 스팟 상세 페이지 자체(이름/사진/대략위치/후기/게이지)는 공개 정보라
 * 계속 색인을 허용합니다. 인증이 필요한 액션 경로/내부 API만 명시적으로 차단합니다.
 * (실제 방어는 로그인 게이트 + rate limit이며, 이 파일은 정상적인 크롤러를 위한
 *  정책 신호일 뿐입니다.)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/spots/*/contribute"],
    },
  };
}

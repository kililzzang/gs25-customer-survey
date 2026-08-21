import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

// Next.js 16: `middleware.ts`가 `proxy.ts`로 개명되었습니다(동작은 동일).
// https://nextjs.org/docs/app/api-reference/file-conventions/proxy
export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    /*
     * 정적 자산/이미지 최적화/favicon을 제외한 모든 경로에서 실행하여
     * Supabase 세션 쿠키를 매 요청마다 최신 상태로 유지합니다.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

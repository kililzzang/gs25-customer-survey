import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";

/**
 * proxy.ts(구 middleware.ts, Next.js 16부터 개명)에서 호출하는 Supabase 세션 갱신 로직.
 * 요청마다 만료된 액세스 토큰을 갱신하고 최신 쿠키를 응답에 반영합니다.
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function updateSupabaseSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Supabase 미설정 상태(로컬 목업 단계)에서는 세션 갱신을 건너뜁니다.
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // 반드시 호출: 만료된 토큰이 있으면 갱신하고 위 setAll을 통해 쿠키를 새로 씁니다.
  await supabase.auth.getUser();

  return supabaseResponse;
}

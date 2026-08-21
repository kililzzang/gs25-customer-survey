import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

/**
 * 서버 컴포넌트 / 라우트 핸들러에서 사용하는 Supabase 클라이언트.
 * 환경변수가 설정되지 않은 개발 초기 단계에서는 null을 반환하며,
 * 호출부(lib/data.ts)에서 목업 데이터로 폴백합니다.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component에서 호출된 경우 무시 (미들웨어에서 세션 갱신 처리)
        }
      },
    },
  });
}

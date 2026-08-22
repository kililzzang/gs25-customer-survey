import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
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

// 스팟 상세 페이지/관련 API — 비로그인 스크래핑 억제용 IP 기준 보조 rate limit 대상.
// 주 방어(계정 기준)는 unlock_spot_details RPC 내부(supabase/migrations/0014_anti_scraping.sql)에 있습니다.
const IP_RATE_LIMITED_PATTERNS = [/^\/spots\/[^/]+$/, /^\/api\/spots\//];

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || null;
}

/**
 * 스팟 상세 페이지/관련 API에 대한 IP 기준 보조 rate limit (분당 60건).
 * 계정을 만들지 않고 접근하는 스크래핑을 억제하는 목적이며, 로그인 게이트 자체가
 * 이미 대부분의 스크래핑 표면을 줄여줍니다. Supabase 미설정 시에는 항상 통과시킵니다.
 */
export async function checkIpRateLimitForRequest(request: NextRequest): Promise<boolean> {
  const pathname = request.nextUrl.pathname;
  if (!IP_RATE_LIMITED_PATTERNS.some((p) => p.test(pathname))) return true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return true;

  const ip = getClientIp(request);
  if (!ip) return true; // IP를 알 수 없으면 차단하지 않음(오탐 방지)

  const supabase = createSupabaseClient<Database>(url, anonKey);
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_identity_key: `ip:${hashIp(ip)}`,
    p_path: pathname,
    p_spot_id: null,
    p_limit_per_minute: 60,
  });

  if (error) return true; // rate limit 인프라 오류로 정상 요청까지 막지 않음(fail-open)
  return data === true;
}

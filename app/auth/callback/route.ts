import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth(예: Google) 로그인 콜백.
 * signInWithOAuth() 로 시작된 흐름이 `?code=...` 형태로 이곳에 도착합니다(PKCE).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        redirect(next);
      }
    }
  }

  redirect("/login?error=invalid_link");
}

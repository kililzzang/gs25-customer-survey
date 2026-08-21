import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 이메일 매직링크(OTP) 확인 콜백.
 * signInWithOtp() 로 발송된 링크가 `?token_hash=...&type=...` 형태로 이곳에 도착합니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (tokenHash && type) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) {
        redirect(next);
      }
    }
  }

  redirect("/login?error=invalid_link");
}

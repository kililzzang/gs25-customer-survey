import { createClient } from "@/lib/supabase/server";
import type { GuideTier } from "@/lib/types/database";

export interface CurrentUser {
  id: string;
  email: string | null;
  username: string;
  displayName: string;
  guideTier: GuideTier;
}

/**
 * 현재 로그인한 유저 정보를 profiles 테이블과 함께 조회합니다.
 * Supabase 미설정 또는 비로그인 상태에서는 null을 반환합니다.
 * (public.handle_new_user 트리거가 auth.users insert 시 profiles row를 자동 생성합니다.
 *  supabase/migrations/0006_handle_new_user.sql 참고)
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, guide_tier")
    .eq("id", user.id)
    .maybeSingle();

  const fallbackUsername = user.email?.split("@")[0] ?? user.id.slice(0, 8);

  return {
    id: user.id,
    email: user.email ?? null,
    username: profile?.username ?? fallbackUsername,
    displayName: profile?.display_name ?? profile?.username ?? fallbackUsername,
    guideTier: profile?.guide_tier ?? "newbie",
  };
}

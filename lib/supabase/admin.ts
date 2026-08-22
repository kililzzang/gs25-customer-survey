import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * ⚠️ 서비스 롤 키를 사용하는 관리자 전용 Supabase 클라이언트. RLS를 완전히
 * 우회합니다 — 절대 클라이언트 컴포넌트/브라우저 번들에 임포트하지 마세요.
 *
 * 현재 유일한 용도: 비공개 원본 사진 버킷(spot-photos-originals) 업로드
 * (app/api/uploads/photo/route.ts). 그 외 일반적인 서버 작업은
 * lib/supabase/server.ts(쿠키 기반, 유저 세션 유지)를 사용하세요.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

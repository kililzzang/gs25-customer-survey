import { createClient } from "@/lib/supabase/server";
import { createHash } from "node:crypto";

/**
 * 계정/IP 기준 rate limit 체크 (supabase/migrations/0014_anti_scraping.sql 의
 * check_rate_limit RPC를 감싸는 헬퍼). Supabase 미연결(목업 모드)에서는 항상 허용합니다.
 */
export async function checkRateLimit(
  identityKey: string,
  opts: { path?: string; spotId?: string; limitPerMinute?: number } = {}
): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return true;

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_identity_key: identityKey,
    p_path: opts.path ?? null,
    p_spot_id: opts.spotId ?? null,
    p_limit_per_minute: opts.limitPerMinute ?? 30,
  });

  if (error) {
    // rate limit 인프라 자체의 오류로 사용자를 막지는 않습니다 (fail-open).
    console.error("checkRateLimit error", error);
    return true;
  }

  return data === true;
}

/** 원문 IP를 저장하지 않기 위한 해시. 개인정보 최소화 목적. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface CheckinButtonProps {
  spotId: string;
  initialActiveCount: number;
  initialIsCheckedIn: boolean;
}

/** feature flag: live_checkin_crowd_count (supabase/migrations/0010_feature_flags.sql) */
export function CheckinButton({
  spotId,
  initialActiveCount,
  initialIsCheckedIn,
}: CheckinButtonProps) {
  const [activeCount, setActiveCount] = useState(initialActiveCount);
  const [isCheckedIn, setIsCheckedIn] = useState(initialIsCheckedIn);
  const [status, setStatus] = useState<"idle" | "loading" | "unconfigured" | "need_login">("idle");

  async function handleToggle() {
    const supabase = createClient();
    if (!supabase) {
      setStatus("unconfigured");
      return;
    }

    setStatus("loading");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("need_login");
      return;
    }

    if (isCheckedIn) {
      const { error } = await supabase
        .from("spot_checkins")
        .delete()
        .eq("spot_id", spotId)
        .eq("user_id", user.id);
      if (!error) {
        setIsCheckedIn(false);
        setActiveCount((c) => Math.max(0, c - 1));
      }
    } else {
      const { error } = await supabase
        .from("spot_checkins")
        .upsert({ spot_id: spotId, user_id: user.id, checked_in_at: new Date().toISOString() } as never);
      if (!error) {
        setIsCheckedIn(true);
        setActiveCount((c) => c + 1);
      }
    }
    setStatus("idle");
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-foam/15 bg-navy/40 px-4 py-3">
      <button
        onClick={handleToggle}
        disabled={status === "loading"}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
          isCheckedIn
            ? "bg-foam text-navy-deep hover:brightness-95"
            : "border border-foam/30 text-sand/80 hover:border-foam hover:text-foam"
        }`}
      >
        {isCheckedIn ? "✓ 여기 있어요 체크인됨" : "📍 오늘 여기 있어요"}
      </button>
      <span className="text-sm text-sand/60">
        현재 <span className="font-mono text-foam">{activeCount}</span>명 체크인 중
      </span>
      {status === "need_login" && (
        <span className="text-xs text-coral">로그인 후 체크인할 수 있어요.</span>
      )}
      {status === "unconfigured" && (
        <span className="text-xs text-coral">Supabase 연결 후 사용할 수 있어요.</span>
      )}
    </div>
  );
}

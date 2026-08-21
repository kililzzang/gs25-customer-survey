"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error" | "unconfigured";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setStatus("unconfigured");
      return;
    }

    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setStatus(error ? "error" : "sent");
  }

  async function handleGoogle() {
    const supabase = createClient();
    if (!supabase) {
      setStatus("unconfigured");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-foam/30 bg-teal/15 p-6 text-center">
        <p className="font-serif text-lg text-foam">메일함을 확인해주세요 📬</p>
        <p className="mt-2 text-sm text-sand/60">
          <span className="font-mono">{email}</span>로 로그인 링크를 보냈습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleMagicLink} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-sand/50">이메일</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
          />
        </label>
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-full bg-teal-light py-2.5 text-sm font-medium text-navy-deep transition hover:bg-foam disabled:opacity-50"
        >
          {status === "sending" ? "전송 중…" : "매직링크로 로그인"}
        </button>
      </form>

      {status === "error" && (
        <p className="text-sm text-coral">전송에 실패했습니다. 이메일 주소를 확인해주세요.</p>
      )}
      {status === "unconfigured" && (
        <p className="text-sm text-coral">
          Supabase가 아직 연결되지 않았습니다. `.env.local`에 프로젝트 키를 설정해주세요.
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-sand/30">
        <span className="h-px flex-1 bg-foam/10" />
        또는
        <span className="h-px flex-1 bg-foam/10" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="w-full rounded-full border border-foam/25 py-2.5 text-sm text-sand/80 transition hover:border-foam hover:text-foam"
      >
        Google로 계속하기
      </button>
    </div>
  );
}

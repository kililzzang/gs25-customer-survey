export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-foam/60">Sign in</p>
      <h1 className="mt-1 font-serif text-2xl text-sand">물빛에 로그인</h1>
      <p className="mt-2 text-sm text-sand/50">
        Supabase Auth 연동 예정 (이메일 매직링크 · 소셜 로그인).
      </p>

      <form className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-sand/50">이메일</span>
          <input type="email" className="input" placeholder="you@example.com" disabled />
        </label>
        <button
          type="button"
          disabled
          className="w-full rounded-full bg-teal-light py-2.5 text-sm font-medium text-navy-deep opacity-60"
        >
          매직링크 보내기 (준비 중)
        </button>
      </form>
    </div>
  );
}

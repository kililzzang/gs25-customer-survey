import { LoginForm } from "@/components/login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-foam/60">Sign in</p>
      <h1 className="mt-1 font-serif text-2xl text-sand">물빛에 로그인</h1>
      <p className="mt-2 text-sm text-sand/50">
        이메일 매직링크 또는 Google 계정으로 로그인/가입할 수 있어요.
      </p>

      <LoginErrorNotice searchParams={searchParams} />

      <div className="mt-8">
        <LoginFormWithNext searchParams={searchParams} />
      </div>
    </div>
  );
}

async function LoginFormWithNext({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginForm next={next} />;
}

async function LoginErrorNotice({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  if (!error) return null;
  return (
    <p className="mt-4 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
      로그인 링크가 만료되었거나 유효하지 않습니다. 다시 시도해주세요.
    </p>
  );
}

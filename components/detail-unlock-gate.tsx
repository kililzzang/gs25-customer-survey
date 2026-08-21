import Link from "next/link";

interface DetailUnlockGateProps {
  isLoggedIn: boolean;
  hasContent: boolean;
  spotSlug: string;
  /**
   * 반드시 함수로 전달하세요 (JSX를 직접 넘기지 마세요).
   * Server Component에서 children을 JSX로 직접 받으면, 실제로 렌더링되지 않는 분기라도
   * 그 JSX가 이미 구성되어 RSC 페이로드에 직렬화되어 클라이언트로 전송될 수 있습니다
   * (비로그인 상태에서도 잠금 콘텐츠가 HTML/Flight 스트림에 실리는 보안 구멍).
   * 함수로 감싸면 이 컴포넌트가 실제로 "unlocked" 분기에서 호출할 때만 평가됩니다.
   */
  children: () => React.ReactNode;
}

/**
 * "정확한 위치와 접근 방법" 잠금 게이트.
 *
 * unlock_condition 기본값은 'login' (supabase/migrations/0008_unlock_condition_gate.sql) —
 * MVP 단계에서는 광고 SDK 없이 로그인만으로 즉시 열람하도록 구현합니다.
 * 서비스 정착 후 트래픽이 붙으면 app_settings.detail_unlock_condition을
 * 'ad' | 'ad_or_login' | 'premium_only'로 바꿔 배포 없이 광고 게이트로 전환할 수 있으며,
 * 그때는 이 컴포넌트에 광고 시청 흐름(카운트다운 등)을 조건별로 추가하면 됩니다.
 */
export function DetailUnlockGate({
  isLoggedIn,
  hasContent,
  spotSlug,
  children,
}: DetailUnlockGateProps) {
  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-foam/15 bg-navy/60 p-6 text-center">
        <p className="font-serif text-lg text-sand">정확한 위치와 접근 방법 🔒</p>
        <p className="mt-2 text-sm text-sand/50">
          로그인하면 정확한 좌표, 접근 경로, 주차 정보를 광고 없이 바로 볼 수 있어요.
        </p>
        <Link
          href={`/login?next=/spots/${spotSlug}`}
          className="mt-4 inline-block rounded-full bg-coral px-5 py-2 text-sm font-medium text-navy-deep transition hover:brightness-110"
        >
          로그인하고 보기
        </Link>
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="rounded-xl border border-foam/15 bg-navy/60 p-6 text-center text-sm text-sand/40">
        아직 등록된 상세 접근 정보가 없습니다.
      </div>
    );
  }

  return <>{children()}</>;
}

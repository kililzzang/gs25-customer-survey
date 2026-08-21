import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/regions/jeju", label: "지역 탐색" },
  { href: "/leaderboard", label: "리더보드" },
  { href: "/challenges", label: "챌린지" },
  { href: "/submit", label: "제보하기" },
  { href: "/membership", label: "멤버십" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-foam/10 bg-navy-deep/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-xl font-semibold tracking-tight text-foam">물빛</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-widest text-sand/40 sm:inline">
            mulbit.dive
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-sand/70 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-foam">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href={`/profile/${user.username}`}
                className="text-sm text-sand/80 transition hover:text-foam"
              >
                @{user.username}
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-full border border-foam/30 px-4 py-1.5 text-sm text-sand/80 transition hover:border-foam hover:text-foam"
                >
                  로그아웃
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-foam/30 px-4 py-1.5 text-sm text-sand/80 transition hover:border-foam hover:text-foam"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

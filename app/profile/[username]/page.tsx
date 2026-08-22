import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfileByUsername, getAllBadges, getAllSpots, getUserCertifications } from "@/lib/data";
import { getFeatureFlags } from "@/lib/feature-flags";

const TIER_LABEL: Record<string, string> = {
  newbie: "뉴비",
  explorer: "익스플로러",
  local_guide: "로컬 가이드",
  master: "마스터",
};

const CERT_ORG_LABEL: Record<string, string> = {
  PADI: "PADI",
  AIDA: "AIDA",
  SSI: "SSI",
  NAUI: "NAUI",
  KOSDA: "KOSDA",
  other: "기타",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const [profile, allSpots, allBadges, flags] = await Promise.all([
    getProfileByUsername(username),
    getAllSpots(),
    Promise.resolve(getAllBadges()),
    getFeatureFlags(["certifications_profile"] as const),
  ]);
  if (!profile) notFound();

  const certifications = flags.certifications_profile ? await getUserCertifications(username) : [];

  const spotBySlug = new Map(allSpots.map((s) => [s.slug, s]));

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* 프로필 헤더 */}
      <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-foam/15 bg-navy/50 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-foam/30 bg-teal/30 font-serif text-2xl text-foam">
          {profile.displayName[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl text-sand">{profile.displayName}</h1>
            <span className="rounded-full border border-foam/25 px-2 py-0.5 text-[11px] text-foam/70">
              {TIER_LABEL[profile.guideTier] ?? profile.guideTier}
            </span>
          </div>
          <p className="text-xs text-sand/40">@{profile.username}</p>
          <p className="mt-2 max-w-xl text-sm text-sand/70">{profile.bio}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wider text-sand/40">신뢰도</p>
          <p className="font-mono text-2xl text-foam">{profile.trustScore}</p>
        </div>
      </div>

      {/* 영구 타이틀 */}
      {profile.titles.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {profile.titles.map((title) => (
            <span
              key={title}
              className="rounded-full border border-coral/40 bg-coral/10 px-3 py-1 text-xs text-coral"
            >
              ★ {title}
            </span>
          ))}
        </div>
      )}

      {/* 뱃지 */}
      <section className="mt-10">
        <h2 className="font-serif text-lg text-sand">뱃지</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {allBadges.map((badge) => {
            const earned = profile.badgeKeys.includes(badge.key);
            return (
              <div
                key={badge.key}
                className={`rounded-xl border p-4 text-center transition ${
                  earned
                    ? "border-foam/30 bg-teal/15"
                    : "border-foam/5 bg-navy/30 opacity-40 grayscale"
                }`}
              >
                <div className="text-2xl">{badge.icon}</div>
                <p className="mt-2 text-xs text-sand">{badge.name}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 공인 자격증 (feature flag: certifications_profile) */}
      {flags.certifications_profile && certifications.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-lg text-sand">공인 자격증</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between rounded-xl border border-foam/15 bg-navy/40 p-4"
              >
                <div>
                  <p className="flex items-center gap-2 text-sm text-sand">
                    <span className="font-mono text-foam/80">{CERT_ORG_LABEL[cert.org] ?? cert.org}</span>
                    {cert.level}
                  </p>
                  {cert.issued_at && (
                    <p className="mt-1 text-xs text-sand/40">
                      취득일 {new Date(cert.issued_at).toLocaleDateString("ko-KR")}
                    </p>
                  )}
                </div>
                {cert.verified ? (
                  <span className="rounded-full border border-foam/40 bg-foam/10 px-2.5 py-1 text-[11px] text-foam">
                    🎓 인증됨
                  </span>
                ) : (
                  <span className="rounded-full border border-sand/20 px-2.5 py-1 text-[11px] text-sand/40">
                    확인중
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 방문 스탬프 지도 */}
      <section className="mt-10">
        <h2 className="font-serif text-lg text-sand">방문 스탬프</h2>
        <p className="mt-1 text-xs text-sand/40">내가 방문한 곳 컬렉션 · 총 {profile.visitedSpotSlugs.length}곳</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {profile.visitedSpotSlugs.map(({ slug, visitedAt }) => {
            const spot = spotBySlug.get(slug);
            return (
              <Link
                key={slug}
                href={`/spots/${slug}`}
                className="flex aspect-square -rotate-2 flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-foam/40 bg-navy-deep/60 p-3 text-center transition hover:rotate-0 hover:border-foam"
              >
                <span className="text-[11px] leading-tight text-sand">{spot?.name ?? slug}</span>
                <span className="font-mono text-[10px] text-foam/60">
                  {new Date(visitedAt).toLocaleDateString("ko-KR")}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 내 제보 이력 */}
      <section className="mt-10">
        <h2 className="font-serif text-lg text-sand">내 제보 이력</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-foam/15">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-foam/15 bg-navy/60 text-left text-xs uppercase tracking-wider text-sand/40">
                <th className="px-4 py-3">스팟</th>
                <th className="px-4 py-3">유형</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">날짜</th>
                <th className="px-4 py-3 text-right">적립 점수</th>
              </tr>
            </thead>
            <tbody>
              {profile.reports.map((r, i) => (
                <tr key={i} className="border-b border-foam/5 last:border-0">
                  <td className="px-4 py-3 text-sand">{r.spotName}</td>
                  <td className="px-4 py-3 text-sand/60">{r.type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs ${
                        r.status === "승인됨" ? "text-foam" : "text-sand/50"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sand/40">{r.createdAt}</td>
                  <td className="px-4 py-3 text-right font-mono text-foam">
                    {r.points > 0 ? `+${r.points}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getSpotBySlug, getSpotLockedInfo, getSpotReviews } from "@/lib/data";
import { GaugeBar } from "@/components/gauge-bar";
import { HiddenBadge } from "@/components/hidden-badge";
import { AdGate } from "@/components/ad-gate";
import { CURRENT_LEVEL_LABEL, SPOT_STATUS_LABEL, getRegionMeta } from "@/lib/regions";

export default async function SpotDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { spot, safety, partners } = await getSpotBySlug(slug);
  if (!spot) notFound();

  // 목업 단계: 항상 잠금정보를 조회해 AdGate에 넘기고, 실제 노출 여부는 클라이언트(AdGate)가
  // 광고 시청/멤버십 상태에 따라 결정합니다. 실 서비스에서는 인증된 요청마다
  // unlock_spot_details RPC가 ad_unlocks/멤버십을 서버에서 검증한 뒤에만 값을 반환합니다.
  const [lockedInfo, reviews] = await Promise.all([
    getSpotLockedInfo(slug, { unlocked: true }),
    getSpotReviews(slug, spot.id),
  ]);

  const regionMeta = getRegionMeta(spot.region);
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <nav className="mb-6 text-xs text-sand/40">
        <Link href={`/regions/${spot.region}`} className="hover:text-foam">
          {regionMeta.name}
        </Link>
        <span className="mx-1.5">/</span>
        <span>{spot.name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl text-sand">{spot.name}</h1>
            {spot.is_hidden && <HiddenBadge size="md" />}
          </div>
          <p className="mt-2 text-sm text-sand/50">
            {SPOT_STATUS_LABEL[spot.status]} · 신뢰도{" "}
            <span className="font-mono text-foam/80">{spot.trust_score}</span>
            {spot.last_verified_at && (
              <> · 최근 검증 {new Date(spot.last_verified_at).toLocaleDateString("ko-KR")}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full border border-foam/30 px-4 py-2 text-sm text-sand/80 transition hover:border-foam hover:text-foam">
            ♥ 좋아요 {spot.like_count}
          </button>
          <Link
            href={`/spots/${spot.slug}/contribute`}
            className="rounded-full bg-teal-light px-4 py-2 text-sm font-medium text-navy-deep transition hover:bg-foam"
          >
            상세정보 기여
          </Link>
        </div>
      </div>

      {/* 사진 (목업 플레이스홀더) */}
      <div className="depth-lines mt-8 flex aspect-[16/7] items-center justify-center rounded-xl border border-foam/15 bg-navy/50 text-sand/30">
        사진 업로드 영역 (스토리지 연동 예정)
      </div>

      <p className="mt-6 text-sand/70">{spot.description}</p>

      {/* 게이지 데이터 */}
      <section className="mt-8 rounded-xl border border-foam/15 bg-navy/50 p-6">
        <h2 className="font-serif text-lg text-sand">다이빙 게이지</h2>
        <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-4">
          <GaugeBar
            label="수심"
            value={spot.depth_max_m}
            max={30}
            unit="m"
            formatted={
              spot.depth_min_m != null && spot.depth_max_m != null
                ? `${spot.depth_min_m}–${spot.depth_max_m}m`
                : undefined
            }
          />
          <GaugeBar label="시야" value={spot.visibility_m} max={20} unit="m" />
          <GaugeBar
            label="조류"
            value={spot.current_level === "unknown" ? null : { calm: 1, moderate: 2, strong: 3 }[spot.current_level]}
            max={3}
            unit=""
            formatted={CURRENT_LEVEL_LABEL[spot.current_level]}
          />
          <GaugeBar label="수온" value={spot.water_temp_c} max={30} unit="℃" />
        </div>
      </section>

      {/* 안전 정보 — 게이트 예외, 항상 무료 공개 */}
      {safety && (
        <section className="mt-6 rounded-xl border border-coral/30 bg-coral/5 p-6">
          <h2 className="font-serif text-lg text-coral">안전 정보</h2>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-coral/70">
            항상 무료 공개 · 광고 게이트 예외
          </p>
          {safety.current_warning && (
            <p className="mt-3 text-sm text-sand/80">⚠ {safety.current_warning}</p>
          )}
          <ul className="mt-3 flex flex-wrap gap-4 text-sm">
            {safety.emergency_contacts.map((c) => (
              <li key={c.phone} className="font-mono text-sand/80">
                {c.label}: {c.phone}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 잠금 정보 — 광고 게이트 */}
      <section className="mt-6">
        <AdGate spotId={spot.id} lockedInfo={lockedInfo} />
      </section>

      {/* 제휴 배너 */}
      {partners.length > 0 && (
        <section className="mt-6 space-y-3">
          {partners.map((p) => (
            <a
              key={p.id}
              href={p.cta_url ?? "#"}
              className="flex items-center justify-between rounded-xl border border-teal-light/30 bg-teal/10 px-5 py-4 transition hover:border-teal-light/60"
            >
              <div>
                <p className="text-xs uppercase tracking-wider text-foam/60">
                  {p.listing_type === "rental" ? "장비 대여" : "투어"} 제휴
                </p>
                <p className="mt-1 text-sand">{p.partner_name}</p>
              </div>
              <span className="rounded-full bg-teal-light px-4 py-1.5 text-sm font-medium text-navy-deep">
                {p.cta_label}
              </span>
            </a>
          ))}
        </section>
      )}

      {/* 후기 */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg text-sand">
            후기 {reviews.length > 0 && <span className="text-sand/40">({reviews.length})</span>}
          </h2>
          {avgRating && <span className="font-mono text-sm text-foam">★ {avgRating}</span>}
        </div>
        <div className="mt-4 space-y-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-sand/40">아직 후기가 없습니다. 첫 후기를 남겨보세요.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-foam/10 bg-navy/40 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sand/80">{r.username ?? "익명"}</span>
                  <span className="font-mono text-foam/80">{"★".repeat(r.rating)}</span>
                </div>
                <p className="mt-2 text-sm text-sand/70">{r.body}</p>
                {r.visited_at && (
                  <p className="mt-2 text-[11px] text-sand/30">
                    방문일 {new Date(r.visited_at).toLocaleDateString("ko-KR")}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

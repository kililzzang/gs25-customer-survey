import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSpotBySlug,
  getSpotLockedInfo,
  getSpotAccessSteps,
  getSpotParkingOptions,
  getSpotEmergencyFacilities,
  getSpotReviews,
  getSpotSpecies,
  getSpotCheckinInfo,
  getSpotAccessStepRevisions,
} from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getSunTimes, formatSunTime } from "@/lib/sun";
import { GaugeBar } from "@/components/gauge-bar";
import { HiddenBadge } from "@/components/hidden-badge";
import { DetailUnlockGate } from "@/components/detail-unlock-gate";
import { KakaoMap } from "@/components/kakao-map";
import { KakaoRoadview } from "@/components/kakao-roadview";
import { AccessSteps } from "@/components/access-steps";
import { ParkingOptions } from "@/components/parking-options";
import { EmergencyFacilities } from "@/components/emergency-facilities";
import { SosButton } from "@/components/sos-button";
import { SpeciesTags } from "@/components/species-tags";
import { AccessHistory } from "@/components/access-history";
import { CheckinButton } from "@/components/checkin-button";
import {
  CURRENT_LEVEL_LABEL,
  SPOT_STATUS_LABEL,
  CROWD_TAG_LABEL,
  getRegionMeta,
} from "@/lib/regions";

const SPOT_PAGE_FLAGS = [
  // 1단계
  "map_pin_route_polyline",
  "kakao_roadview",
  "access_step_cards",
  "parking_options_detail",
  "estimated_walk_time",
  "restroom_shower_markers",
  "nearest_emergency_facilities",
  "sos_button",
  // 2단계 (외부 API 불필요한 것만 활성화)
  "sunrise_sunset_times",
  "route_based_partner_recs",
  "gpx_route_download",
  // 3단계 (외부 API 불필요한 것만 활성화)
  "live_checkin_crowd_count",
  "species_field_guide",
  "access_route_change_history",
] as const;

export default async function SpotDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { spot, safety, partners } = await getSpotBySlug(slug);
  if (!spot) notFound();

  const [
    user,
    lockedInfo,
    accessSteps,
    parkingOptions,
    emergencyFacilities,
    reviews,
    species,
    checkinInfo,
    accessHistory,
    flags,
  ] = await Promise.all([
    getCurrentUser(),
    getSpotLockedInfo(slug),
    getSpotAccessSteps(spot.id, slug),
    getSpotParkingOptions(spot.id, slug),
    getSpotEmergencyFacilities(spot.id, slug),
    getSpotReviews(slug, spot.id),
    getSpotSpecies(spot.id, slug),
    getSpotCheckinInfo(spot.id, slug),
    getSpotAccessStepRevisions(spot.id, slug),
    getFeatureFlags(SPOT_PAGE_FLAGS),
  ]);

  // 일출/일몰은 대략 위치(공개 정보)만으로 순수 계산 — 외부 API 불필요, 게이트 없음.
  const sunTimes = getSunTimes(spot.approx_lat, spot.approx_lng);

  const isLoggedIn = !!user;
  const hasUnlockedContent = !!lockedInfo;
  // 목업 모드에서는 데모 편의를 위해 lockedInfo/accessSteps/parkingOptions를
  // 로그인 여부와 무관하게 항상 채워 반환합니다 (lib/data.ts 참고) — 그래서
  // 실제로 클라이언트에 노출할지는 반드시 isLoggedIn까지 함께 확인합니다.
  const unlocked = isLoggedIn && hasUnlockedContent;
  const regionMeta = getRegionMeta(spot.region);
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  // 카카오맵(클라이언트 컴포넌트) 프롭으로 넘길 좌표만 최소 형태로 추출합니다.
  // (제목/설명 등 나머지 필드까지 통째로 넘기면 불필요하게 클라이언트 페이로드에 실립니다)
  const routeStepPoints = accessSteps
    .filter((s): s is typeof s & { lat: number; lng: number } => s.lat != null && s.lng != null)
    .map((s) => ({ lat: s.lat, lng: s.lng }));
  const parkingMapPins = parkingOptions
    .filter((p): p is typeof p & { lat: number; lng: number } => p.lat != null && p.lng != null)
    .map((p) => ({ lat: p.lat, lng: p.lng, label: p.label, type: p.parking_type }));

  const bannerPartners = partners.filter((p) => p.listing_type === "rental" || p.listing_type === "tour");
  const routePartners = partners.filter(
    (p) => p.listing_type === "route_food" || p.listing_type === "route_cafe"
  );

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
            {SPOT_STATUS_LABEL[spot.status]}
            {spot.subregion && <> · {spot.subregion}</>} · 신뢰도{" "}
            <span className="font-mono text-foam/80">{spot.trust_score}</span>
            {spot.last_verified_at && (
              <> · 최근 검증 {new Date(spot.last_verified_at).toLocaleDateString("ko-KR")}</>
            )}
          </p>
          {!spot.coordinates_verified && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-coral/30 bg-coral/10 px-3 py-1 text-xs text-coral">
              ⚠ 좌표 미검증 — 지도 기준 추정 위치이며 실사 검증 전입니다
            </p>
          )}
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

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-sand/60">
        {flags.sunrise_sunset_times && (
          <span>
            🌅 {formatSunTime(sunTimes.sunrise, spot.approx_lng)} · 🌇{" "}
            {formatSunTime(sunTimes.sunset, spot.approx_lng)}
          </span>
        )}
      </div>

      {flags.live_checkin_crowd_count && (
        <div className="mt-4">
          <CheckinButton
            spotId={spot.id}
            initialActiveCount={checkinInfo.activeCount}
            initialIsCheckedIn={checkinInfo.isCheckedIn}
          />
        </div>
      )}

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

      {flags.species_field_guide && (
        <section className="mt-6 rounded-xl border border-foam/15 bg-navy/50 p-6">
          <h2 className="font-serif text-lg text-sand">관찰 가능 생물</h2>
          <div className="mt-3">
            <SpeciesTags species={species} />
          </div>
        </section>
      )}

      {/* 지도 — 대략 위치는 항상 공개, 정확한 핀/경로는 로그인 후 */}
      {flags.map_pin_route_polyline && (
        <section className="mt-6">
          <KakaoMap
            approxCenter={{ lat: spot.approx_lat, lng: spot.approx_lng }}
            exactPin={
              unlocked && lockedInfo?.exact_lat != null && lockedInfo?.exact_lng != null
                ? { lat: lockedInfo.exact_lat, lng: lockedInfo.exact_lng }
                : null
            }
            routeSteps={unlocked ? routeStepPoints : []}
            parkingPins={unlocked ? parkingMapPins : []}
          />
        </section>
      )}

      {/* 안전 정보 — 게이트 예외, 항상 무료 공개 */}
      {safety && (
        <section className="mt-6 rounded-xl border border-coral/30 bg-coral/5 p-6">
          <h2 className="font-serif text-lg text-coral">안전 정보</h2>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-coral/70">
            항상 무료 공개 · 로그인 게이트 예외
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
          {flags.nearest_emergency_facilities && (
            <EmergencyFacilities facilities={emergencyFacilities} />
          )}
        </section>
      )}

      {flags.sos_button && (
        <section className="mt-4">
          <SosButton spotName={spot.name} />
        </section>
      )}

      {/* 정확한 위치와 접근 방법 — 로그인 게이트 */}
      <section className="mt-6 space-y-4">
        <DetailUnlockGate isLoggedIn={isLoggedIn} hasContent={hasUnlockedContent} spotSlug={spot.slug}>
          {() => (
          <>
          <div className="rounded-xl border border-foam/25 bg-teal/20 p-5">
            <h3 className="font-serif text-lg text-foam">상세 접근 정보</h3>
            {lockedInfo && (
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-sand/50">정확한 좌표</dt>
                  <dd className="font-mono text-sand">
                    {lockedInfo.exact_lat?.toFixed(5)}, {lockedInfo.exact_lng?.toFixed(5)}
                  </dd>
                </div>
                {lockedInfo.access_route && (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-sand/50">접근 경로</dt>
                    <dd className="text-sand/80">{lockedInfo.access_route}</dd>
                  </div>
                )}
                {lockedInfo.parking_tip && (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-sand/50">주차 팁</dt>
                    <dd className="text-sand/80">{lockedInfo.parking_tip}</dd>
                  </div>
                )}
                <div className="flex flex-wrap gap-4 pt-1 text-xs text-sand/60">
                  {flags.estimated_walk_time && lockedInfo.estimated_walk_minutes != null && (
                    <span>🚶 도보 약 {lockedInfo.estimated_walk_minutes}분</span>
                  )}
                  {flags.restroom_shower_markers && (
                    <>
                      <span>🚻 화장실 {lockedInfo.has_restroom ? "있음" : "없음"}</span>
                      <span>🚿 샤워실 {lockedInfo.has_shower ? "있음" : "없음"}</span>
                    </>
                  )}
                </div>
              </dl>
            )}
          </div>

          {flags.kakao_roadview && lockedInfo?.exact_lat != null && lockedInfo?.exact_lng != null && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-sand/50">진입로 로드뷰</p>
              <KakaoRoadview lat={lockedInfo.exact_lat} lng={lockedInfo.exact_lng} />
            </div>
          )}

          {flags.access_step_cards && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-sand/50">단계별 접근 안내</p>
              <AccessSteps steps={accessSteps} />
            </div>
          )}

          {flags.parking_options_detail && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-sand/50">주차 옵션</p>
              <ParkingOptions options={parkingOptions} />
            </div>
          )}

          {flags.gpx_route_download && routeStepPoints.length > 0 && (
            <a
              href={`/api/spots/${spot.slug}/gpx`}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-foam/25 px-4 py-2 text-sm text-sand/80 transition hover:border-foam hover:text-foam"
            >
              ⬇ GPX 경로 파일 다운로드
            </a>
          )}

          {flags.access_route_change_history && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-sand/50">접근로 변경 이력</p>
              <AccessHistory revisions={accessHistory} />
            </div>
          )}
          </>
          )}
        </DetailUnlockGate>
      </section>

      {/* 제휴 배너 (장비대여/투어) */}
      {bannerPartners.length > 0 && (
        <section className="mt-6 space-y-3">
          {bannerPartners.map((p) => (
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

      {/* 경로 기반 로컬 제휴처 추천 (17번) — 가는 길목 맛집/카페 */}
      {flags.route_based_partner_recs && routePartners.length > 0 && (
        <section className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-wider text-sand/50">가는 길에 들러보세요</p>
          <div className="space-y-2">
            {routePartners.map((p) => (
              <a
                key={p.id}
                href={p.cta_url ?? "#"}
                className="flex items-center justify-between rounded-lg border border-foam/10 bg-navy/40 px-4 py-2.5 text-sm transition hover:border-foam/30"
              >
                <span className="flex items-center gap-2">
                  <span className="rounded-full border border-foam/20 px-2 py-0.5 text-[10px] text-foam/70">
                    {p.listing_type === "route_food" ? "맛집" : "카페"}
                  </span>
                  <span className="text-sand">{p.partner_name}</span>
                </span>
                <span className="text-xs text-foam/60">{p.cta_label}</span>
              </a>
            ))}
          </div>
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
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-sand/30">
                  {r.crowd_tag && (
                    <span className="rounded-full border border-foam/20 px-2 py-0.5 text-foam/60">
                      {CROWD_TAG_LABEL[r.crowd_tag]}
                    </span>
                  )}
                  {r.visited_at && (
                    <span>방문일 {new Date(r.visited_at).toLocaleDateString("ko-KR")}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

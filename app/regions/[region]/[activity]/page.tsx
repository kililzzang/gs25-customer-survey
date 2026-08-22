import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSpotsByRegion } from "@/lib/data";
import { getFeatureFlags } from "@/lib/feature-flags";
import { SpotCard } from "@/components/spot-card";
import { ALL_REGIONS, getRegionMeta } from "@/lib/regions";
import { ACTIVITIES, getActivityMeta } from "@/lib/activities";
import type { ActivityType, RegionCode } from "@/lib/types/database";

/**
 * /regions/[region]/[activity] — 액티비티별 SEO 랜딩 페이지.
 *
 * 원래 요청은 /spots/[region]/[activity] 형태였지만, 이미 /spots/[slug]가
 * 스팟 상세 페이지 경로를 쓰고 있어 [slug]와 [region] 세그먼트가 같은 깊이에서
 * 충돌합니다 (Next.js는 형제 동적 세그먼트에 서로 다른 이름을 허용하지 않음).
 * 그래서 /regions/[region] 아래에 하위 경로로 배치했습니다 — 기존 스팟 상세
 * URL은 전혀 변경되지 않습니다.
 */

const ACTIVITY_SLUGS = ACTIVITIES.map((a) => a.key);
const ACTIVITY_FLAG_KEYS = [
  "activity_sea_swimming",
  "activity_surfing",
  "activity_freediving",
  "activity_scuba",
] as const;

function isActivitySlug(value: string): value is ActivityType {
  return (ACTIVITY_SLUGS as string[]).includes(value);
}

export function generateStaticParams() {
  return ALL_REGIONS.flatMap((r) => ACTIVITY_SLUGS.map((activity) => ({ region: r.code, activity })));
}

async function resolveParams(params: Promise<{ region: string; activity: string }>) {
  const { region, activity } = await params;
  if (!ALL_REGIONS.some((r) => r.code === region) || !isActivitySlug(activity)) {
    return null;
  }
  return { regionCode: region as RegionCode, activityKey: activity };
}

async function isActivityEnabled(activityKey: ActivityType) {
  if (activityKey === "snorkeling") return true;
  const flags = await getFeatureFlags(ACTIVITY_FLAG_KEYS);
  return flags[`activity_${activityKey}` as (typeof ACTIVITY_FLAG_KEYS)[number]] ?? false;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string; activity: string }>;
}): Promise<Metadata> {
  const resolved = await resolveParams(params);
  if (!resolved) return {};

  const { regionCode, activityKey } = resolved;
  const regionMeta = getRegionMeta(regionCode);
  const activityMeta = getActivityMeta(activityKey);
  const enabled = await isActivityEnabled(activityKey);

  return {
    title: `${regionMeta.name} ${activityMeta.label} 스팟 | 물빛`,
    description: `${regionMeta.name} 지역의 ${activityMeta.label} 스팟 정보와 접근 방법, 안전정보를 확인하세요.`,
    // 아직 순차 오픈 전인 액티비티 랜딩은 콘텐츠가 비어 있어 색인에서 제외합니다.
    robots: enabled ? undefined : { index: false, follow: true },
  };
}

export default async function RegionActivityPage({
  params,
}: {
  params: Promise<{ region: string; activity: string }>;
}) {
  const resolved = await resolveParams(params);
  if (!resolved) notFound();
  const { regionCode, activityKey } = resolved;

  const regionMeta = getRegionMeta(regionCode);
  const activityMeta = getActivityMeta(activityKey);

  const [allRegionSpots, enabled] = await Promise.all([
    getSpotsByRegion(regionCode),
    isActivityEnabled(activityKey),
  ]);

  const spots = allRegionSpots.filter((s) =>
    (s.activities && s.activities.length > 0 ? s.activities : ["snorkeling"]).includes(activityKey)
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <nav className="mb-6 text-xs text-sand/40">
        <Link href={`/regions/${regionCode}`} className="hover:text-foam">
          {regionMeta.name}
        </Link>
        <span className="mx-1.5">/</span>
        <span>{activityMeta.label}</span>
      </nav>

      <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-foam/60">
        <span aria-hidden>{activityMeta.icon}</span> {activityMeta.label}
      </p>
      <h1 className="mt-1 font-serif text-3xl text-sand">
        {regionMeta.name} {activityMeta.label} 스팟
      </h1>
      <p className="mt-2 text-sm text-sand/50">
        {enabled ? `총 ${spots.length}곳의 스팟이 등록되어 있습니다.` : `${activityMeta.label}은 곧 만나보실 수 있어요.`}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {ACTIVITIES.map((a) => (
          <Link
            key={a.key}
            href={`/regions/${regionCode}/${a.key}`}
            className="rounded-full border px-3 py-1 text-xs font-medium transition"
            style={
              a.key === activityKey
                ? { borderColor: a.color, color: "#0a2e36", background: a.color }
                : { borderColor: `${a.color}55`, color: a.color }
            }
          >
            {a.icon} {a.shortLabel}
          </Link>
        ))}
      </div>

      <div className="mt-10">
        {!enabled ? (
          <div className="rounded-xl border border-foam/10 bg-navy/40 p-8 text-center">
            <p className="text-lg text-sand/70">🚧 준비 중인 액티비티입니다</p>
            <p className="mt-2 text-sm text-sand/40">
              {activityMeta.label}은 콘텐츠 우선순위에 따라 순차적으로 오픈될 예정이에요. 그동안{" "}
              {regionMeta.name}의 다른 액티비티 스팟을 둘러보세요.
            </p>
            <Link
              href={`/regions/${regionCode}`}
              className="mt-4 inline-block rounded-full border border-foam/30 px-4 py-2 text-sm text-foam transition hover:border-foam"
            >
              {regionMeta.name} 전체 스팟 보기
            </Link>
          </div>
        ) : spots.length === 0 ? (
          <p className="rounded-xl border border-foam/10 bg-navy/40 p-8 text-center text-sand/50">
            아직 등록된 {activityMeta.label} 스팟이 없습니다. 첫 스팟을 제보해보세요.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {spots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

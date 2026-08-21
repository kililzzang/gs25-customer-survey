import { notFound } from "next/navigation";
import { getAllSpots, getSpotsByRegion } from "@/lib/data";
import { RegionTileMap } from "@/components/region-tilemap";
import { SpotCard } from "@/components/spot-card";
import { ALL_REGIONS, getRegionMeta } from "@/lib/regions";
import type { RegionCode } from "@/lib/types/database";

export function generateStaticParams() {
  return ALL_REGIONS.map((r) => ({ region: r.code }));
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region } = await params;
  const isValid = ALL_REGIONS.some((r) => r.code === region);
  if (!isValid) notFound();

  const regionCode = region as RegionCode;
  const meta = getRegionMeta(regionCode);
  const [spots, allSpots] = await Promise.all([getSpotsByRegion(regionCode), getAllSpots()]);

  const spotCounts = allSpots.reduce<Partial<Record<RegionCode, number>>>((acc, s) => {
    acc[s.region] = (acc[s.region] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-foam/60">Region</p>
      <h1 className="mt-1 font-serif text-3xl text-sand">{meta.name} 스노클링 스팟</h1>
      <p className="mt-2 text-sm text-sand/50">총 {spots.length}곳의 스팟이 등록되어 있습니다.</p>

      <div className="mt-8">
        <RegionTileMap activeRegion={regionCode} spotCounts={spotCounts} />
      </div>

      <div className="mt-10">
        {spots.length === 0 ? (
          <p className="rounded-xl border border-foam/10 bg-navy/40 p-8 text-center text-sand/50">
            아직 등록된 스팟이 없습니다. 첫 스팟을 제보해보세요.
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

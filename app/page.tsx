import Link from "next/link";
import { getAllSpots } from "@/lib/data";
import { RegionTileMap } from "@/components/region-tilemap";
import { SpotCard } from "@/components/spot-card";
import type { RegionCode } from "@/lib/types/database";

export default async function HomePage() {
  const spots = await getAllSpots();
  const popular = [...spots].sort((a, b) => b.like_count - a.like_count).slice(0, 3);
  const hidden = spots.filter((s) => s.is_hidden).slice(0, 3);

  const spotCounts = spots.reduce<Partial<Record<RegionCode, number>>>((acc, s) => {
    acc[s.region] = (acc[s.region] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <section className="relative overflow-hidden border-b border-foam/10">
        <div className="depth-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-20 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-foam/60">
            Snorkeling Spot Guide
          </span>
          <h1 className="max-w-2xl font-serif text-4xl leading-tight text-sand sm:text-5xl">
            수심계 눈금처럼 정직한
            <br />
            스노클링 스팟 가이드, <span className="text-foam">물빛</span>
          </h1>
          <p className="max-w-xl text-sand/60">
            지역별 지도에서 스팟을 탐색하고, 수심·시야·조류·수온 데이터와 커뮤니티 검증을 통해
            믿을 수 있는 포인트를 찾아보세요.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/regions/jeju"
              className="rounded-full bg-teal-light px-6 py-2.5 text-sm font-medium text-navy-deep transition hover:bg-foam"
            >
              지역별 스팟 둘러보기
            </Link>
            <Link
              href="/submit"
              className="rounded-full border border-foam/30 px-6 py-2.5 text-sm text-sand/80 transition hover:border-foam hover:text-foam"
            >
              스팟 제보하기
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-6 font-serif text-2xl text-sand">지역 선택</h2>
        <RegionTileMap spotCounts={spotCounts} />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-sand">인기 스팟</h2>
          <Link href="/leaderboard" className="text-sm text-foam/80 hover:text-foam">
            리더보드 보기 →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((spot) => (
            <SpotCard key={spot.id} spot={spot} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-6 flex items-center gap-3">
          <h2 className="font-serif text-2xl text-sand">히든 스팟 하이라이트</h2>
          <span className="rounded-full border border-coral/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-coral">
            Members&apos; pick
          </span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hidden.map((spot) => (
            <SpotCard key={spot.id} spot={spot} />
          ))}
        </div>
      </section>
    </div>
  );
}

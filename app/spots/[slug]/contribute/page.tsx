import Link from "next/link";
import { notFound } from "next/navigation";
import { getSpotBySlug } from "@/lib/data";
import { ContributeSpotForm } from "@/components/contribute-spot-form";

export default async function ContributeSpotPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { spot } = await getSpotBySlug(slug);
  if (!spot) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <nav className="mb-6 text-xs text-sand/40">
        <Link href={`/spots/${spot.slug}`} className="hover:text-foam">
          {spot.name}
        </Link>
        <span className="mx-1.5">/</span>
        <span>상세정보 기여</span>
      </nav>

      <p className="font-mono text-xs uppercase tracking-widest text-foam/60">Contribute</p>
      <h1 className="mt-1 font-serif text-3xl text-sand">{spot.name} 상세정보 기여</h1>
      <p className="mt-2 text-sm text-sand/50">
        정확한 좌표·접근 경로·주차 팁은 다른 이용자에게 광고 시청 후 공개됩니다. 최초로 접근
        경로를 기재하면 핵심 트랙 3점이 적립돼요.
      </p>

      <div className="mt-8">
        <ContributeSpotForm spotId={spot.id} spotSlug={spot.slug} />
      </div>
    </div>
  );
}

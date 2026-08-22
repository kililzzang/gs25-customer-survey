import type { Metadata } from "next";
import { getFeatureFlags } from "@/lib/feature-flags";
import { OnboardingFlow } from "@/components/onboarding-flow";
import type { ActivityType } from "@/lib/types/database";

const ACTIVITY_FLAG_KEYS = [
  "activity_sea_swimming",
  "activity_surfing",
  "activity_freediving",
  "activity_scuba",
] as const;

export const metadata: Metadata = {
  title: "온보딩 | 물빛",
  description: "나에게 맞는 해양 액티비티와 지역을 찾아보세요.",
};

export default async function OnboardingPage() {
  const flags = await getFeatureFlags(ACTIVITY_FLAG_KEYS);
  const enabledMap: Record<ActivityType, boolean> = {
    snorkeling: true,
    sea_swimming: flags.activity_sea_swimming,
    surfing: flags.activity_surfing,
    freediving: flags.activity_freediving,
    scuba: flags.activity_scuba,
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-foam/60">Onboarding</p>
      <h1 className="mt-1 font-serif text-3xl text-sand">당신에게 맞는 액티비티를 찾아보세요</h1>
      <p className="mt-2 text-sm text-sand/50">
        액티비티와 지역을 고르면 바로 스팟을 보여드려요. 아직 준비중인 액티비티도 미리 둘러볼 수 있어요.
      </p>
      <div className="mt-10">
        <OnboardingFlow enabledMap={enabledMap} />
      </div>
    </div>
  );
}

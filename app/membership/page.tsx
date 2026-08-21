const FREE_FEATURES = [
  "지역별 스팟 탐색 및 상세 페이지 열람",
  "안전 정보(응급연락처/조류경고) 항상 무료",
  "잠금 정보(정확한 좌표/접근로/주차팁) — 광고 시청 후 24시간 열람",
  "스팟 제보 및 리더보드 참여",
];

const PREMIUM_FEATURES = [
  "모든 광고 제거",
  "잠금 정보 즉시 열람 (광고 시청 불필요)",
  "히든 스팟 알림 우선 수신",
  "제보 반영 우선 검토",
];

export default function MembershipPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-foam/60">Membership</p>
      <h1 className="mt-1 font-serif text-3xl text-sand">멤버십</h1>
      <p className="mt-2 text-sm text-sand/50">
        광고 없이 바로 잠금 정보를 열람하고 싶다면 프리미엄으로 업그레이드하세요.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <PlanCard
          name="Free"
          price="₩0"
          period="/ 월"
          features={FREE_FEATURES}
          highlight={false}
        />
        <PlanCard
          name="Premium"
          price="₩4,900"
          period="/ 월"
          features={PREMIUM_FEATURES}
          highlight
        />
      </div>

      <p className="mt-8 text-center text-xs text-sand/30">
        * 결제 연동은 추후 진행됩니다. 현재는 플랜 구조 및 UI 목업입니다.
      </p>
    </div>
  );
}

function PlanCard({
  name,
  price,
  period,
  features,
  highlight,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlight: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        highlight
          ? "border-foam bg-teal/20 shadow-[0_0_0_1px_rgba(143,227,216,0.3)]"
          : "border-foam/15 bg-navy/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-sand">{name}</h2>
        {highlight && (
          <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-semibold uppercase text-navy-deep">
            추천
          </span>
        )}
      </div>
      <p className="mt-3">
        <span className="font-mono text-3xl text-foam">{price}</span>
        <span className="ml-1 text-sm text-sand/40">{period}</span>
      </p>
      <ul className="mt-6 space-y-2.5 text-sm text-sand/70">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-foam">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        className={`mt-6 w-full rounded-full py-2.5 text-sm font-medium transition ${
          highlight
            ? "bg-coral text-navy-deep hover:brightness-110"
            : "border border-foam/30 text-sand/80 hover:border-foam hover:text-foam"
        }`}
      >
        {highlight ? "프리미엄 시작하기" : "현재 플랜"}
      </button>
    </div>
  );
}

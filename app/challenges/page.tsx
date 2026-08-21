const MOCK_CHALLENGES = [
  {
    id: "jeju-summer",
    title: "제주 여름 스팟 5곳 방문",
    description: "제주 지역 스팟 5곳을 방문 스탬프로 기록하면 '제주 로컬' 뱃지를 드려요.",
    reward: "🏝️ 제주 로컬 뱃지",
    period: "2026.07.01 – 2026.08.31",
  },
  {
    id: "hidden-hunter-fall",
    title: "가을 히든 스팟 헌터",
    description: "히든 스팟을 2곳 이상 신규 발굴하면 핵심 트랙 보너스 점수를 드려요.",
    reward: "🕵️ 보너스 +10pt",
    period: "2026.09.01 – 2026.10.31",
  },
];

export default function ChallengesPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-foam/60">Challenges</p>
      <h1 className="mt-1 font-serif text-3xl text-sand">챌린지 이벤트</h1>
      <p className="mt-2 text-sm text-sand/50">기간 한정 챌린지에 참여하고 뱃지와 보너스 점수를 받아보세요.</p>

      <div className="mt-8 space-y-4">
        {MOCK_CHALLENGES.map((c) => (
          <div key={c.id} className="rounded-xl border border-foam/15 bg-navy/50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-lg text-sand">{c.title}</h2>
              <span className="font-mono text-xs text-foam/60">{c.period}</span>
            </div>
            <p className="mt-2 text-sm text-sand/70">{c.description}</p>
            <p className="mt-3 text-sm text-coral">{c.reward}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { SubmitSpotForm } from "@/components/submit-spot-form";

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-foam/60">Submit</p>
      <h1 className="mt-1 font-serif text-3xl text-sand">신규 스팟 제보</h1>
      <p className="mt-2 text-sm text-sand/50">
        사진의 EXIF GPS와 신고 좌표를 자동으로 대조합니다. 오차가 크면 자동 반려되며, 동일 좌표
        반경 내 다중 제보가 모이면 자동으로 검증됩니다.
      </p>

      <div className="mt-8">
        <SubmitSpotForm />
      </div>
    </div>
  );
}

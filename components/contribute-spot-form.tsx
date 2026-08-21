"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExifPhotoPicker, type ExifGpsResult } from "@/components/exif-photo-picker";

export function ContributeSpotForm({ spotId, spotSlug }: { spotId: string; spotSlug: string }) {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [accessRoute, setAccessRoute] = useState("");
  const [parkingTip, setParkingTip] = useState("");
  const [exifResult, setExifResult] = useState<ExifGpsResult>({
    lat: null,
    lng: null,
    deltaM: null,
    status: "idle",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const parsedLat = lat ? Number(lat) : null;
  const parsedLng = lng ? Number(lng) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      exact_lat: parsedLat,
      exact_lng: parsedLng,
      access_route: accessRoute,
      parking_tip: parkingTip,
      exif_gps_status: exifResult.status,
    };

    const supabase = createClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("reports").insert({
          spot_id: spotId,
          reporter_id: user.id,
          type: accessRoute ? "detail_route" : "detail_parking",
          payload,
          status: "pending",
        } as never);
      }
    }

    await new Promise((r) => setTimeout(r, 400));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-foam/30 bg-teal/15 p-8 text-center">
        <p className="font-serif text-xl text-foam">상세정보 제보 완료 🧭</p>
        <p className="mt-2 text-sm text-sand/60">
          최초로 접근 경로를 기재하면 핵심 트랙 3점이 적립됩니다. 검토 후 반영됩니다.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-sand/50">정확한 위도</span>
          <input
            required
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="input font-mono"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-sand/50">정확한 경도</span>
          <input
            required
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="input font-mono"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-sand/50">접근 경로</span>
        <textarea
          value={accessRoute}
          onChange={(e) => setAccessRoute(e.target.value)}
          className="input min-h-20"
          placeholder="예: 해안도로에서 도보 8분, 방파제 끝 계단으로 진입"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-sand/50">주차 팁</span>
        <textarea
          value={parkingTip}
          onChange={(e) => setParkingTip(e.target.value)}
          className="input min-h-20"
          placeholder="예: 인근 공영주차장, 성수기 07시 이전 도착 권장"
        />
      </label>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-sand/50">현장 인증 사진</p>
        <ExifPhotoPicker reportedLat={parsedLat} reportedLng={parsedLng} onResult={(_, r) => setExifResult(r)} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-coral py-3 text-sm font-medium text-navy-deep transition hover:brightness-110 disabled:opacity-50"
      >
        {submitting ? "제출 중…" : `${spotSlug} 상세정보 기여하기`}
      </button>
    </form>
  );
}

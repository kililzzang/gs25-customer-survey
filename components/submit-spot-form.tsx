"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExifPhotoPicker, type ExifGpsResult } from "@/components/exif-photo-picker";
import { REGIONS, OVERSEAS_REGION } from "@/lib/regions";
import type { RegionCode } from "@/lib/types/database";

const CURRENT_OPTIONS = [
  { value: "calm", label: "약함" },
  { value: "moderate", label: "보통" },
  { value: "strong", label: "강함" },
  { value: "unknown", label: "정보없음" },
];

export function SubmitSpotForm() {
  const [name, setName] = useState("");
  const [region, setRegion] = useState<RegionCode>(REGIONS[0].code);
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [depthMin, setDepthMin] = useState("");
  const [depthMax, setDepthMax] = useState("");
  const [visibility, setVisibility] = useState("");
  const [currentLevel, setCurrentLevel] = useState("unknown");
  const [waterTemp, setWaterTemp] = useState("");
  const [isHidden, setIsHidden] = useState(false);
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
      name,
      region,
      description,
      approx_lat: parsedLat,
      approx_lng: parsedLng,
      depth_min_m: depthMin ? Number(depthMin) : null,
      depth_max_m: depthMax ? Number(depthMax) : null,
      visibility_m: visibility ? Number(visibility) : null,
      current_level: currentLevel,
      water_temp_c: waterTemp ? Number(waterTemp) : null,
      is_hidden: isHidden,
      exif_gps_status: exifResult.status,
    };

    const supabase = createClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("reports").insert({
          reporter_id: user.id,
          type: "new_spot",
          payload,
          status: "pending",
        } as never);
      }
    }

    // 목업 단계 (Supabase 미연결 또는 비로그인): 제출 흐름만 시연
    await new Promise((r) => setTimeout(r, 400));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-foam/30 bg-teal/15 p-8 text-center">
        <p className="font-serif text-xl text-foam">제보가 접수되었습니다 🌊</p>
        <p className="mt-2 text-sm text-sand/60">
          동일 좌표 반경 내 다중 제보가 누적되면 자동으로 검증됩니다. 승인 시 알림으로 안내드려요.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="스팟 이름">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="예: 문섬 스노클링 포인트"
        />
      </Field>

      <Field label="지역">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as RegionCode)}
          className="input"
        >
          {[...REGIONS, OVERSEAS_REGION].map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="설명">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input min-h-24"
          placeholder="스팟에 대한 간단한 소개"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="위도 (대략)">
          <input
            required
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="input font-mono"
            placeholder="33.223"
          />
        </Field>
        <Field label="경도 (대략)">
          <input
            required
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="input font-mono"
            placeholder="126.560"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="최소 수심(m)">
          <input type="number" value={depthMin} onChange={(e) => setDepthMin(e.target.value)} className="input font-mono" />
        </Field>
        <Field label="최대 수심(m)">
          <input type="number" value={depthMax} onChange={(e) => setDepthMax(e.target.value)} className="input font-mono" />
        </Field>
        <Field label="시야(m)">
          <input type="number" value={visibility} onChange={(e) => setVisibility(e.target.value)} className="input font-mono" />
        </Field>
        <Field label="수온(℃)">
          <input type="number" value={waterTemp} onChange={(e) => setWaterTemp(e.target.value)} className="input font-mono" />
        </Field>
      </div>

      <Field label="조류">
        <select value={currentLevel} onChange={(e) => setCurrentLevel(e.target.value)} className="input">
          {CURRENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <label className="flex items-center gap-2 text-sm text-sand/70">
        <input type="checkbox" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} />
        히든 스팟으로 제보 (잘 알려지지 않은 포인트)
      </label>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-sand/50">인증 사진</p>
        <ExifPhotoPicker reportedLat={parsedLat} reportedLng={parsedLng} onResult={(_, r) => setExifResult(r)} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-coral py-3 text-sm font-medium text-navy-deep transition hover:brightness-110 disabled:opacity-50"
      >
        {submitting ? "제출 중…" : "스팟 제보하기"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-sand/50">{label}</span>
      {children}
    </label>
  );
}

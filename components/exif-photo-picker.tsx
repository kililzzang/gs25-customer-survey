"use client";

import { useState } from "react";
import exifr from "exifr";

export interface ExifGpsResult {
  lat: number | null;
  lng: number | null;
  deltaM: number | null;
  status: "idle" | "checking" | "no_gps" | "verified" | "mismatch";
}

interface ExifPhotoPickerProps {
  /** 유저가 입력/선택한 신고 좌표 (오차 계산 기준) */
  reportedLat: number | null;
  reportedLng: number | null;
  thresholdM?: number;
  onResult: (file: File | null, result: ExifGpsResult) => void;
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * 사진 업로드 + EXIF GPS 자동 파싱/검증.
 * 서버(supabase/migrations/0003_rls_and_functions.sql 의 verify_photo_gps)에서
 * 동일한 로직으로 재검증하며, 여기서는 제보자에게 즉시 피드백을 주기 위한 클라이언트 사전 체크입니다.
 */
export function ExifPhotoPicker({
  reportedLat,
  reportedLng,
  thresholdM = 150,
  onResult,
}: ExifPhotoPickerProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ExifGpsResult>({
    lat: null,
    lng: null,
    deltaM: null,
    status: "idle",
  });

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setFileName(null);
      setResult({ lat: null, lng: null, deltaM: null, status: "idle" });
      onResult(null, { lat: null, lng: null, deltaM: null, status: "idle" });
      return;
    }

    setFileName(file.name);
    setResult((r) => ({ ...r, status: "checking" }));

    try {
      const gps = await exifr.gps(file);
      if (!gps || gps.latitude == null || gps.longitude == null) {
        const next: ExifGpsResult = { lat: null, lng: null, deltaM: null, status: "no_gps" };
        setResult(next);
        onResult(file, next);
        return;
      }

      let deltaM: number | null = null;
      let status: ExifGpsResult["status"] = "verified";
      if (reportedLat != null && reportedLng != null) {
        deltaM = haversineM(reportedLat, reportedLng, gps.latitude, gps.longitude);
        status = deltaM <= thresholdM ? "verified" : "mismatch";
      }

      const next: ExifGpsResult = { lat: gps.latitude, lng: gps.longitude, deltaM, status };
      setResult(next);
      onResult(file, next);
    } catch {
      const next: ExifGpsResult = { lat: null, lng: null, deltaM: null, status: "no_gps" };
      setResult(next);
      onResult(file, next);
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-foam/25 bg-navy-deep/40 p-5">
      <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
        <span className="text-sm text-sand/70">사진을 선택하면 EXIF GPS를 자동으로 확인합니다</span>
        <span className="rounded-full border border-foam/30 px-4 py-1.5 text-xs text-foam/80 hover:border-foam">
          파일 선택
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
      </label>

      {fileName && (
        <div className="mt-4 space-y-1 border-t border-foam/10 pt-4 text-sm">
          <p className="text-sand/60">{fileName}</p>
          {result.status === "checking" && <p className="text-foam/60">EXIF 확인 중…</p>}
          {result.status === "no_gps" && (
            <p className="text-coral">
              사진에 GPS 정보가 없습니다. 좌표를 직접 입력하면 저신뢰 제보로 추가 검증 큐에 등록됩니다.
            </p>
          )}
          {result.status === "verified" && (
            <p className="font-mono text-foam">
              GPS 확인됨 {result.lat?.toFixed(5)}, {result.lng?.toFixed(5)}
              {result.deltaM != null && ` · 오차 ${result.deltaM.toFixed(0)}m`}
            </p>
          )}
          {result.status === "mismatch" && (
            <p className="font-mono text-coral">
              신고 좌표와 오차 {result.deltaM?.toFixed(0)}m (임계치 {thresholdM}m 초과) — 자동 반려될 수 있습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

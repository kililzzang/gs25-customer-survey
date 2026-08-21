import { NextResponse } from "next/server";
import exifr from "exifr";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyWatermark } from "@/lib/watermark";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs"; // sharp는 Node.js 런타임 필요 (Edge 불가)

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB

/**
 * 스팟 사진 업로드.
 * 1. 원본을 비공개 버킷(spot-photos-originals)에 저장 (검증/분쟁 대응용, service-role만 접근)
 * 2. 서버에서 sharp로 우측 하단 워터마크("물빛 · 스팟명") 합성 후 공개 버킷(spot-photos)에 저장
 * 3. EXIF GPS는 클라이언트 신고값을 신뢰하지 않고 서버가 원본 파일에서 직접 재추출
 * 4. spot_photos row 생성 + verify_photo_gps RPC로 스팟 좌표 대비 오차 검증
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase가 연결되어 있지 않습니다." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 후 이용할 수 있습니다." }, { status: 401 });
  }

  const allowed = await checkRateLimit(`user:${user.id}`, {
    path: "upload_photo",
    limitPerMinute: 10,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const spotSlug = formData.get("spot_slug");

  if (!(file instanceof File) || typeof spotSlug !== "string" || !spotSlug) {
    return NextResponse.json({ error: "file, spot_slug가 필요합니다." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "파일 크기는 15MB를 넘을 수 없습니다." }, { status: 400 });
  }

  const { data: spot } = await supabase
    .from("spots")
    .select("id, name")
    .eq("slug", spotSlug)
    .single();
  if (!spot) {
    return NextResponse.json({ error: "존재하지 않는 스팟입니다." }, { status: 404 });
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer());

  // 클라이언트가 보낸 EXIF 값은 신뢰하지 않고, 서버가 원본 파일에서 직접 재추출합니다.
  const gps = await exifr.gps(originalBuffer).catch(() => null);
  const exifLat = gps?.latitude ?? null;
  const exifLng = gps?.longitude ?? null;

  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const baseName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const originalPath = `${spot.id}/${baseName}-original.${ext}`;
  const publicPath = `${spot.id}/${baseName}.jpg`;

  // 1) 원본 → 비공개 버킷 (service-role 필요)
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "서버 설정 오류로 업로드할 수 없습니다 (SUPABASE_SERVICE_ROLE_KEY 미설정)." },
      { status: 503 }
    );
  }
  const { error: originalUploadError } = await admin.storage
    .from("spot-photos-originals")
    .upload(originalPath, originalBuffer, { contentType: file.type });
  if (originalUploadError) {
    console.error("original upload error", originalUploadError);
    return NextResponse.json({ error: "원본 업로드에 실패했습니다." }, { status: 500 });
  }

  // 2) 워터마크 합성 → 공개 버킷 (사용자 세션으로, 기존 storage 정책 그대로 사용)
  let watermarked: Buffer;
  try {
    watermarked = await applyWatermark(originalBuffer, spot.name);
  } catch (err) {
    console.error("watermark error", err);
    return NextResponse.json({ error: "이미지 처리에 실패했습니다." }, { status: 500 });
  }

  const { error: publicUploadError } = await supabase.storage
    .from("spot-photos")
    .upload(publicPath, watermarked, { contentType: "image/jpeg" });
  if (publicUploadError) {
    console.error("public upload error", publicUploadError);
    return NextResponse.json({ error: "사진 업로드에 실패했습니다." }, { status: 500 });
  }

  // 3) spot_photos row 생성
  const { data: photo, error: insertError } = await supabase
    .from("spot_photos")
    .insert({
      spot_id: spot.id,
      uploader_id: user.id,
      storage_path: publicPath,
      original_storage_path: originalPath,
      exif_lat: exifLat,
      exif_lng: exifLng,
    } as never)
    .select("id")
    .single();

  if (insertError || !photo) {
    console.error("spot_photos insert error", insertError);
    return NextResponse.json({ error: "사진 정보를 저장하지 못했습니다." }, { status: 500 });
  }

  // 4) 스팟 좌표 대비 EXIF 오차 검증 (supabase/migrations/0003_rls_and_functions.sql)
  await supabase.rpc("verify_photo_gps", { p_photo_id: photo.id, p_threshold_m: 150 } as never);

  return NextResponse.json({
    id: photo.id,
    storage_path: publicPath,
    gps_checked: exifLat != null && exifLng != null,
  });
}

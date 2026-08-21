import { NextResponse } from "next/server";
import { getSpotBySlug, getSpotAccessSteps } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * GPX 경로 다운로드 (feature flag: gpx_route_download).
 * spot_access_steps 좌표만으로 생성하는 자체 데이터 기반 기능 — 외부 API 불필요.
 * "정확한 위치와 접근 방법"에 해당하므로 로그인 게이트를 동일하게 적용합니다.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const { spot } = await getSpotBySlug(slug);
  if (!spot) {
    return NextResponse.json({ error: "존재하지 않는 스팟입니다." }, { status: 404 });
  }

  const allowed = await checkRateLimit(`user:${user.id}`, {
    path: "gpx_download",
    spotId: spot.id,
    limitPerMinute: 15,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "다운로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  const steps = await getSpotAccessSteps(spot.id, slug);
  const points = steps.filter((s) => s.lat != null && s.lng != null);

  if (points.length === 0) {
    return NextResponse.json(
      { error: "이 스팟은 아직 좌표가 있는 접근 스텝이 없습니다." },
      { status: 404 }
    );
  }

  const gpx = buildGpx(spot.name, points);

  return new NextResponse(gpx, {
    headers: {
      "Content-Type": "application/gpx+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.gpx"`,
    },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildGpx(
  spotName: string,
  points: { title: string; lat: number | null; lng: number | null }[]
): string {
  const trkpts = points
    .map((p) => `      <trkpt lat="${p.lat}" lon="${p.lng}"><name>${escapeXml(p.title)}</name></trkpt>`)
    .join("\n");
  const wpts = points
    .map(
      (p, i) =>
        `  <wpt lat="${p.lat}" lon="${p.lng}"><name>${escapeXml(`${i + 1}. ${p.title}`)}</name></wpt>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="물빛 (mulbit)" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(spotName)} 접근 경로</name>
  </metadata>
${wpts}
  <trk>
    <name>${escapeXml(spotName)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`;
}

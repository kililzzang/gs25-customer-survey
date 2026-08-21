import sharp from "sharp";

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * 우측 하단에 "물빛 · {스팟명}" 텍스트 워터마크를 합성합니다.
 * 실제 로고 이미지 파일이 없어 우선 텍스트 워터마크로 처리합니다
 * (나중에 로고 이미지가 생기면 <image> composite로 교체 가능).
 */
export async function applyWatermark(input: Buffer, spotName: string): Promise<Buffer> {
  const image = sharp(input).rotate(); // EXIF Orientation 기준 자동 회전 후 워터마크 합성
  const metadata = await image.metadata();
  const width = metadata.width ?? 1200;
  const height = metadata.height ?? 800;

  const text = `물빛 · ${spotName}`;
  const fontSize = Math.max(14, Math.round(width * 0.022));
  const paddingX = Math.round(fontSize * 0.9);
  const paddingY = Math.round(fontSize * 0.55);
  // 폰트를 임베드하지 않아 정확한 텍스트 폭 측정은 불가 — 글자당 평균 폭으로 근사.
  const approxTextWidth = text.length * fontSize * 0.58;
  const boxWidth = Math.min(width - 16, approxTextWidth + paddingX * 2);
  const boxHeight = fontSize + paddingY * 2;
  const margin = 12;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${width - boxWidth - margin}" y="${height - boxHeight - margin}"
        width="${boxWidth}" height="${boxHeight}" rx="${boxHeight / 2}" fill="rgba(6,30,36,0.55)" />
      <text x="${width - margin - boxWidth / 2}" y="${height - margin - boxHeight / 2 + fontSize * 0.32}"
        font-family="sans-serif" font-size="${fontSize}" fill="#F3ECDC" text-anchor="middle">${escapeXml(text)}</text>
    </svg>
  `;

  return image
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 85 })
    .toBuffer();
}

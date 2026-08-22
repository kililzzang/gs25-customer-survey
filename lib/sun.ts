/**
 * 일출/일몰 시간 순수 계산 (외부 API 불필요, feature flag: sunrise_sunset_times).
 *
 * 미국 해군천문대(NOAA) 계열의 고전 "Sunrise/Sunset Algorithm" (Almanac for Computers, 1990)을
 * 구현한 것으로, 오차는 보통 1~2분 이내입니다. 위경도와 날짜만으로 계산하며 외부 API가 없습니다.
 * 참고: https://edwilliams.org/sunrise_sunset_algorithm.htm
 */

const ZENITH = 90.833; // 대기 굴절 보정을 포함한 공식 일출/일몰 천정각

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

/** UTC 자정 기준 연중 일수 (1~366) */
function dayOfYearUTC(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const current = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((current - start) / 86400000) + 1;
}

function calcUtcHour(lat: number, lng: number, date: Date, isSunrise: boolean): number | null {
  const n = dayOfYearUTC(date);
  const lngHour = lng / 15;
  const t = isSunrise ? n + (6 - lngHour) / 24 : n + (18 - lngHour) / 24;

  const M = 0.9856 * t - 3.289;
  let L = M + 1.916 * Math.sin(toRad(M)) + 0.02 * Math.sin(toRad(2 * M)) + 282.634;
  L = ((L % 360) + 360) % 360;

  let RA = toDeg(Math.atan(0.91764 * Math.tan(toRad(L))));
  RA = ((RA % 360) + 360) % 360;
  const Lquadrant = Math.floor(L / 90) * 90;
  const RAquadrant = Math.floor(RA / 90) * 90;
  RA = (RA + (Lquadrant - RAquadrant)) / 15;

  const sinDec = 0.39782 * Math.sin(toRad(L));
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH =
    (Math.cos(toRad(ZENITH)) - sinDec * Math.sin(toRad(lat))) / (cosDec * Math.cos(toRad(lat)));

  if (cosH > 1) return null; // 극야 (해가 뜨지 않음)
  if (cosH < -1) return null; // 백야 (해가 지지 않음)

  let H = isSunrise ? 360 - toDeg(Math.acos(cosH)) : toDeg(Math.acos(cosH));
  H = H / 15;

  const T = H + RA - 0.06571 * t - 6.622;
  return ((T - lngHour) % 24 + 24) % 24; // UTC 기준 소수 시각(0~24)
}

export interface SunTimes {
  sunrise: Date | null;
  sunset: Date | null;
}

/** 주어진 날짜(UTC 기준 해당 날짜)의 일출/일몰 Date(UTC)를 반환. 극야/백야면 null. */
export function getSunTimes(lat: number, lng: number, date: Date = new Date()): SunTimes {
  const sunriseHour = calcUtcHour(lat, lng, date, true);
  const sunsetHour = calcUtcHour(lat, lng, date, false);

  const toDate = (utcHour: number | null) => {
    if (utcHour === null) return null;
    const base = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return new Date(base + utcHour * 3600000);
  };

  return { sunrise: toDate(sunriseHour), sunset: toDate(sunsetHour) };
}

/** 경도 기준 근사 표준시간대(15도당 1시간)로 포맷 — 정확한 IANA 타임존 DB 없이 로컬 시각 근사치 표시용. */
export function formatSunTime(date: Date | null, lng: number): string {
  if (!date) return "—";
  const offsetHours = Math.round(lng / 15);
  const local = new Date(date.getTime() + offsetHours * 3600000);
  const hh = local.getUTCHours().toString().padStart(2, "0");
  const mm = local.getUTCMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

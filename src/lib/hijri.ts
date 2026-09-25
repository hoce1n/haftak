import {
  HIJRI_TABLE_START_JDN,
  HIJRI_TABLE_START_YEAR,
  HIJRI_YEAR_MASKS,
} from "./iranian-occasions-data";

export type HijriDate = { hy: number; hm: number; hd: number };

const { MONTH_STARTS, TABLE_END_JDN } = (() => {
  const starts = new Int32Array(HIJRI_YEAR_MASKS.length * 12);
  let jd = 0;
  for (let i = 0; i < starts.length; i++) {
    starts[i] = jd;
    const mask = HIJRI_YEAR_MASKS[Math.floor(i / 12)] ?? 0;
    jd += (mask >> (11 - (i % 12))) & 1 ? 30 : 29;
  }
  return { MONTH_STARTS: starts, TABLE_END_JDN: jd + HIJRI_TABLE_START_JDN };
})();

const TABLE_YEAR_COUNT = HIJRI_YEAR_MASKS.length;

export function gregorianToJdn(gy: number, gm: number, gd: number) {
  const a = Math.floor((14 - gm) / 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  return (
    gd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

export function jdnToGregorian(jdn: number) {
  let l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const gd = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const gm = j + 2 - 12 * l;
  const gy = 100 * (n - 49) + i + l;
  return { gy, gm, gd };
}

export function hijriToJdn(hy: number, hm: number, hd: number) {
  const yearIndex = hy - HIJRI_TABLE_START_YEAR;
  if (yearIndex >= 0 && yearIndex < TABLE_YEAR_COUNT) {
    return (MONTH_STARTS[yearIndex * 12 + hm - 1] ?? 0) + hd + HIJRI_TABLE_START_JDN - 1;
  }
  return fallbackHijriToJdn(hy, hm, hd);
}

export function jdnToHijri(jdn: number): HijriDate {
  if (jdn >= HIJRI_TABLE_START_JDN && jdn < TABLE_END_JDN) {
    const days = jdn - HIJRI_TABLE_START_JDN;
    let index = Math.floor(days / 30);
    while (index + 1 < MONTH_STARTS.length && (MONTH_STARTS[index + 1] ?? 0) <= days) {
      index += 1;
    }
    return {
      hy: Math.floor(index / 12) + HIJRI_TABLE_START_YEAR,
      hm: (index % 12) + 1,
      hd: days - (MONTH_STARTS[index] ?? 0) + 1,
    };
  }
  return fallbackJdnToHijri(jdn);
}

export function hijriMonthLength(hy: number, hm: number) {
  const start = hijriToJdn(hy, hm, 1);
  const next = hm === 12 ? hijriToJdn(hy + 1, 1, 1) : hijriToJdn(hy, hm + 1, 1);
  return next - start;
}

const NMONTHS = 1405 * 12 + 1;

function fallbackHijriToJdn(year: number, month: number, day: number) {
  let y = year;
  if (y < 0) y += 1;
  const k = month + y * 12 - NMONTHS;
  return Math.floor(visibility(k + 1048) + day + 0.5);
}

function fallbackJdnToHijri(jdn: number): HijriDate {
  const { gy, gm, gd } = jdnToGregorian(jdn);
  let k = Math.floor(0.6 + (gy + (gm % 2 === 0 ? gm : gm - 1) / 12 + gd / 365 - 1900) * 12.3685);
  let mjd = visibility(k);
  while (mjd > jdn - 0.5) {
    k -= 1;
    mjd = visibility(k);
  }
  const hmTotal = k - 1048;
  let hy = 1405 + Math.floor(hmTotal / 12);
  let hm = (hmTotal % 12) + 1;
  if (hmTotal !== 0 && hm <= 0) {
    hm += 12;
    hy -= 1;
  }
  if (hy <= 0) hy -= 1;
  const hd = Math.floor(jdn - mjd + 0.5);
  return { hy, hm, hd };
}

function degSin(deg: number) {
  return Math.sin((deg * Math.PI) / 180);
}

function tmoonphase(n: number, nph: number) {
  const k = n + nph / 4;
  const T = k / 1236.85;
  const t2 = T * T;
  const t3 = t2 * T;
  const jd =
    2415020.75933 +
    29.53058868 * k -
    0.0001178 * t2 -
    0.000000155 * t3 +
    0.00033 * degSin(166.56 + 132.87 * T - 0.009173 * t2);

  const sa = ((359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3) * Math.PI) / 180;
  const ma = ((306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3) * Math.PI) / 180;
  const tf = (2 * (21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3) * Math.PI) / 180;

  let xtra = 0;
  if (nph === 0 || nph === 2) {
    xtra =
      (0.1734 - 0.000393 * T) * Math.sin(sa) +
      0.0021 * Math.sin(sa * 2) -
      0.4068 * Math.sin(ma) +
      0.0161 * Math.sin(2 * ma) -
      0.0004 * Math.sin(3 * ma) +
      0.0104 * Math.sin(tf) -
      0.0051 * Math.sin(sa + ma) -
      0.0074 * Math.sin(sa - ma) +
      0.0004 * Math.sin(tf + sa) -
      0.0004 * Math.sin(tf - sa) -
      0.0006 * Math.sin(tf + ma) +
      0.001 * Math.sin(tf - ma) +
      0.0005 * Math.sin(sa + 2 * ma);
  } else if (nph === 1 || nph === 3) {
    xtra =
      (0.1721 - 0.0004 * T) * Math.sin(sa) +
      0.0021 * Math.sin(sa * 2) -
      0.628 * Math.sin(ma) +
      0.0089 * Math.sin(2 * ma) -
      0.0004 * Math.sin(3 * ma) +
      0.0079 * Math.sin(tf) -
      0.0119 * Math.sin(sa + ma) -
      0.0047 * Math.sin(sa - ma) +
      0.0003 * Math.sin(tf + sa) -
      0.0004 * Math.sin(tf - sa) -
      0.0006 * Math.sin(tf + ma) +
      0.0021 * Math.sin(tf - ma) +
      0.0003 * Math.sin(sa + 2 * ma) +
      0.0004 * Math.sin(sa - 2 * ma) -
      0.0003 * Math.sin(2 * sa + ma) +
      (nph === 1
        ? 0.0028 - 0.0004 * Math.cos(sa) + 0.0003 * Math.cos(ma)
        : -0.0028 + 0.0004 * Math.cos(sa) - 0.0003 * Math.cos(ma));
  }
  return jd + xtra - (0.41 + 1.2053 * T + 0.4992 * t2) / 1440;
}

function visibility(n: number) {
  const TIMZ = 3;
  const MINAGE = 13.5;
  const SUNSET = 19.5;
  const TIMDIF = SUNSET - MINAGE;
  const jd = tmoonphase(n, 0);
  const d = Math.floor(jd);
  let tf = jd - d;
  if (tf <= 0.5) return jd + 1;
  tf = (tf - 0.5) * 24 + TIMZ;
  return tf > TIMDIF ? jd + 1 : jd;
}

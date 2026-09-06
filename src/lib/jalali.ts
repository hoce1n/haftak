/**
 * Jalali (Persian) calendar helpers.
 * Conversion algorithm is the widely used Borkowski-derived integer method.
 */

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

/** Persian week order: Saturday first. */
export const DAY_NAMES = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
] as const;

export type JalaliDate = { jy: number; jm: number; jd: number };

const GREGORIAN_MONTH_DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isGregorianLeap(gy: number) {
  return (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
}

export function toJalali(gy: number, gm: number, gd: number): JalaliDate {
  let jy = gy <= 1600 ? 0 : 979;
  let year = gy - (gy <= 1600 ? 621 : 1600);
  const year2 = gm > 2 ? year + 1 : year;
  let days =
    365 * year +
    Math.floor((year2 + 3) / 4) -
    Math.floor((year2 + 99) / 100) +
    Math.floor((year2 + 399) / 400) -
    80 +
    gd;
  for (let i = 0; i < gm; i++) days += GREGORIAN_MONTH_DAYS[i] ?? 0;

  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;

  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

export function toGregorian(jy: number, jm: number, jd: number): Date {
  let gy = jy <= 979 ? 621 : 1600;
  const y = jy - (jy <= 979 ? 0 : 979);
  let days =
    365 * y +
    Math.floor(y / 33) * 8 +
    Math.floor(((y % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  gy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;

  let gd = days + 1;
  const monthDays = [...GREGORIAN_MONTH_DAYS];
  monthDays[2] = isGregorianLeap(gy) ? 29 : 28;
  let gm = 0;
  for (gm = 1; gm <= 12; gm++) {
    const len = monthDays[gm] ?? 30;
    if (gd <= len) break;
    gd -= len;
  }
  return new Date(gy, gm - 1, gd, 12, 0, 0, 0);
}

export function jalaliMonthLength(jy: number, jm: number) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeap(jy) ? 30 : 29;
}

export function isJalaliLeap(jy: number) {
  // Leap years fall on these remainders of the 33-year cycle.
  return [1, 5, 9, 13, 17, 22, 26, 30].includes(jy % 33);
}

export function dateToJalali(date: Date): JalaliDate {
  return toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** 0 = Saturday … 6 = Friday */
export function persianDayIndex(date: Date) {
  return (date.getDay() + 1) % 7;
}

/** The Saturday that starts the week containing `date`, normalised to midday. */
export function startOfPersianWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  d.setDate(d.getDate() - persianDayIndex(d));
  return d;
}

export function addDays(date: Date, amount: number) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + amount);
  return d;
}

export function dateKey(date: Date) {
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function keyToDate(key: string) {
  const [y = 1970, m = 1, d = 1] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function isSameDay(a: Date, b: Date) {
  return dateKey(a) === dateKey(b);
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

export function formatJalali(date: Date, opts: { withYear?: boolean } = {}) {
  const { jy, jm, jd } = dateToJalali(date);
  const base = `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]}`;
  return opts.withYear ? `${base} ${toPersianDigits(jy)}` : base;
}

export function formatWeekRange(weekStart: Date) {
  const end = addDays(weekStart, 6);
  const start = dateToJalali(weekStart);
  const finish = dateToJalali(end);
  if (start.jm === finish.jm) {
    return `${toPersianDigits(start.jd)} تا ${toPersianDigits(finish.jd)} ${JALALI_MONTHS[finish.jm - 1]} ${toPersianDigits(finish.jy)}`;
  }
  return `${formatJalali(weekStart)} تا ${formatJalali(end, { withYear: true })}`;
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${toPersianDigits(h)} ساعت و ${toPersianDigits(m)} دقیقه`;
  if (h) return `${toPersianDigits(h)} ساعت`;
  return `${toPersianDigits(m)} دقیقه`;
}

export function formatHours(minutes: number) {
  const hours = minutes / 60;
  const rounded = Math.round(hours * 10) / 10;
  return toPersianDigits(Number.isInteger(rounded) ? rounded : rounded.toFixed(1));
}

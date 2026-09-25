import { dateToJalali, jalaliMonthLength, persianDayIndex, toGregorian } from "./jalali";
import { gregorianToJdn, hijriMonthLength, hijriToJdn, jdnToHijri, type HijriDate } from "./hijri";
import {
  IRREGULAR_OCCASIONS,
  SIMPLE_OCCASIONS,
  type IrregularOccasionRecord,
  type OccasionCalendar,
  type SimpleOccasionRecord,
} from "./iranian-occasions-data";

export type IranianOccasion = {
  month: number;
  day: number;
  title: string;
  isHoliday: boolean;
  calendar: OccasionCalendar;
};

type YearWindow = { fromYear?: number; toYear?: number };

function inJalaliYearWindow(jy: number, record: YearWindow) {
  if (record.fromYear !== undefined && jy < record.fromYear) return false;
  if (record.toYear !== undefined && jy > record.toYear) return false;
  return true;
}

function dateToHijri(date: Date): HijriDate {
  return jdnToHijri(gregorianToJdn(date.getFullYear(), date.getMonth() + 1, date.getDate()));
}

function hijriWeekday(hy: number, hm: number, hd: number) {
  const jdn = hijriToJdn(hy, hm, hd);
  return (jdn + 2) % 7;
}

function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  nth: number,
  kind: OccasionCalendar,
) {
  if (kind === "persian") {
    const first = toGregorian(year, month, 1);
    const firstWeekday = persianDayIndex(first);
    const day = 1 + ((weekday - firstWeekday + 7) % 7) + (nth - 1) * 7;
    if (day < 1 || day > jalaliMonthLength(year, month)) return null;
    return day;
  }
  if (kind === "hijri") {
    const firstWeekday = hijriWeekday(year, month, 1);
    const day = 1 + ((weekday - firstWeekday + 7) % 7) + (nth - 1) * 7;
    if (day < 1 || day > hijriMonthLength(year, month)) return null;
    return day;
  }
  const first = new Date(year, month - 1, 1, 12, 0, 0, 0);
  const firstWeekday = (first.getDay() + 1) % 7;
  const day = 1 + ((weekday - firstWeekday + 7) % 7) + (nth - 1) * 7;
  const length = new Date(year, month, 0).getDate();
  if (day < 1 || day > length) return null;
  return day;
}

function lastWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  offset: number,
  kind: OccasionCalendar,
) {
  const length =
    kind === "persian"
      ? jalaliMonthLength(year, month)
      : kind === "hijri"
        ? hijriMonthLength(year, month)
        : new Date(year, month, 0).getDate();
  const lastWeekday =
    kind === "persian"
      ? persianDayIndex(toGregorian(year, month, length))
      : kind === "hijri"
        ? hijriWeekday(year, month, length)
        : (new Date(year, month - 1, length, 12, 0, 0, 0).getDay() + 1) % 7;
  const day = length - ((lastWeekday - weekday + 7) % 7) + offset;
  if (day < 1 || day > length) return null;
  return day;
}

function irregularDay(record: IrregularOccasionRecord, year: number) {
  switch (record.rule) {
    case "single":
      return record.year === year ? record.day : null;
    case "end-of-month":
      return record.calendar === "hijri"
        ? hijriMonthLength(year, record.month)
        : record.calendar === "persian"
          ? jalaliMonthLength(year, record.month)
          : new Date(year, record.month, 0).getDate();
    case "nth-weekday":
      return nthWeekdayOfMonth(year, record.month, record.weekday, record.nth, record.calendar);
    case "last-weekday":
      return lastWeekdayOfMonth(
        year,
        record.month,
        record.weekday,
        record.offset ?? 0,
        record.calendar,
      );
  }
}

function toOccasion(
  record: SimpleOccasionRecord | IrregularOccasionRecord,
  month: number,
  day: number,
): IranianOccasion {
  return {
    month,
    day,
    title: record.title,
    isHoliday: record.isHoliday,
    calendar: record.calendar,
  };
}

function matchesSimple(
  record: SimpleOccasionRecord,
  calendar: OccasionCalendar,
  month: number,
  day: number,
  jy: number,
) {
  return (
    record.calendar === calendar &&
    record.month === month &&
    record.day === day &&
    inJalaliYearWindow(jy, record)
  );
}

function matchesIrregular(
  record: IrregularOccasionRecord,
  calendar: OccasionCalendar,
  year: number,
  month: number,
  day: number,
  jy: number,
) {
  if (record.calendar !== calendar || !inJalaliYearWindow(jy, record)) return false;
  if ("month" in record && record.month !== month) return false;
  return irregularDay(record, year) === day;
}

export function getIranianOccasions(jy: number, jm: number, jd: number): IranianOccasion[] {
  const date = toGregorian(jy, jm, jd);
  const hijri = dateToHijri(date);
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const found: IranianOccasion[] = [];

  for (const record of SIMPLE_OCCASIONS) {
    if (matchesSimple(record, "persian", jm, jd, jy)) {
      found.push(toOccasion(record, jm, jd));
    } else if (matchesSimple(record, "hijri", hijri.hm, hijri.hd, jy)) {
      found.push(toOccasion(record, jm, jd));
    } else if (matchesSimple(record, "gregorian", gm, gd, jy)) {
      found.push(toOccasion(record, jm, jd));
    }
  }

  for (const record of IRREGULAR_OCCASIONS) {
    if (matchesIrregular(record, "persian", jy, jm, jd, jy)) {
      found.push(toOccasion(record, jm, jd));
    } else if (matchesIrregular(record, "hijri", hijri.hy, hijri.hm, hijri.hd, jy)) {
      found.push(toOccasion(record, jm, jd));
    } else if (matchesIrregular(record, "gregorian", gy, gm, gd, jy)) {
      found.push(toOccasion(record, jm, jd));
    }
  }

  return found;
}

export function getIranianOccasionsForDate(date: Date) {
  const { jy, jm, jd } = dateToJalali(date);
  return getIranianOccasions(jy, jm, jd);
}

export function hasIranianHoliday(occasions: readonly IranianOccasion[]) {
  return occasions.some((occasion) => occasion.isHoliday);
}

export function formatOccasionTitles(occasions: readonly IranianOccasion[]) {
  return occasions.map((occasion) => occasion.title).join("، ");
}

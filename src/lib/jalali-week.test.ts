import { describe, expect, test } from "bun:test";

import {
  addDays,
  dateKey,
  dateToJalali,
  isDateInWeek,
  normalizeWeekStartDay,
  persianDayIndex,
  shiftWeek,
  startOfPersianWeek,
  startOfWeek,
  weekDayIndex,
  weekDayNames,
  weekDates,
  type WeekStartDay,
} from "./jalali";

function atNoon(y: number, m: number, d: number) {
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function keys(weekStart: Date) {
  return weekDates(weekStart).map(dateKey);
}

describe("configurable week start", () => {
  test("normalizes invalid week-start values to Saturday", () => {
    expect(normalizeWeekStartDay(undefined)).toBe(0);
    expect(normalizeWeekStartDay(-1)).toBe(0);
    expect(normalizeWeekStartDay(7)).toBe(0);
    expect(normalizeWeekStartDay(3)).toBe(3);
  });

  test("Monday week is Monday through Sunday", () => {
    const wednesday = atNoon(2026, 9, 9);
    const start = startOfWeek(wednesday, 2);
    expect(dateKey(start)).toBe("2026-09-07");
    expect(persianDayIndex(start)).toBe(2);
    expect(keys(start)).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
    ]);
    expect(weekDayNames(2)).toEqual([
      "دوشنبه",
      "سه‌شنبه",
      "چهارشنبه",
      "پنجشنبه",
      "جمعه",
      "شنبه",
      "یکشنبه",
    ]);
  });

  test("Wednesday week is Wednesday through Tuesday", () => {
    const friday = atNoon(2026, 9, 11);
    const start = startOfWeek(friday, 4);
    expect(dateKey(start)).toBe("2026-09-09");
    expect(persianDayIndex(start)).toBe(4);
    expect(keys(start)).toEqual([
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
      "2026-09-14",
      "2026-09-15",
    ]);
  });

  test("Saturday remains the default Persian week start", () => {
    const thursday = atNoon(2026, 9, 10);
    const start = startOfPersianWeek(thursday);
    expect(dateKey(start)).toBe("2026-09-05");
    expect(persianDayIndex(start)).toBe(0);
    expect(startOfWeek(thursday, 0).getTime()).toBe(start.getTime());
  });

  test("previous and next week move exactly 7 days", () => {
    const start = startOfWeek(atNoon(2026, 9, 10), 2);
    const next = shiftWeek(start, 1);
    const prev = shiftWeek(start, -1);
    expect(dateKey(next)).toBe("2026-09-14");
    expect(dateKey(prev)).toBe("2026-08-31");
    expect(persianDayIndex(next)).toBe(persianDayIndex(start));
    expect(persianDayIndex(prev)).toBe(persianDayIndex(start));
    expect(weekDayIndex(next, 2)).toBe(0);
    expect(weekDayIndex(prev, 2)).toBe(0);
  });

  test("changing week-start recalculates the displayed week around the same day", () => {
    const day = atNoon(2026, 9, 10);
    const saturdayWeek = startOfWeek(day, 0);
    const mondayWeek = startOfWeek(day, 2);
    const wednesdayWeek = startOfWeek(day, 4);
    expect(isDateInWeek(day, saturdayWeek)).toBe(true);
    expect(isDateInWeek(day, mondayWeek)).toBe(true);
    expect(isDateInWeek(day, wednesdayWeek)).toBe(true);
    expect(dateKey(saturdayWeek)).toBe("2026-09-05");
    expect(dateKey(mondayWeek)).toBe("2026-09-07");
    expect(dateKey(wednesdayWeek)).toBe("2026-09-09");
  });
});

describe("calendar boundaries", () => {
  test("crosses Gregorian month boundary", () => {
    const start = startOfWeek(atNoon(2026, 9, 1), 2);
    expect(dateKey(start)).toBe("2026-08-31");
    expect(keys(start)).toEqual([
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
    ]);
  });

  test("crosses Gregorian year boundary forwards and backwards", () => {
    const lateDecember = atNoon(2026, 12, 30);
    const monday = startOfWeek(lateDecember, 2);
    expect(dateKey(monday)).toBe("2026-12-28");
    expect(keys(monday)).toEqual([
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
    ]);

    const next = shiftWeek(monday, 1);
    expect(dateKey(next)).toBe("2027-01-04");
    const prev = shiftWeek(monday, -1);
    expect(dateKey(prev)).toBe("2026-12-21");
    expect(keys(prev)[0]).toBe("2026-12-21");
  });

  test("crosses Jalali year boundary (Esfand to Farvardin)", () => {
    const farvardin1 = atNoon(2026, 3, 21);
    expect(dateToJalali(farvardin1)).toEqual({ jy: 1405, jm: 1, jd: 1 });

    const week = startOfWeek(farvardin1, 2);
    const days = weekDates(week).map((d) => dateToJalali(d));
    expect(days[0]?.jy).toBe(1404);
    expect(days[0]?.jm).toBe(12);
    expect(days[days.length - 1]?.jy).toBe(1405);
    expect(days[days.length - 1]?.jm).toBe(1);
    expect(keys(week)).toContain("2026-03-21");
    expect(isDateInWeek(farvardin1, week)).toBe(true);

    const previous = shiftWeek(week, -1);
    expect(dateToJalali(previous).jy).toBe(1404);
    expect(dateToJalali(addDays(previous, 6)).jy).toBe(1404);
    const following = shiftWeek(week, 1);
    expect(dateToJalali(following).jy).toBe(1405);
    expect(dateToJalali(following).jm).toBe(1);
    expect(persianDayIndex(week)).toBe(2);
    expect(persianDayIndex(previous)).toBe(2);
    expect(persianDayIndex(following)).toBe(2);
  });

  test("each weekday can be the start of a 7-day week", () => {
    const day = atNoon(2026, 9, 10);
    for (const startDay of [0, 1, 2, 3, 4, 5, 6] as WeekStartDay[]) {
      const start = startOfWeek(day, startDay);
      expect(persianDayIndex(start)).toBe(startDay);
      expect(weekDayIndex(day, startDay)).toBeGreaterThanOrEqual(0);
      expect(weekDayIndex(day, startDay)).toBeLessThan(7);
      expect(isDateInWeek(day, start)).toBe(true);
      expect(isDateInWeek(addDays(start, 6), start)).toBe(true);
      expect(isDateInWeek(addDays(start, 7), start)).toBe(false);
      expect(isDateInWeek(addDays(start, -1), start)).toBe(false);
    }
  });
});

import { describe, expect, test } from "bun:test";

import { dateToJalali, toGregorian } from "./jalali";
import { gregorianToJdn, hijriToJdn, jdnToHijri } from "./hijri";
import {
  formatOccasionTitles,
  getIranianOccasions,
  getIranianOccasionsForDate,
  hasIranianHoliday,
} from "./iranian-occasions";

function titles(jy: number, jm: number, jd: number) {
  return getIranianOccasions(jy, jm, jd).map((occasion) => occasion.title);
}

describe("Iranian Islamic date conversion", () => {
  test("matches official University of Tehran month starts for 1405", () => {
    const pairs = [
      [1405, 1, 1, 1447, 10, 1],
      [1405, 1, 30, 1447, 11, 1],
      [1405, 2, 28, 1447, 12, 1],
      [1405, 3, 26, 1448, 1, 1],
    ] as const;

    for (const [jy, jm, jd, hy, hm, hd] of pairs) {
      const g = toGregorian(jy, jm, jd);
      const jdn = gregorianToJdn(g.getFullYear(), g.getMonth() + 1, g.getDate());
      expect(jdnToHijri(jdn)).toEqual({ hy, hm, hd });
      expect(hijriToJdn(hy, hm, hd)).toBe(jdn);
    }
  });

  test("round-trips a known Gregorian/Hijri pair", () => {
    const jdn = gregorianToJdn(2016, 10, 3);
    expect(jdnToHijri(jdn)).toEqual({ hy: 1438, hm: 1, hd: 1 });
    expect(hijriToJdn(1438, 1, 1)).toBe(jdn);
  });
});

describe("official Iranian occasions", () => {
  test("returns a known fixed occasion", () => {
    const occasions = getIranianOccasions(1404, 11, 22);
    expect(occasions.some((o) => o.title.includes("پیروزی انقلاب اسلامی ایران"))).toBe(true);
    expect(hasIranianHoliday(occasions)).toBe(true);
  });

  test("returns a known holiday", () => {
    const nowruz = getIranianOccasions(1405, 1, 1);
    expect(nowruz).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "آغاز نوروز", isHoliday: true, month: 1, day: 1 }),
      ]),
    );
    expect(hasIranianHoliday(nowruz)).toBe(true);
  });

  test("returns every occasion on a date with several events", () => {
    const occasions = getIranianOccasions(1404, 1, 2);
    expect(titles(1404, 1, 2)).toEqual([
      "عید نوروز",
      "هجوم مأموران ستم‌شاهی پهلوی به مدرسهٔ فیضیهٔ قم (۱۳۴۲ ه‍.ش)",
      "آغاز عملیات فتح‌المبین (۱۳۶۱ ه‍.ش)",
      "شهادت حضرت امام علی (ع) (۴۰ ه‍.ق)",
      "روز جهانی آب",
    ]);
    expect(occasions.map((o) => o.calendar)).toEqual([
      "persian",
      "persian",
      "persian",
      "hijri",
      "gregorian",
    ]);
    expect(hasIranianHoliday(occasions)).toBe(true);
    expect(formatOccasionTitles(occasions)).toContain("عید نوروز");
  });

  test("returns nothing on a date with no occasion", () => {
    expect(getIranianOccasions(1404, 1, 5)).toEqual([]);
    expect(getIranianOccasions(1405, 11, 5)).toEqual([]);
  });

  test("places a lunar occasion on the correct Jalali date for each year", () => {
    const ashura1404 = getIranianOccasions(1404, 4, 15);
    expect(ashura1404.some((o) => o.title === "عاشورای حسینی" && o.isHoliday)).toBe(true);

    const ashura1405 = getIranianOccasions(1405, 4, 4);
    expect(ashura1405.some((o) => o.title === "عاشورای حسینی" && o.isHoliday)).toBe(true);

    expect(titles(1404, 4, 4)).not.toContain("عاشورای حسینی");
    expect(titles(1405, 4, 15)).not.toContain("عاشورای حسینی");
  });

  test("keeps fixed occasions on the same Jalali day across years", () => {
    for (const year of [1403, 1404, 1405, 1406]) {
      const occasions = getIranianOccasions(year, 11, 22);
      expect(occasions.some((o) => o.title.includes("پیروزی انقلاب اسلامی ایران"))).toBe(true);
      expect(hasIranianHoliday(occasions)).toBe(true);
    }
  });

  test("respects year windows for replaced official occasions", () => {
    expect(titles(1401, 4, 23)).toContain("روز گفت‌وگو و تعامل سازنده با دنیا");
    expect(titles(1403, 4, 23)).not.toContain("روز گفت‌وگو و تعامل سازنده با دنیا");
    expect(titles(1403, 4, 10)).toContain("روز دیپلماسی فرهنگی و تعامل با جهان");
    expect(titles(1402, 4, 10)).not.toContain("روز دیپلماسی فرهنگی و تعامل با جهان");
  });

  test("treats the end of Safar as the Imam Reza holiday", () => {
    const g = toGregorian(1405, 5, 22);
    const hijri = jdnToHijri(gregorianToJdn(g.getFullYear(), g.getMonth() + 1, g.getDate()));
    expect(hijri).toEqual({ hy: 1448, hm: 2, hd: 29 });
    const occasions = getIranianOccasions(1405, 5, 22);
    expect(occasions.some((o) => o.isHoliday && o.title.includes("شهادت حضرت امام رضا"))).toBe(
      true,
    );
    expect(titles(1404, 6, 2).some((title) => title.includes("شهادت حضرت امام رضا"))).toBe(true);
  });

  test("places irregular weekday occasions on the matching day of that year", () => {
    expect(titles(1404, 7, 11).some((title) => title.includes("قالیشویان"))).toBe(true);
    expect(titles(1405, 7, 10).some((title) => title.includes("قالیشویان"))).toBe(true);
    expect(titles(1404, 7, 10).some((title) => title.includes("قالیشویان"))).toBe(false);
  });

  test("accepts a Date through the planner-facing helper", () => {
    const date = toGregorian(1404, 11, 22);
    const jalali = dateToJalali(date);
    expect(jalali).toEqual({ jy: 1404, jm: 11, jd: 22 });
    expect(
      getIranianOccasionsForDate(date).some((o) => o.title.includes("پیروزی انقلاب اسلامی ایران")),
    ).toBe(true);
  });
});

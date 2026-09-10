import { toPersianDigits } from "./jalali";

export const CATEGORIES = ["study", "review", "test", "memorize"] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  study: "مطالعه",
  review: "مرور",
  test: "تست",
  memorize: "حفظیات",
};

export type Slot = {
  id: string;
  title: string;
  /** "HH:MM" 24h */
  start: string;
  end: string;
};

export type Activity = {
  id: string;
  dayIndex: number; // 0 = Saturday
  slotId: string;
  subject: string;
  topic: string;
  details: string;
  duration: number; // minutes, independent of slot length
  category: Category;
  done: boolean;
};

export type Tile = {
  id: string;
  subject: string;
  topic: string;
  /** Optional شرح shown in the library and copied into activity details on drop. */
  description: string;
  duration: number;
  category: Category;
};

export type WeekPlan = {
  label: string;
  activities: Activity[];
};

export type PlannerSettings = {
  studentName: string;
  slots: Slot[];
  tiles: Tile[];
  quotes: string[];
  theme: "light" | "dark";
};

export type PlannerData = {
  version: 3;
  settings: PlannerSettings;
  weeks: Record<string, WeekPlan>;
};

export const DEFAULT_QUOTES = [
  "موفقیت مجموعه‌ای از تلاش‌های کوچک است که هر روز تکرار می‌شوند.",
  "آینده متعلق به کسانی است که به زیبایی رویاهایشان باور دارند.",
  "نظم روزانه، جای انگیزه‌ی لحظه‌ای را می‌گیرد.",
  "هر روز یک فرصت تازه برای ساختن آینده‌ی توست.",
  "کمی هر روز، بهتر از زیاد در یک روز است.",
];

const SLOT_TIMES: Array<[string, string]> = [
  ["06:30", "08:00"],
  ["08:00", "09:30"],
  ["09:45", "11:15"],
  ["11:30", "13:00"],
  ["14:00", "15:30"],
  ["15:45", "17:15"],
  ["17:30", "19:00"],
  ["19:15", "20:45"],
];

export function defaultSlots(): Slot[] {
  return SLOT_TIMES.map(([start, end], i) => ({
    id: `slot-${i + 1}`,
    title: `پارت ${toPersianDigits(i + 1)}`,
    start,
    end,
  }));
}

export function defaultTiles(): Tile[] {
  return [
    {
      id: "tile-1",
      subject: "زیست‌شناسی",
      topic: "مطالعه مفهومی",
      description: "",
      duration: 90,
      category: "study",
    },
    {
      id: "tile-2",
      subject: "ریاضیات",
      topic: "حل تست آموزشی",
      description: "",
      duration: 60,
      category: "test",
    },
    {
      id: "tile-3",
      subject: "شیمی",
      topic: "مرور خلاصه‌ها",
      description: "",
      duration: 45,
      category: "review",
    },
    {
      id: "tile-4",
      subject: "عربی",
      topic: "لغت و قواعد",
      description: "",
      duration: 30,
      category: "memorize",
    },
  ];
}

export function defaultData(): PlannerData {
  return {
    version: 3,
    settings: {
      studentName: "",
      slots: defaultSlots(),
      tiles: defaultTiles(),
      quotes: DEFAULT_QUOTES,
      theme: "light",
    },
    weeks: {},
  };
}

export function emptyWeek(): WeekPlan {
  return { label: "", activities: [] };
}

export function createId() {
  return Math.random().toString(36).slice(2, 10);
}

export function slotMinutes(slot: Slot) {
  const parse = (t: string) => {
    const [h = 0, m = 0] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return Math.max(0, parse(slot.end) - parse(slot.start));
}

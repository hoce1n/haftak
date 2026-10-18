import { toPersianDigits, type WeekStartDay } from "./jalali";

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
  dayIndex: number; // 0 = first day of the configured week
  slotId: string;
  subject: string;
  topic: string;
  details: string;
  duration: number; // minutes, independent of slot length
  category: Category;
  /** Tile-library category copied on drop so the week grid can keep the tile color. */
  tileCategoryId?: string;
  done: boolean;
};

export const TILE_CATEGORY_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
] as const;

export const TILE_CATEGORY_COLOR_LABELS: Record<(typeof TILE_CATEGORY_COLORS)[number], string> = {
  red: "قرمز",
  orange: "نارنجی",
  yellow: "زرد",
  green: "سبز",
  blue: "آبی",
  purple: "بنفش",
  pink: "صورتی",
};

/** Light-theme hex values used as the starting point of the custom colour input. */
export const TILE_CATEGORY_COLOR_HEX: Record<(typeof TILE_CATEGORY_COLORS)[number], string> = {
  red: "#e1514e",
  orange: "#e0843e",
  yellow: "#ad7b3d",
  green: "#358264",
  blue: "#5870a6",
  purple: "#9460b7",
  pink: "#d4609d",
};

export const MAX_SAVED_TILE_COLORS = 7;

/**
 * Named design tokens keep their light/dark theme behaviour, while custom
 * colours are stored as regular hex strings.
 */
export type TileCategoryColor = string;

export type TileCategory = {
  id: string;
  label: string;
  color: TileCategoryColor;
};

export type Tile = {
  id: string;
  subject: string;
  topic: string;
  /** Optional شرح shown in the library and copied into activity details on drop. */
  description: string;
  duration: number;
  categoryId: string;
};

const HEX_COLOR_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const NAMED_TILE_COLORS = new Set<string>(TILE_CATEGORY_COLORS);

function isNamedTileColor(value: string): value is (typeof TILE_CATEGORY_COLORS)[number] {
  return NAMED_TILE_COLORS.has(value.toLowerCase());
}

function expandHexColor(color: string): string {
  const lower = color.toLowerCase();
  if (lower.length !== 4) return lower;
  const r = lower.charAt(1);
  const g = lower.charAt(2);
  const b = lower.charAt(3);
  return `#${r}${r}${g}${g}${b}${b}`;
}

export function isTileCategoryColor(value: unknown): value is TileCategoryColor {
  if (typeof value !== "string") return false;
  const color = value.trim();
  return isNamedTileColor(color) || HEX_COLOR_RE.test(color);
}

export function normalizeTileCategoryColor(
  value: unknown,
  fallback: TileCategoryColor = "blue",
): TileCategoryColor {
  if (typeof value !== "string") return fallback;
  const color = value.trim();
  if (isNamedTileColor(color)) return color.toLowerCase();
  if (HEX_COLOR_RE.test(color)) return expandHexColor(color);
  return fallback;
}

/** A hex value accepted by <input type="color"> for both tokens and custom colours. */
export function tileColorHex(value: TileCategoryColor): string {
  const lower = value.toLowerCase();
  if (isNamedTileColor(lower)) return TILE_CATEGORY_COLOR_HEX[lower];
  return normalizeTileCategoryColor(value, TILE_CATEGORY_COLOR_HEX.blue);
}

export function normalizeSavedTileColors(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const colors: string[] = [];
  for (const item of raw) {
    const color = normalizeTileCategoryColor(item, "");
    if (!color || seen.has(color)) continue;
    seen.add(color);
    colors.push(color);
    if (colors.length >= MAX_SAVED_TILE_COLORS) break;
  }
  return colors;
}

export function addSavedTileColor(current: readonly string[], color: TileCategoryColor): string[] {
  const normalized = normalizeTileCategoryColor(color, "");
  if (!normalized) return normalizeSavedTileColors(current);
  const rest = normalizeSavedTileColors(current).filter((item) => item !== normalized);
  return [normalized, ...rest].slice(0, MAX_SAVED_TILE_COLORS);
}

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

export function activityCategoryFromTile(tile: Pick<Tile, "categoryId">): Category {
  return isCategory(tile.categoryId) ? tile.categoryId : "study";
}

export type WeekPlan = {
  label: string;
  activities: Activity[];
};

export type PlannerSettings = {
  studentName: string;
  slots: Slot[];
  tiles: Tile[];
  tileCategories: TileCategory[];
  /** Up to seven custom colours kept for quick reuse by the colour picker. */
  savedTileColors: string[];
  quotes: string[];
  theme: "light" | "dark";
  /** 0 = Saturday … 6 = Friday. Source of truth for week calculation. */
  weekStartsOn: WeekStartDay;
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

export function defaultTileCategories(): TileCategory[] {
  return [
    { id: "study", label: "مطالعه", color: "yellow" },
    { id: "review", label: "مرور", color: "orange" },
    { id: "test", label: "تست", color: "green" },
    { id: "memorize", label: "حفظیات", color: "blue" },
  ];
}

export function defaultTiles(): Tile[] {
  return [
    {
      id: "tile-1",
      subject: "زیست‌شناسی",
      topic: "مطالعه مفهومی",
      description: "",
      duration: 90,
      categoryId: "study",
    },
    {
      id: "tile-2",
      subject: "ریاضیات",
      topic: "حل تست آموزشی",
      description: "",
      duration: 60,
      categoryId: "test",
    },
    {
      id: "tile-3",
      subject: "شیمی",
      topic: "مرور خلاصه‌ها",
      description: "",
      duration: 45,
      categoryId: "review",
    },
    {
      id: "tile-4",
      subject: "عربی",
      topic: "لغت و قواعد",
      description: "",
      duration: 30,
      categoryId: "memorize",
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
      tileCategories: defaultTileCategories(),
      savedTileColors: [],
      quotes: DEFAULT_QUOTES,
      theme: "light",
      weekStartsOn: 0,
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

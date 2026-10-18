import {
  DEFAULT_QUOTES,
  defaultData,
  defaultSlots,
  defaultTileCategories,
  defaultTiles,
  isCategory,
  normalizeSavedTileColors,
  normalizeTileCategoryColor,
  type Activity,
  type Category,
  type PlannerData,
  type Slot,
  type Tile,
  type TileCategory,
} from "./planner-types";
import { dateKey, normalizeWeekStartDay, startOfWeek } from "./jalali";

export const STORAGE_KEY = "studyPlanner_v3";
const LEGACY_KEY = "konkurPlan_v2";

/** Legacy prototype colours mapped onto the four fixed categories. */
const LEGACY_COLOR_CATEGORY: Record<string, Category> = {
  "#ffd98f": "study",
  "#e7c1b9": "review",
  "#d7df16": "test",
  "#d9e8f5": "memorize",
  "#d9ead3": "study",
};

function num(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeSlots(raw: unknown): Slot[] {
  const base = defaultSlots();
  if (!Array.isArray(raw)) return base;
  return base.map((slot, i) => {
    const item = raw[i];
    if (typeof item === "string") return { ...slot, title: item || slot.title };
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      return {
        ...slot,
        title: str(o["title"], slot.title) || slot.title,
        start: str(o["start"], slot.start) || slot.start,
        end: str(o["end"], slot.end) || slot.end,
      };
    }
    return slot;
  });
}

function remapActivitySlot(slotId: string, slots: Slot[]) {
  if (slots.some((slot) => slot.id === slotId)) return slotId;
  return slots[slots.length - 1]?.id || slots[0]!.id;
}

function fallbackTileCategoryId(raw: Record<string, unknown>): string {
  if (typeof raw["categoryId"] === "string" && raw["categoryId"]) return raw["categoryId"];
  if (isCategory(raw["category"])) return raw["category"];
  return LEGACY_COLOR_CATEGORY[str(raw["color"]).toLowerCase()] ?? "study";
}

function normalizeTileCategories(raw: unknown, tiles: Tile[]): TileCategory[] {
  const defaults = defaultTileCategories();
  const seen = new Set<string>();
  const categories: TileCategory[] = [];

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const id = str(o["id"]);
      const label = str(o["label"]).trim();
      if (!id || !label || seen.has(id)) continue;
      seen.add(id);
      categories.push({
        id,
        label,
        color: normalizeTileCategoryColor(o["color"]),
      });
    }
  }

  if (categories.length === 0) {
    for (const category of defaults) {
      seen.add(category.id);
      categories.push(category);
    }
  }

  for (const tile of tiles) {
    if (seen.has(tile.categoryId)) continue;
    const fallback = defaults.find((category) => category.id === tile.categoryId);
    categories.push(
      fallback ?? {
        id: tile.categoryId,
        label: tile.categoryId,
        color: "blue",
      },
    );
    seen.add(tile.categoryId);
  }

  return categories;
}

function normalizeTiles(raw: unknown): Tile[] {
  if (!Array.isArray(raw)) return defaultTiles();
  return raw
    .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
    .map((t, i) => ({
      id: str(t["id"], `tile-${i + 1}`) || `tile-${i + 1}`,
      subject: str(t["subject"], "بدون عنوان"),
      topic: str(t["topic"]),
      description: str(t["description"] ?? t["details"]),
      duration: num(t["duration"], 60),
      categoryId: fallbackTileCategoryId(t),
    }));
}

function normalizeActivity(raw: unknown, slots: Slot[], index: number): Activity | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const dayIndex = num(o["dayIndex"] ?? o["day"], 0);
  const slotIndex = num(o["slotIndex"] ?? o["slot"], 0);
  const slotId = remapActivitySlot(
    str(o["slotId"]) || slots[Math.min(slotIndex, slots.length - 1)]?.id || slots[0]!.id,
    slots,
  );
  const tileCategoryId = str(o["tileCategoryId"]);
  return {
    id: str(o["id"], `a-${index}`) || `a-${index}`,
    dayIndex: Math.min(6, Math.max(0, Math.round(dayIndex))),
    slotId,
    subject: str(o["subject"], "بدون عنوان"),
    topic: str(o["topic"]),
    details: str(o["detail"] ?? o["details"]),
    duration: num(o["duration"], 60),
    category: isCategory(o["category"])
      ? o["category"]
      : (LEGACY_COLOR_CATEGORY[str(o["color"]).toLowerCase()] ?? "study"),
    ...(tileCategoryId ? { tileCategoryId } : {}),
    done: Boolean(o["done"]),
  };
}

function migrateLegacy(raw: unknown): PlannerData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const slots = normalizeSlots(o["slotTimes"]);
  const tiles = normalizeTiles(o["presets"]);
  const activities = Array.isArray(o["tasks"])
    ? o["tasks"]
        .map((t, i) => normalizeActivity(t, slots, i))
        .filter((a): a is Activity => a !== null)
    : [];
  const key = dateKey(startOfWeek(new Date(), 0));
  const quotes = Array.isArray(o["quotes"])
    ? o["quotes"].filter((q): q is string => typeof q === "string" && q.trim().length > 0)
    : [];
  return {
    version: 3,
    settings: {
      studentName: str(o["student"]),
      slots,
      tiles,
      tileCategories: normalizeTileCategories(undefined, tiles),
      savedTileColors: [],
      quotes: quotes.length ? quotes : DEFAULT_QUOTES,
      theme: "light",
      weekStartsOn: 0,
    },
    weeks: { [key]: { label: str(o["week"]), activities } },
  };
}

export function normalizeData(raw: unknown): PlannerData {
  const fallback = defaultData();
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  const settingsRaw = (o["settings"] ?? {}) as Record<string, unknown>;
  const slots = normalizeSlots(settingsRaw["slots"]);
  const quotes = Array.isArray(settingsRaw["quotes"])
    ? settingsRaw["quotes"].filter((q): q is string => typeof q === "string" && q.trim().length > 0)
    : [];
  const tiles = normalizeTiles(settingsRaw["tiles"]);
  const tileCategories = normalizeTileCategories(settingsRaw["tileCategories"], tiles);
  const weeksRaw = (o["weeks"] ?? {}) as Record<string, unknown>;
  const weeks: PlannerData["weeks"] = {};
  for (const [key, value] of Object.entries(weeksRaw)) {
    if (!value || typeof value !== "object") continue;
    const w = value as Record<string, unknown>;
    weeks[key] = {
      label: str(w["label"]),
      activities: Array.isArray(w["activities"])
        ? w["activities"]
            .map((a, i) => normalizeActivity(a, slots, i))
            .filter((a): a is Activity => a !== null)
        : [],
    };
  }
  return {
    version: 3,
    settings: {
      studentName: str(settingsRaw["studentName"]),
      slots,
      tiles,
      tileCategories,
      savedTileColors: normalizeSavedTileColors(settingsRaw["savedTileColors"]),
      quotes: quotes.length ? quotes : DEFAULT_QUOTES,
      theme: settingsRaw["theme"] === "dark" ? "dark" : "light",
      weekStartsOn: normalizeWeekStartDay(settingsRaw["weekStartsOn"]),
    },
    weeks,
  };
}

export function loadData(): PlannerData {
  if (typeof window === "undefined") return defaultData();
  try {
    const current = window.localStorage.getItem(STORAGE_KEY);
    if (current) return normalizeData(JSON.parse(current));
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const migrated = migrateLegacy(JSON.parse(legacy));
      if (migrated) {
        saveData(migrated);
        return migrated;
      }
    }
  } catch {
    // corrupted storage: fall back to a clean plan
  }
  return defaultData();
}

export function saveData(data: PlannerData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable: keep working in memory
  }
}

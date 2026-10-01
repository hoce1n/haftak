import { describe, expect, test } from "bun:test";

import { normalizeData } from "./planner-storage";
import { activityCategoryFromTile, defaultTiles, type Tile } from "./planner-types";

describe("tile library data", () => {
  test("loads tiles without description as empty شرح", () => {
    const data = normalizeData({
      settings: {
        tiles: [{ id: "tile-1", subject: "ریاضی", topic: "تست", duration: 45, category: "test" }],
      },
      weeks: {},
    });
    expect(data.settings.tiles).toHaveLength(1);
    expect(data.settings.tiles[0]).toMatchObject({
      id: "tile-1",
      subject: "ریاضی",
      topic: "تست",
      description: "",
      duration: 45,
      categoryId: "test",
    });
  });

  test("persists optional شرح on tiles", () => {
    const data = normalizeData({
      settings: {
        tiles: [
          {
            id: "tile-1",
            subject: "فیزیک",
            topic: "الکتریسیته",
            description: "حل تست‌های فصل سوم",
            duration: 60,
            category: "study",
          },
        ],
      },
      weeks: {},
    });
    expect(data.settings.tiles[0]?.description).toBe("حل تست‌های فصل سوم");
  });

  test("migrates legacy tile category onto a default tile category", () => {
    const data = normalizeData({
      settings: {
        tiles: [{ id: "tile-1", subject: "شیمی", topic: "مرور", duration: 45, category: "review" }],
      },
      weeks: {},
    });
    expect(data.settings.tiles[0]?.categoryId).toBe("review");
    expect(data.settings.tileCategories.map((c) => c.id)).toEqual(
      expect.arrayContaining(["study", "review", "test", "memorize"]),
    );
    expect(data.settings.tileCategories.find((c) => c.id === "review")).toMatchObject({
      label: "مرور",
      color: "orange",
    });
  });

  test("keeps custom tile categories and categoryId", () => {
    const data = normalizeData({
      settings: {
        tileCategories: [{ id: "math", label: "ریاضی", color: "blue" }],
        tiles: [
          {
            id: "tile-1",
            subject: "مشتق",
            topic: "",
            description: "",
            duration: 60,
            categoryId: "math",
          },
        ],
      },
      weeks: {},
    });
    expect(data.settings.tileCategories).toEqual([{ id: "math", label: "ریاضی", color: "blue" }]);
    expect(data.settings.tiles[0]?.categoryId).toBe("math");
  });

  test("creates a fallback category for unknown categoryId", () => {
    const data = normalizeData({
      settings: {
        tileCategories: [{ id: "lang", label: "زبان", color: "green" }],
        tiles: [{ id: "tile-1", subject: "حد", duration: 30, categoryId: "math" }],
      },
      weeks: {},
    });
    expect(data.settings.tiles[0]?.categoryId).toBe("math");
    expect(data.settings.tileCategories.map((c) => c.id)).toEqual(["lang", "math"]);
  });

  test("updating a tile keeps the same id and does not duplicate", () => {
    const tiles: Tile[] = defaultTiles();
    const updated = tiles.map((tile) =>
      tile.id === "tile-2"
        ? {
            ...tile,
            subject: "فیزیک",
            description: "حل تست‌های فصل سوم",
          }
        : tile,
    );
    expect(updated).toHaveLength(tiles.length);
    expect(updated.filter((t) => t.id === "tile-2")).toHaveLength(1);
    expect(updated.find((t) => t.id === "tile-2")).toMatchObject({
      subject: "فیزیک",
      description: "حل تست‌های فصل سوم",
    });
  });

  test("dropping a tile copies شرح into activity details without linking back", () => {
    const tile: Tile = {
      id: "tile-1",
      subject: "فیزیک",
      topic: "حرکت",
      description: "حل تست‌های فصل سوم",
      duration: 90,
      categoryId: "test",
    };
    const activity = {
      subject: tile.subject,
      topic: tile.topic,
      details: tile.description,
      duration: tile.duration,
      category: activityCategoryFromTile(tile),
      tileCategoryId: tile.categoryId,
    };
    const laterTile = { ...tile, subject: "شیمی", description: "مرور خلاصه" };
    expect(activity.details).toBe("حل تست‌های فصل سوم");
    expect(activity.subject).toBe("فیزیک");
    expect(activity.category).toBe("test");
    expect(activity.tileCategoryId).toBe("test");
    expect(laterTile.subject).toBe("شیمی");
    expect(activity.subject).not.toBe(laterTile.subject);
  });

  test("persists tileCategoryId on dropped activities", () => {
    const data = normalizeData({
      settings: {
        tileCategories: [{ id: "math", label: "ریاضی", color: "blue" }],
        tiles: [{ id: "tile-1", subject: "مشتق", duration: 60, categoryId: "math" }],
      },
      weeks: {
        "2026-03-21": {
          label: "",
          activities: [
            {
              id: "a-1",
              dayIndex: 0,
              slotId: "slot-1",
              subject: "مشتق",
              topic: "",
              details: "",
              duration: 60,
              category: "study",
              tileCategoryId: "math",
            },
          ],
        },
      },
    });
    expect(data.weeks["2026-03-21"]?.activities[0]?.tileCategoryId).toBe("math");
  });
});

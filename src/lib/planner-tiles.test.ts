import { describe, expect, test } from "bun:test";

import { normalizeData } from "./planner-storage";
import { defaultTiles, type Tile } from "./planner-types";

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
      category: "test",
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
      category: "test",
    };
    const activity = {
      subject: tile.subject,
      topic: tile.topic,
      details: tile.description,
      duration: tile.duration,
      category: tile.category,
    };
    const laterTile = { ...tile, subject: "شیمی", description: "مرور خلاصه" };
    expect(activity.details).toBe("حل تست‌های فصل سوم");
    expect(activity.subject).toBe("فیزیک");
    expect(laterTile.subject).toBe("شیمی");
    expect(activity.subject).not.toBe(laterTile.subject);
  });
});

import type { CSSProperties } from "react";

import {
  TILE_CATEGORY_COLORS,
  TILE_CATEGORY_COLOR_LABELS,
  type TileCategoryColor,
} from "@/lib/planner-types";

export const TILE_COLOR_PRESETS = TILE_CATEGORY_COLORS.map((value) => ({
  value,
  label: TILE_CATEGORY_COLOR_LABELS[value],
}));

const NAMED_TILE_COLORS = new Set<string>(TILE_CATEGORY_COLORS);

/** Resolve both named tokens and custom hex colours to a CSS colour value. */
export function tileColorValue(color: TileCategoryColor): string {
  const lower = color.toLowerCase();
  return NAMED_TILE_COLORS.has(lower) ? `var(--tile-${lower})` : color;
}

export type TileCategoryStyle = {
  bar: CSSProperties;
  dot: CSSProperties;
  chip: CSSProperties;
  text: CSSProperties;
};

export function tileCategoryStyles(color: TileCategoryColor): TileCategoryStyle {
  const value = tileColorValue(color);
  return {
    bar: { backgroundColor: value },
    dot: { backgroundColor: value },
    chip: {
      backgroundColor: `color-mix(in oklab, ${value} 18%, transparent)`,
      color: value,
    },
    text: { color: value },
  };
}

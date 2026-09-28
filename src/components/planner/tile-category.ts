import type { TileCategoryColor } from "@/lib/planner-types";

export const TILE_CATEGORY_STYLES: Record<
  TileCategoryColor,
  { bar: string; dot: string; chip: string; text: string }
> = {
  red: {
    bar: "bg-tile-red",
    dot: "bg-tile-red",
    chip: "bg-tile-red-soft text-tile-red",
    text: "text-tile-red",
  },
  orange: {
    bar: "bg-tile-orange",
    dot: "bg-tile-orange",
    chip: "bg-tile-orange-soft text-tile-orange",
    text: "text-tile-orange",
  },
  yellow: {
    bar: "bg-tile-yellow",
    dot: "bg-tile-yellow",
    chip: "bg-tile-yellow-soft text-tile-yellow",
    text: "text-tile-yellow",
  },
  green: {
    bar: "bg-tile-green",
    dot: "bg-tile-green",
    chip: "bg-tile-green-soft text-tile-green",
    text: "text-tile-green",
  },
  blue: {
    bar: "bg-tile-blue",
    dot: "bg-tile-blue",
    chip: "bg-tile-blue-soft text-tile-blue",
    text: "text-tile-blue",
  },
  purple: {
    bar: "bg-tile-purple",
    dot: "bg-tile-purple",
    chip: "bg-tile-purple-soft text-tile-purple",
    text: "text-tile-purple",
  },
  pink: {
    bar: "bg-tile-pink",
    dot: "bg-tile-pink",
    chip: "bg-tile-pink-soft text-tile-pink",
    text: "text-tile-pink",
  },
};

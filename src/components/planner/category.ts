import type { Category } from "@/lib/planner-types";

/** Subtle, category-specific accents. Colours come from design tokens only. */
export const CATEGORY_STYLES: Record<
  Category,
  { bar: string; dot: string; chip: string; text: string }
> = {
  study: {
    bar: "bg-cat-study",
    dot: "bg-cat-study",
    chip: "bg-cat-study-soft text-cat-study",
    text: "text-cat-study",
  },
  review: {
    bar: "bg-cat-review",
    dot: "bg-cat-review",
    chip: "bg-cat-review-soft text-cat-review",
    text: "text-cat-review",
  },
  test: {
    bar: "bg-cat-test",
    dot: "bg-cat-test",
    chip: "bg-cat-test-soft text-cat-test",
    text: "text-cat-test",
  },
  memorize: {
    bar: "bg-cat-memorize",
    dot: "bg-cat-memorize",
    chip: "bg-cat-memorize-soft text-cat-memorize",
    text: "text-cat-memorize",
  },
};

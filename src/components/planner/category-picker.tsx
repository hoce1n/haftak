import { CATEGORY_STYLES } from "@/components/planner/category";
import { cn } from "@/lib/utils";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/planner-types";

type Props = {
  value: Category;
  onChange: (category: Category) => void;
  size?: "sm" | "md";
};

export function CategoryPicker({ value, onChange, size = "md" }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="نوع فعالیت">
      {CATEGORIES.map((category) => {
        const styles = CATEGORY_STYLES[category];
        const active = value === category;
        return (
          <button
            key={category}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(category)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors",
              size === "sm" ? "text-[11px]" : "text-xs",
              active
                ? "border-foreground/25 bg-accent font-medium"
                : "border-input text-muted-foreground hover:bg-accent/60",
            )}
          >
            <span className={cn("size-2 rounded-full", styles.dot)} aria-hidden />
            {CATEGORY_LABELS[category]}
          </button>
        );
      })}
    </div>
  );
}

export function CategoryLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      {CATEGORIES.map((category) => (
        <span key={category} className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", CATEGORY_STYLES[category].dot)} aria-hidden />
          {CATEGORY_LABELS[category]}
        </span>
      ))}
    </div>
  );
}

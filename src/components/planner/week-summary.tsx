import { CATEGORY_STYLES } from "@/components/planner/category";
import { CategoryLegend } from "@/components/planner/category-picker";
import { cn } from "@/lib/utils";
import { formatHours, toPersianDigits } from "@/lib/jalali";
import { CATEGORIES, CATEGORY_LABELS, type Activity } from "@/lib/planner-types";

export function WeekSummary({ activities }: { activities: Activity[] }) {
  const total = activities.reduce((s, a) => s + a.duration, 0);

  const bySubject = new Map<string, number>();
  for (const a of activities) {
    bySubject.set(a.subject, (bySubject.get(a.subject) ?? 0) + a.duration);
  }
  const subjects = [...bySubject.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const byCategory = CATEGORIES.map((category) => ({
    category,
    minutes: activities
      .filter((a) => a.category === category)
      .reduce((s, a) => s + a.duration, 0),
  })).filter((c) => c.minutes > 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">سهم درس‌ها</h2>
        {subjects.length === 0 ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            پس از افزودن فعالیت، توازن هفته اینجا دیده می‌شود.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {subjects.map(([subject, minutes]) => (
              <li key={subject}>
                <div className="flex items-baseline justify-between gap-2 text-[12px]">
                  <span className="truncate">{subject}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {formatHours(minutes)} ساعت
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${total ? (minutes / total) * 100 : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {byCategory.length ? (
        <div className="border-t pt-4">
          <h3 className="text-[13px] font-semibold">نوع فعالیت‌ها</h3>
          <ul className="mt-2 space-y-1.5">
            {byCategory.map(({ category, minutes }) => (
              <li key={category} className="flex items-center gap-2 text-[12px]">
                <span
                  className={cn("size-2 rounded-full", CATEGORY_STYLES[category].dot)}
                  aria-hidden
                />
                <span className="flex-1">{CATEGORY_LABELS[category]}</span>
                <span className="text-muted-foreground">
                  {toPersianDigits(Math.round((minutes / (total || 1)) * 100))}٪
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="border-t pt-4">
        <CategoryLegend />
      </div>
    </div>
  );
}

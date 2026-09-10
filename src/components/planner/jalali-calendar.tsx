import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  JALALI_MONTHS,
  addDays,
  dateKey,
  dateToJalali,
  isSameDay,
  jalaliMonthLength,
  startOfWeek,
  toGregorian,
  toPersianDigits,
  weekDayIndex,
  weekDayNames,
  type WeekStartDay,
} from "@/lib/jalali";

type Props = {
  weekStart: Date;
  weekStartsOn?: WeekStartDay;
  onSelect: (date: Date) => void;
};

export function JalaliCalendar({ weekStart, weekStartsOn = 0, onSelect }: Props) {
  const initial = dateToJalali(weekStart);
  const [view, setView] = useState({ jy: initial.jy, jm: initial.jm });
  const dayNames = weekDayNames(weekStartsOn);

  const firstDay = toGregorian(view.jy, view.jm, 1);
  const leading = weekDayIndex(firstDay, weekStartsOn);
  const length = jalaliMonthLength(view.jy, view.jm);
  const today = new Date();
  const weekEnd = addDays(weekStart, 6);
  const weekKeys = new Set(Array.from({ length: 7 }, (_, i) => dateKey(addDays(weekStart, i))));

  const shift = (delta: number) => {
    setView((prev) => {
      let jm = prev.jm + delta;
      let jy = prev.jy;
      if (jm < 1) {
        jm = 12;
        jy -= 1;
      } else if (jm > 12) {
        jm = 1;
        jy += 1;
      }
      return { jy, jm };
    });
  };

  const cells: Array<Date | null> = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length }, (_, i) => toGregorian(view.jy, view.jm, i + 1)),
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-1">
        <Button variant="ghost" size="icon" className="size-7" onClick={() => shift(-1)}>
          <ChevronRight className="size-4" />
          <span className="sr-only">ماه قبل</span>
        </Button>
        <div className="text-sm font-semibold">
          {JALALI_MONTHS[view.jm - 1]} {toPersianDigits(view.jy)}
        </div>
        <Button variant="ghost" size="icon" className="size-7" onClick={() => shift(1)}>
          <ChevronLeft className="size-4" />
          <span className="sr-only">ماه بعد</span>
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
        {dayNames.map((d) => (
          <div key={d}>{d.slice(0, 1)}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const inWeek = weekKeys.has(dateKey(date));
          const isToday = isSameDay(date, today);
          return (
            <button
              key={dateKey(date)}
              type="button"
              onClick={() => onSelect(startOfWeek(date, weekStartsOn))}
              className={cn(
                "flex h-8 items-center justify-center rounded-md text-xs transition-colors",
                "hover:bg-accent",
                inWeek && "bg-primary/10 font-semibold text-primary hover:bg-primary/15",
                isToday && "ring-1 ring-primary",
              )}
            >
              {toPersianDigits(dateToJalali(date).jd)}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        هر روزی را انتخاب کنید، هفته‌ی همان روز نمایش داده می‌شود. برنامه‌ی هر هفته جداگانه نگه
        داشته می‌شود.
      </p>
      <p className="sr-only">
        هفته‌ی جاری از {dateKey(weekStart)} تا {dateKey(weekEnd)}
      </p>
    </div>
  );
}

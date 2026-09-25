import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  JALALI_MONTHS,
  addDays,
  dateKey,
  dateToJalali,
  formatJalali,
  isSameDay,
  jalaliMonthLength,
  startOfWeek,
  toGregorian,
  toPersianDigits,
  weekDayIndex,
  weekDayNames,
  type WeekStartDay,
} from "@/lib/jalali";
import {
  formatOccasionTitles,
  getIranianOccasions,
  hasIranianHoliday,
  type IranianOccasion,
} from "@/lib/iranian-occasions";

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

  const weekOccasions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const jalali = dateToJalali(date);
    const occasions = getIranianOccasions(jalali.jy, jalali.jm, jalali.jd);
    return { date, jalali, occasions };
  }).filter((row) => row.occasions.length > 0);

  return (
    <TooltipProvider delayDuration={250}>
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
            const jalali = dateToJalali(date);
            const occasions = getIranianOccasions(jalali.jy, jalali.jm, jalali.jd);
            const holiday = hasIranianHoliday(occasions);
            const inWeek = weekKeys.has(dateKey(date));
            const isToday = isSameDay(date, today);
            const dayButton = (
              <button
                type="button"
                onClick={() => onSelect(startOfWeek(date, weekStartsOn))}
                aria-label={dayAriaLabel(jalali.jd, occasions, holiday)}
                className={cn(
                  "relative flex h-8 items-center justify-center rounded-md text-xs transition-colors",
                  "hover:bg-accent",
                  inWeek && "bg-primary/10 font-semibold text-primary hover:bg-primary/15",
                  !inWeek && holiday && "text-destructive",
                  isToday && "ring-1 ring-primary",
                )}
              >
                {toPersianDigits(jalali.jd)}
                {occasions.length > 0 ? (
                  <span
                    className={cn(
                      "absolute bottom-0.5 size-1 rounded-full",
                      holiday ? "bg-destructive" : "bg-muted-foreground/55",
                    )}
                    aria-hidden
                  />
                ) : null}
              </button>
            );
            if (occasions.length === 0) {
              return <div key={dateKey(date)}>{dayButton}</div>;
            }
            return (
              <Tooltip key={dateKey(date)}>
                <TooltipTrigger asChild>{dayButton}</TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-52 border bg-popover px-2.5 py-2 text-right text-[11px] leading-5 text-popover-foreground"
                >
                  {holiday ? (
                    <div className="mb-1 text-[10px] font-medium text-destructive">تعطیل رسمی</div>
                  ) : null}
                  <ul className="space-y-0.5">
                    {occasions.map((occasion, index) => (
                      <li key={`${occasion.calendar}-${occasion.title}-${index}`}>
                        {occasion.title}
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {weekOccasions.length > 0 ? (
          <ul className="mt-3 space-y-1 text-[11px] leading-relaxed text-muted-foreground">
            {weekOccasions.map(({ date, occasions }) => (
              <li key={dateKey(date)}>
                <span className="font-medium text-foreground/80">{formatJalali(date)}</span>
                {hasIranianHoliday(occasions) ? (
                  <span className="text-destructive"> · تعطیل رسمی</span>
                ) : null}
                <span> — {formatOccasionTitles(occasions)}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          هر روزی را انتخاب کنید، هفته‌ی همان روز نمایش داده می‌شود. برنامه‌ی هر هفته جداگانه نگه
          داشته می‌شود.
        </p>
        <p className="sr-only">
          هفته‌ی جاری از {dateKey(weekStart)} تا {dateKey(weekEnd)}
        </p>
      </div>
    </TooltipProvider>
  );
}

function dayAriaLabel(day: number, occasions: IranianOccasion[], holiday: boolean) {
  if (occasions.length === 0) return toPersianDigits(day);
  const holidayLabel = holiday ? "تعطیل رسمی، " : "";
  return `${toPersianDigits(day)}، ${holidayLabel}${formatOccasionTitles(occasions)}`;
}

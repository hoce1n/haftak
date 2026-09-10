import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Eraser,
  Moon,
  Printer,
  Sun,
  Upload,
} from "lucide-react";
import { useRef, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DAY_NAMES,
  WEEK_START_DAYS,
  formatHours,
  formatWeekRange,
  toPersianDigits,
  type WeekStartDay,
} from "@/lib/jalali";
import type { Activity } from "@/lib/planner-types";

type Props = {
  studentName: string;
  weekLabel: string;
  weekStart: Date;
  weekStartsOn: WeekStartDay;
  activities: Activity[];
  theme: "light" | "dark";
  onStudentName: (value: string) => void;
  onWeekLabel: (value: string) => void;
  onWeekStartsOn: (day: WeekStartDay) => void;
  onShiftWeek: (weeks: number) => void;
  onToday: () => void;
  onClearWeek: () => void;
  onThemeToggle: () => void;
  onPrint: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
  mobileActions?: ReactNode;
};

export function PlannerHeader({
  studentName,
  weekLabel,
  weekStart,
  weekStartsOn,
  activities,
  theme,
  onStudentName,
  onWeekLabel,
  onWeekStartsOn,
  onShiftWeek,
  onToday,
  onClearWeek,
  onThemeToggle,
  onPrint,
  onExport,
  onImport,
  mobileActions,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const totalMinutes = activities.reduce((s, a) => s + a.duration, 0);
  const doneMinutes = activities.filter((a) => a.done).reduce((s, a) => s + a.duration, 0);
  const donePercent = totalMinutes ? Math.round((doneMinutes / totalMinutes) * 100) : 0;

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight sm:text-xl">برنامه هفتگی مطالعه</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {formatWeekRange(weekStart)}
            {weekLabel ? ` · ${weekLabel}` : ""}
            {studentName ? ` · ${studentName}` : ""}
          </p>
        </div>

        <dl className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Stat label="ساعت برنامه‌ریزی‌شده" value={formatHours(totalMinutes)} />
          <Stat label="درصد انجام" value={`${toPersianDigits(donePercent)}٪`} />
          <Stat label="تعداد فعالیت" value={toPersianDigits(activities.length)} />
        </dl>
      </div>

      <div className="no-print flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-md border bg-card">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onShiftWeek(1)}>
            <ChevronRight className="size-4" />
            <span className="sr-only">هفته بعد</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onToday}>
            <CalendarDays className="size-3.5" />
            این هفته
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onShiftWeek(-1)}>
            <ChevronLeft className="size-4" />
            <span className="sr-only">هفته قبل</span>
          </Button>
        </div>

        <Input
          className="h-8 w-36 text-xs"
          placeholder="نام دانش‌آموز"
          value={studentName}
          onChange={(e) => onStudentName(e.target.value)}
        />
        <Input
          className="h-8 w-28 text-xs"
          placeholder="مثلاً هفته ۸"
          value={weekLabel}
          onChange={(e) => onWeekLabel(e.target.value)}
        />
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="shrink-0">شروع هفته</span>
          <select
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
            value={weekStartsOn}
            onChange={(e) => onWeekStartsOn(Number(e.target.value) as WeekStartDay)}
            aria-label="روز شروع هفته"
          >
            {WEEK_START_DAYS.map((day) => (
              <option key={day} value={day}>
                {DAY_NAMES[day]}
              </option>
            ))}
          </select>
        </label>

        <Separator orientation="vertical" className="hidden h-6 sm:block" />

        {mobileActions ? <span className="lg:hidden">{mobileActions}</span> : null}

        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onPrint}>
          <Printer className="size-3.5" />
          خروجی PDF
        </Button>

        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onExport}>
          <Download className="size-3.5" />
          پشتیبان
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-3.5" />
          بازیابی
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onImport(await file.text());
          }}
        />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              <Eraser className="size-3.5" />
              پاک‌کردن هفته
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>همه‌ی فعالیت‌های این هفته پاک شود؟</AlertDialogTitle>
              <AlertDialogDescription>
                فقط فعالیت‌های هفته‌ی {formatWeekRange(weekStart)} حذف می‌شوند. کاشی‌ها و هفته‌های
                دیگر دست‌نخورده می‌مانند و می‌توانید بازگردانی کنید.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>انصراف</AlertDialogCancel>
              <AlertDialogAction onClick={onClearWeek}>پاک کن</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          variant="ghost"
          size="icon"
          className="ms-auto size-8"
          onClick={onThemeToggle}
          aria-label="تغییر روشنایی"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dd className="text-lg font-semibold leading-none text-primary">{value}</dd>
      <dt className="mt-1 text-[11px] text-muted-foreground">{label}</dt>
    </div>
  );
}

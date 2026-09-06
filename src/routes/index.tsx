import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ActivityEditor, type EditorTarget } from "@/components/planner/activity-editor";
import { JalaliCalendar } from "@/components/planner/jalali-calendar";
import { PlannerHeader } from "@/components/planner/planner-header";
import { QuoteStrip } from "@/components/planner/quote-strip";
import { TilesPanel } from "@/components/planner/tiles-panel";
import { WeekGrid } from "@/components/planner/week-grid";
import { WeekSummary } from "@/components/planner/week-summary";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlannerProvider, usePlanner } from "@/lib/planner-store";
import { DAY_NAMES, addDays, formatJalali, persianDayIndex, startOfPersianWeek } from "@/lib/jalali";
import type { WeekPlan } from "@/lib/planner-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "برنامه‌ریز هفتگی مطالعه | برنامه‌ی کنکور" },
      {
        name: "description",
        content:
          "برنامه‌ریز هفتگی مطالعه با تقویم شمسی، پارت‌های زمانی قابل تنظیم، کاشی‌های آماده و خروجی PDF برای دانش‌آموزان کنکوری.",
      },
      { property: "og:title", content: "برنامه‌ریز هفتگی مطالعه" },
      {
        property: "og:description",
        content: "هفته‌ی مطالعه‌ات را با تقویم شمسی بچین، پیشرفتت را ببین و خروجی PDF بگیر.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  return (
    <PlannerProvider>
      <Planner />
    </PlannerProvider>
  );
}

function Planner() {
  const planner = usePlanner();
  const isMobile = useIsMobile();
  const [target, setTarget] = useState<EditorTarget | null>(null);
  const [pickedTileId, setPickedTileId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(() => persianDayIndex(new Date()));
  const [mobilePanel, setMobilePanel] = useState<"calendar" | "tiles" | null>(null);

  const { data, week, weekStart } = planner;
  const slots = data.settings.slots;
  const visibleDays = isMobile ? [selectedDay] : [0, 1, 2, 3, 4, 5, 6];

  const placeTile = (tileId: string, dayIndex: number, slotId: string) => {
    const tile = data.settings.tiles.find((t) => t.id === tileId);
    if (!tile) return;
    planner.addActivity({
      dayIndex,
      slotId,
      subject: tile.subject,
      topic: tile.topic,
      details: "",
      duration: tile.duration,
      category: tile.category,
    });
    setPickedTileId(null);
    toast.success(`${tile.subject} به ${DAY_NAMES[dayIndex]} اضافه شد`);
  };

  const handleCellActivate = (dayIndex: number, slotId: string) => {
    if (pickedTileId) {
      placeTile(pickedTileId, dayIndex, slotId);
      return;
    }
    setTarget({ mode: "create", dayIndex, slotId });
  };

  const handleClearWeek = () => {
    const snapshot: WeekPlan = { ...week, activities: [...week.activities] };
    planner.clearWeek();
    toast("فعالیت‌های هفته پاک شد", {
      action: { label: "بازگردانی", onClick: () => planner.restoreSnapshot(snapshot) },
    });
  };

  const handleDelete = (id: string) => {
    const activity = week.activities.find((a) => a.id === id);
    planner.removeActivity(id);
    if (!activity) return;
    toast("فعالیت حذف شد", {
      action: {
        label: "بازگردانی",
        onClick: () => planner.addActivity({ ...activity, done: activity.done }),
      },
    });
  };

  const handleExport = () => {
    const blob = new Blob([planner.exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "study-planner-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("فایل پشتیبان ذخیره شد");
  };

  const handleImport = (json: string) => {
    if (planner.importJSON(json)) toast.success("برنامه بازیابی شد");
    else toast.error("فایل قابل خواندن نبود");
  };

  const sidePanels = (
    <>
      <section className="rounded-xl border bg-card p-4 shadow-xs">
        <h2 className="mb-3 text-sm font-semibold">تقویم</h2>
        <JalaliCalendar weekStart={weekStart} onSelect={planner.setWeekStart} />
      </section>
      <section className="rounded-xl border bg-card p-4 shadow-xs">
        <WeekSummary activities={week.activities} />
      </section>
    </>
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-[110rem] space-y-4 p-3 sm:p-5">
        <PlannerHeader
          studentName={data.settings.studentName}
          weekLabel={week.label}
          weekStart={weekStart}
          activities={week.activities}
          theme={data.settings.theme}
          onStudentName={planner.setStudentName}
          onWeekLabel={planner.setWeekLabel}
          onShiftWeek={(weeks) => planner.setWeekStart(addDays(weekStart, weeks * 7))}
          onToday={() => planner.setWeekStart(startOfPersianWeek(new Date()))}
          onClearWeek={handleClearWeek}
          onThemeToggle={() =>
            planner.setTheme(data.settings.theme === "dark" ? "light" : "dark")
          }
          onPrint={() => window.print()}
          onExport={handleExport}
          onImport={handleImport}
          mobileActions={
            <span className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setMobilePanel("calendar")}
              >
                <CalendarDays className="size-3.5" />
                تقویم
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setMobilePanel("tiles")}
              >
                <LayoutGrid className="size-3.5" />
                کاشی‌ها
              </Button>
            </span>
          }
        />

        <QuoteStrip quotes={data.settings.quotes} onQuotesChange={planner.setQuotes} />

        <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)_15rem]">
          <aside className="no-print hidden flex-col gap-4 lg:flex">{sidePanels}</aside>

          <main className="print-area min-w-0 rounded-xl border bg-card/60 p-3 shadow-xs">
            {isMobile ? (
              <div className="no-print mb-3 flex gap-1 overflow-x-auto">
                {DAY_NAMES.map((name, i) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedDay(i)}
                    className={cn(
                      "flex shrink-0 flex-col items-center rounded-lg border px-3 py-1.5 text-xs",
                      selectedDay === i
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    <span>{name}</span>
                    <span className="text-[10px]">{formatJalali(addDays(weekStart, i))}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {week.activities.length === 0 ? (
              <p className="no-print mb-3 rounded-lg border border-dashed px-4 py-3 text-center text-[12px] text-muted-foreground">
                این هفته خالی است. روی هر خانه بزنید تا فعالیت اضافه شود، یا یک کاشی آماده را در آن
                رها کنید.
              </p>
            ) : null}

            <WeekGrid
              slots={slots}
              activities={week.activities}
              weekStart={weekStart}
              visibleDays={visibleDays}
              pickedTileId={pickedTileId}
              onCellActivate={handleCellActivate}
              onActivitySelect={(activity) => setTarget({ mode: "edit", activity })}
              onActivityToggle={planner.toggleActivity}
              onTileDrop={placeTile}
              onSlotChange={planner.updateSlot}
            />
          </main>

          <aside className="no-print hidden lg:block">
            <div className="rounded-xl border bg-card p-4 shadow-xs">
              <TilesPanel
                tiles={data.settings.tiles}
                pickedTileId={pickedTileId}
                onPick={setPickedTileId}
                onAdd={planner.addTile}
                onRemove={planner.removeTile}
              />
            </div>
          </aside>
        </div>
      </div>

      <Sheet open={mobilePanel !== null} onOpenChange={(open) => !open && setMobilePanel(null)}>
        <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>{mobilePanel === "tiles" ? "کاشی‌های آماده" : "تقویم و توازن هفته"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            {mobilePanel === "tiles" ? (
              <TilesPanel
                tiles={data.settings.tiles}
                pickedTileId={pickedTileId}
                onPick={(id) => {
                  setPickedTileId(id);
                  setMobilePanel(null);
                }}
                onAdd={planner.addTile}
                onRemove={planner.removeTile}
              />
            ) : (
              <>
                <JalaliCalendar
                  weekStart={weekStart}
                  onSelect={(date) => {
                    planner.setWeekStart(date);
                    setMobilePanel(null);
                  }}
                />
                <WeekSummary activities={week.activities} />
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ActivityEditor
        target={target}
        slots={slots}
        onClose={() => setTarget(null)}
        onCreate={(draft) => planner.addActivity(draft)}
        onUpdate={(id, draft) => planner.updateActivity(id, draft)}
        onDelete={handleDelete}
      />
    </div>
  );
}

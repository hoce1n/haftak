import { Check, Clock, Plus } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CATEGORY_STYLES } from "@/components/planner/category";
import { cn } from "@/lib/utils";
import { DAY_NAMES, addDays, formatHours, formatJalali, toPersianDigits } from "@/lib/jalali";
import { CATEGORY_LABELS, type Activity, type Slot } from "@/lib/planner-types";

type Props = {
  slots: Slot[];
  activities: Activity[];
  weekStart: Date;
  visibleDays: number[];
  pickedTileId: string | null;
  onCellActivate: (dayIndex: number, slotId: string) => void;
  onActivitySelect: (activity: Activity) => void;
  onActivityToggle: (id: string) => void;
  onTileDrop: (tileId: string, dayIndex: number, slotId: string) => void;
  onSlotChange: (slotId: string, patch: Partial<Omit<Slot, "id">>) => void;
};

export function WeekGrid({
  slots,
  activities,
  weekStart,
  visibleDays,
  pickedTileId,
  onCellActivate,
  onActivitySelect,
  onActivityToggle,
  onTileDrop,
  onSlotChange,
}: Props) {
  const [hoverCell, setHoverCell] = useState<string | null>(null);

  const dayTotal = (dayIndex: number) =>
    activities.filter((a) => a.dayIndex === dayIndex).reduce((sum, a) => sum + a.duration, 0);
  const desktop = visibleDays.length > 1;
  const partCount = Math.max(slots.length, 1);

  return (
    <div
      className="print-grid overflow-x-auto print:overflow-visible"
      style={{ scrollbarGutter: "stable" }}
    >
      <div
        className={
          desktop ? "print-week grid min-w-184 gap-1.5 print:min-w-0" : "print-week grid gap-1.5"
        }
        style={{
          gridTemplateColumns: desktop
            ? `5.5rem repeat(${partCount}, minmax(0, 1fr)) 6.25rem`
            : `5.5rem minmax(0, 1fr) 6.25rem`,
          ["--print-part-count" as string]: String(partCount),
        }}
      >
        <div className="sticky top-0 z-10 bg-background pb-1" />
        {slots.map((slot) => (
          <SlotHeader key={slot.id} slot={slot} onSlotChange={onSlotChange} />
        ))}
        <div className="sticky top-0 z-10 rounded-lg border bg-card px-2 py-2 text-center">
          <div className="text-sm font-semibold">جمع روز</div>
          <div className="text-[11px] text-muted-foreground">ساعت مطالعه</div>
        </div>

        {visibleDays.map((dayIndex) => {
          const date = addDays(weekStart, dayIndex);
          const minutes = dayTotal(dayIndex);
          return (
            <div key={dayIndex} className="contents">
              <div className="flex h-full flex-col justify-center rounded-lg border border-primary/40 bg-muted/70 px-2.5 py-3 text-right">
                <div className="text-sm font-semibold">{DAY_NAMES[dayIndex]}</div>
                <div className="text-[11px] text-muted-foreground">{formatJalali(date)}</div>
              </div>
              {slots.map((slot) => {
                const cellKey = `${dayIndex}-${slot.id}`;
                const cellActivities = activities.filter(
                  (a) => a.dayIndex === dayIndex && a.slotId === slot.id,
                );
                return (
                  <div
                    key={cellKey}
                    className={cn(
                      "print-cell group/cell min-h-32 rounded-lg border border-dashed bg-card/40 p-2 transition-colors",
                      hoverCell === cellKey && "border-primary bg-primary/5",
                      pickedTileId && "border-primary/40",
                    )}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setHoverCell(cellKey);
                    }}
                    onDragLeave={() => setHoverCell((c) => (c === cellKey ? null : c))}
                    onDrop={(e) => {
                      e.preventDefault();
                      setHoverCell(null);
                      const tileId = e.dataTransfer.getData("text/tile-id");
                      if (tileId) onTileDrop(tileId, dayIndex, slot.id);
                    }}
                  >
                    <div className="flex h-full min-h-28 flex-col gap-1.5">
                      {cellActivities.map((activity) => (
                        <ActivityCard
                          key={activity.id}
                          activity={activity}
                          onSelect={() => onActivitySelect(activity)}
                          onToggle={() => onActivityToggle(activity.id)}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => onCellActivate(dayIndex, slot.id)}
                        className={cn(
                          "no-print flex items-center justify-center gap-1 rounded-md py-2 text-[11px] text-muted-foreground transition-opacity",
                          "hover:bg-accent hover:text-foreground",
                          cellActivities.length > 0
                            ? "opacity-0 group-hover/cell:opacity-100 focus-visible:opacity-100"
                            : "flex-1",
                        )}
                        aria-label={`افزودن فعالیت به ${DAY_NAMES[dayIndex]} — ${slot.title}`}
                      >
                        <Plus className="size-3.5" />
                        {pickedTileId ? "اینجا قرار بده" : "افزودن"}
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="flex h-full min-h-32 flex-col items-center justify-center rounded-lg border bg-card px-2 py-3 text-center">
                <div className="text-base font-semibold text-primary">
                  {minutes > 0 ? formatHours(minutes) : "—"}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {minutes > 0 ? "ساعت مطالعه" : "بدون برنامه"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlotHeader({
  slot,
  onSlotChange,
}: {
  slot: Slot;
  onSlotChange: (slotId: string, patch: Partial<Omit<Slot, "id">>) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="sticky top-0 z-10 flex h-full flex-col items-center justify-center gap-0.5 rounded-lg border bg-card px-2 py-2 text-center transition-colors hover:border-primary/40 hover:bg-accent/50"
        >
          <span className="text-[13px] font-semibold">{slot.title}</span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="size-3" />
            {toPersianDigits(slot.start)} – {toPersianDigits(slot.end)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${slot.id}-title`}>عنوان پارت</Label>
          <Input
            id={`${slot.id}-title`}
            value={slot.title}
            onChange={(e) => onSlotChange(slot.id, { title: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${slot.id}-start`}>شروع</Label>
            <Input
              id={`${slot.id}-start`}
              type="time"
              value={slot.start}
              onChange={(e) => onSlotChange(slot.id, { start: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${slot.id}-end`}>پایان</Label>
            <Input
              id={`${slot.id}-end`}
              type="time"
              value={slot.end}
              onChange={(e) => onSlotChange(slot.id, { end: e.target.value })}
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">مدت هر فعالیت مستقل از طول پارت است.</p>
      </PopoverContent>
    </Popover>
  );
}

function ActivityCard({
  activity,
  onSelect,
  onToggle,
}: {
  activity: Activity;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const styles = CATEGORY_STYLES[activity.category];
  return (
    <div
      className={cn(
        "group relative flex gap-2 overflow-hidden rounded-md border bg-card px-2 py-1.5 text-right shadow-xs transition-colors",
        activity.done && "opacity-60",
      )}
    >
      <span className={cn("absolute inset-y-0 right-0 w-1", styles.bar)} aria-hidden />
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 pr-1.5 text-right outline-none focus-visible:ring-[2px] focus-visible:ring-ring/50"
      >
        <div className="flex items-center gap-1.5">
          <span
            className={cn("truncate text-[12px] font-semibold", activity.done && "line-through")}
          >
            {activity.subject}
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {toPersianDigits(activity.duration)}′
          </span>
        </div>
        {activity.topic ? (
          <div className="truncate text-[11px] text-muted-foreground">{activity.topic}</div>
        ) : null}
        {activity.details ? (
          <div className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-muted-foreground/80">
            {activity.details}
          </div>
        ) : null}
        <span className={cn("mt-1 inline-block rounded px-1.5 py-0.5 text-[10px]", styles.chip)}>
          {CATEGORY_LABELS[activity.category]}
        </span>
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={activity.done}
        aria-label={activity.done ? "برگرداندن به انجام‌نشده" : "انجام شد"}
        className={cn(
          "no-print mt-0.5 size-5 shrink-0 self-start rounded border transition-colors",
          activity.done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input hover:border-primary",
        )}
      >
        {activity.done ? <Check className="mx-auto size-3.5" /> : null}
      </button>
    </div>
  );
}

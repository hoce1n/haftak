import { GripVertical, Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORY_STYLES } from "@/components/planner/category";
import { CategoryPicker } from "@/components/planner/category-picker";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/jalali";
import { CATEGORY_LABELS, type Category, type Tile } from "@/lib/planner-types";

type Props = {
  tiles: Tile[];
  pickedTileId: string | null;
  onPick: (id: string | null) => void;
  onAdd: (tile: Omit<Tile, "id">) => void;
  onRemove: (id: string) => void;
};

export function TilesPanel({ tiles, pickedTileId, onPick, onAdd, onRemove }: Props) {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(60);
  const [category, setCategory] = useState<Category>("study");

  const submit = () => {
    if (!subject.trim()) return;
    onAdd({ subject: subject.trim(), topic: topic.trim(), duration, category });
    setSubject("");
    setTopic("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">کاشی‌های آماده</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          یک کاشی را بکشید و در خانه‌ی دلخواه رها کنید، یا آن را انتخاب کنید و روی خانه بزنید.
        </p>
      </div>

      <div className="space-y-1.5">
        {tiles.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-center text-[11px] text-muted-foreground">
            هنوز کاشی‌ای نساخته‌اید.
          </p>
        ) : null}
        {tiles.map((tile) => {
          const picked = pickedTileId === tile.id;
          return (
            <div
              key={tile.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/tile-id", tile.id);
                e.dataTransfer.effectAllowed = "copy";
              }}
              className={cn(
                "group relative flex cursor-grab items-center gap-2 overflow-hidden rounded-md border bg-card px-2 py-1.5",
                picked && "border-primary ring-1 ring-primary/40",
              )}
            >
              <span
                className={cn("absolute inset-y-0 right-0 w-1", CATEGORY_STYLES[tile.category].bar)}
                aria-hidden
              />
              <GripVertical className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <button
                type="button"
                onClick={() => onPick(picked ? null : tile.id)}
                className="flex-1 text-right"
                aria-pressed={picked}
              >
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[12px] font-semibold">{tile.subject}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {toPersianDigits(tile.duration)}′
                  </span>
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {tile.topic || CATEGORY_LABELS[tile.category]}
                </div>
              </button>
              <button
                type="button"
                onClick={() => onRemove(tile.id)}
                aria-label={`حذف کاشی ${tile.subject}`}
                className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 border-t pt-4">
        <h3 className="text-[13px] font-semibold">کاشی جدید</h3>
        <div className="space-y-1.5">
          <Label htmlFor="tile-subject" className="text-[11px]">
            درس
          </Label>
          <Input
            id="tile-subject"
            className="h-8"
            value={subject}
            placeholder="ریاضی"
            onChange={(e) => setSubject(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="tile-topic" className="text-[11px]">
              مبحث
            </Label>
            <Input
              id="tile-topic"
              className="h-8"
              value={topic}
              placeholder="حل تست"
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tile-duration" className="text-[11px]">
              دقیقه
            </Label>
            <Input
              id="tile-duration"
              className="h-8"
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Math.max(0, Number(e.target.value)))}
            />
          </div>
        </div>
        <CategoryPicker value={category} onChange={setCategory} size="sm" />
        <Button variant="outline" className="w-full" size="sm" onClick={submit}>
          <Plus className="size-4" />
          افزودن کاشی
        </Button>
      </div>
    </div>
  );
}

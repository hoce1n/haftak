import { GripVertical, Pencil, Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_STYLES } from "@/components/planner/category";
import { CategoryPicker } from "@/components/planner/category-picker";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/jalali";
import { CATEGORY_LABELS, type Category, type Tile } from "@/lib/planner-types";

type TileDraft = Omit<Tile, "id">;

const EMPTY_DRAFT: TileDraft = {
  subject: "",
  topic: "",
  description: "",
  duration: 60,
  category: "study",
};

function draftFrom(tile: Tile): TileDraft {
  return {
    subject: tile.subject,
    topic: tile.topic,
    description: tile.description,
    duration: tile.duration,
    category: tile.category,
  };
}

type Props = {
  tiles: Tile[];
  pickedTileId: string | null;
  onPick: (id: string | null) => void;
  onAdd: (tile: TileDraft) => void;
  onUpdate: (id: string, tile: TileDraft) => void;
  onRemove: (id: string) => void;
};

export function TilesPanel({ tiles, pickedTileId, onPick, onAdd, onUpdate, onRemove }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TileDraft>(EMPTY_DRAFT);

  const patch = (next: Partial<TileDraft>) => setDraft((prev) => ({ ...prev, ...next }));
  const editing = editingId !== null;

  const resetForm = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const startEdit = (tile: Tile) => {
    setEditingId(tile.id);
    setDraft(draftFrom(tile));
  };

  const submit = () => {
    if (!draft.subject.trim()) return;
    const payload: TileDraft = {
      subject: draft.subject.trim(),
      topic: draft.topic.trim(),
      description: draft.description.trim(),
      duration: draft.duration,
      category: draft.category,
    };
    if (editingId) onUpdate(editingId, payload);
    else onAdd(payload);
    resetForm();
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
          const isEditingThis = editingId === tile.id;
          return (
            <div
              key={tile.id}
              draggable={!isEditingThis}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/tile-id", tile.id);
                e.dataTransfer.effectAllowed = "copy";
              }}
              className={cn(
                "group relative flex cursor-grab items-start gap-2 overflow-hidden rounded-md border bg-card px-2 py-1.5",
                picked && "border-primary ring-1 ring-primary/40",
                isEditingThis && "border-primary/50",
              )}
            >
              <span
                className={cn("absolute inset-y-0 right-0 w-1", CATEGORY_STYLES[tile.category].bar)}
                aria-hidden
              />
              <GripVertical
                className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <button
                type="button"
                onClick={() => onPick(picked ? null : tile.id)}
                className="min-w-0 flex-1 text-right"
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
                {tile.description ? (
                  <div className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-muted-foreground/80">
                    {tile.description}
                  </div>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => startEdit(tile)}
                aria-label={`ویرایش کاشی ${tile.subject}`}
                className="shrink-0 rounded p-1 text-muted-foreground opacity-70 transition-opacity hover:bg-accent sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingId === tile.id) resetForm();
                  onRemove(tile.id);
                }}
                aria-label={`حذف کاشی ${tile.subject}`}
                className="shrink-0 rounded p-1 text-muted-foreground opacity-70 transition-opacity hover:bg-accent sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <TileForm
        draft={draft}
        editing={editing}
        onPatch={patch}
        onSubmit={submit}
        onCancel={resetForm}
      />
    </div>
  );
}

function TileForm({
  draft,
  editing,
  onPatch,
  onSubmit,
  onCancel,
}: {
  draft: TileDraft;
  editing: boolean;
  onPatch: (next: Partial<TileDraft>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2 border-t pt-4">
      <h3 className="text-[13px] font-semibold">{editing ? "ویرایش کاشی" : "کاشی جدید"}</h3>
      <div className="space-y-1.5">
        <Label htmlFor="tile-subject" className="text-[11px]">
          درس
        </Label>
        <Input
          id="tile-subject"
          className="h-8"
          value={draft.subject}
          placeholder="ریاضی"
          onChange={(e) => onPatch({ subject: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
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
            value={draft.topic}
            placeholder="حل تست"
            onChange={(e) => onPatch({ topic: e.target.value })}
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
            value={draft.duration}
            onChange={(e) => onPatch({ duration: Math.max(0, Number(e.target.value)) })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tile-description" className="text-[11px]">
          شرح
        </Label>
        <Textarea
          id="tile-description"
          rows={2}
          className="min-h-14 text-sm"
          value={draft.description}
          placeholder="حل تست‌های فصل سوم"
          onChange={(e) => onPatch({ description: e.target.value })}
        />
      </div>
      <CategoryPicker
        value={draft.category}
        onChange={(category: Category) => onPatch({ category })}
        size="sm"
      />
      {editing ? (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" size="sm" onClick={onSubmit}>
            ذخیره
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            انصراف
          </Button>
        </div>
      ) : (
        <Button variant="outline" className="w-full" size="sm" onClick={onSubmit}>
          <Plus className="size-4" />
          افزودن کاشی
        </Button>
      )}
    </div>
  );
}

import { GripVertical, Pencil, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TILE_CATEGORY_STYLES } from "@/components/planner/tile-category";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/jalali";
import {
  TILE_CATEGORY_COLORS,
  type Tile,
  type TileCategory,
  type TileCategoryColor,
} from "@/lib/planner-types";

type TileDraft = Omit<Tile, "id">;

function emptyDraft(categoryId: string): TileDraft {
  return {
    subject: "",
    topic: "",
    description: "",
    duration: 60,
    categoryId,
  };
}

function draftFrom(tile: Tile): TileDraft {
  return {
    subject: tile.subject,
    topic: tile.topic,
    description: tile.description,
    duration: tile.duration,
    categoryId: tile.categoryId,
  };
}

type Props = {
  tiles: Tile[];
  tileCategories: TileCategory[];
  pickedTileId: string | null;
  onPick: (id: string | null) => void;
  onAdd: (tile: TileDraft) => void;
  onUpdate: (id: string, tile: TileDraft) => void;
  onRemove: (id: string) => void;
  onAddCategory: (category: Omit<TileCategory, "id">) => string;
  onUpdateCategory: (id: string, patch: Partial<Omit<TileCategory, "id">>) => void;
  onRemoveCategory: (id: string) => void;
};

export function TilesPanel({
  tiles,
  tileCategories,
  pickedTileId,
  onPick,
  onAdd,
  onUpdate,
  onRemove,
  onAddCategory,
  onUpdateCategory,
  onRemoveCategory,
}: Props) {
  const defaultCategoryId = tileCategories[0]?.id ?? "";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TileDraft>(() => emptyDraft(defaultCategoryId));
  const [managing, setManaging] = useState(false);

  const patch = (next: Partial<TileDraft>) => setDraft((prev) => ({ ...prev, ...next }));
  const editing = editingId !== null;

  const grouped = useMemo(
    () =>
      tileCategories.map((category) => ({
        category,
        tiles: tiles.filter((tile) => tile.categoryId === category.id),
      })),
    [tileCategories, tiles],
  );

  const resetForm = () => {
    setEditingId(null);
    setDraft(emptyDraft(defaultCategoryId));
  };

  const startEdit = (tile: Tile) => {
    setEditingId(tile.id);
    setDraft(draftFrom(tile));
  };

  const startCreateIn = (categoryId: string) => {
    setEditingId(null);
    setDraft(emptyDraft(categoryId));
  };

  const submit = () => {
    if (!draft.subject.trim() || !draft.categoryId) return;
    const payload: TileDraft = {
      subject: draft.subject.trim(),
      topic: draft.topic.trim(),
      description: draft.description.trim(),
      duration: draft.duration,
      categoryId: draft.categoryId,
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

      {tiles.length === 0 && tileCategories.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-4 text-center text-[11px] text-muted-foreground">
          هنوز دسته‌بندی یا کاشی‌ای نساخته‌اید.
        </p>
      ) : null}

      <div className="space-y-4">
        {grouped.map(({ category, tiles: categoryTiles }) => (
          <section key={category.id} className="space-y-1.5">
            <div className="flex items-center gap-1.5 px-0.5">
              <span
                className={cn("size-2 rounded-full", TILE_CATEGORY_STYLES[category.color].dot)}
                aria-hidden
              />
              <h3 className="min-w-0 flex-1 truncate text-[12px] font-semibold">
                {category.label}
              </h3>
              <button
                type="button"
                onClick={() => startCreateIn(category.id)}
                className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={`افزودن کاشی به ${category.label}`}
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            {categoryTiles.length === 0 ? (
              <p className="rounded-md border border-dashed px-3 py-2 text-center text-[10px] text-muted-foreground">
                کاشی‌ای در این دسته نیست.
              </p>
            ) : null}
            {categoryTiles.map((tile) => {
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
                    className={cn(
                      "absolute inset-y-0 right-0 w-1",
                      TILE_CATEGORY_STYLES[category.color].bar,
                    )}
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
                      {tile.topic || category.label}
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
          </section>
        ))}
      </div>

      {tileCategories.length > 0 ? (
        <TileForm
          draft={draft}
          categories={tileCategories}
          editing={editing}
          onPatch={patch}
          onSubmit={submit}
          onCancel={resetForm}
        />
      ) : null}

      <CategoryManager
        categories={tileCategories}
        tiles={tiles}
        open={managing}
        onToggle={() => setManaging((open) => !open)}
        onAdd={onAddCategory}
        onUpdate={onUpdateCategory}
        onRemove={(id) => {
          if (draft.categoryId === id) setDraft((prev) => ({ ...prev, categoryId: "" }));
          onRemoveCategory(id);
        }}
      />
    </div>
  );
}

function TileForm({
  draft,
  categories,
  editing,
  onPatch,
  onSubmit,
  onCancel,
}: {
  draft: TileDraft;
  categories: TileCategory[];
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
      <TileCategoryPicker
        value={draft.categoryId}
        categories={categories}
        onChange={(categoryId) => onPatch({ categoryId })}
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

function TileCategoryPicker({
  value,
  categories,
  onChange,
}: {
  value: string;
  categories: TileCategory[];
  onChange: (categoryId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="دسته‌بندی کاشی">
      {categories.map((category) => {
        const styles = TILE_CATEGORY_STYLES[category.color];
        const active = value === category.id;
        return (
          <button
            key={category.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(category.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors",
              active
                ? "border-foreground/25 bg-accent font-medium"
                : "border-input text-muted-foreground hover:bg-accent/60",
            )}
          >
            <span className={cn("size-2 rounded-full", styles.dot)} aria-hidden />
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: TileCategoryColor;
  onChange: (color: TileCategoryColor) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="رنگ دسته">
      {TILE_CATEGORY_COLORS.map((color) => {
        const active = value === color;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={color}
            onClick={() => onChange(color)}
            className={cn(
              "flex size-6 items-center justify-center rounded-full border",
              active ? "border-foreground" : "border-transparent",
            )}
          >
            <span className={cn("size-4 rounded-full", TILE_CATEGORY_STYLES[color].dot)} />
          </button>
        );
      })}
    </div>
  );
}

function CategoryManager({
  categories,
  tiles,
  open,
  onToggle,
  onAdd,
  onUpdate,
  onRemove,
}: {
  categories: TileCategory[];
  tiles: Tile[];
  open: boolean;
  onToggle: () => void;
  onAdd: (category: Omit<TileCategory, "id">) => string;
  onUpdate: (id: string, patch: Partial<Omit<TileCategory, "id">>) => void;
  onRemove: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState<TileCategoryColor>("blue");

  const reset = () => {
    setEditingId(null);
    setLabel("");
    setColor("blue");
  };

  const startEdit = (category: TileCategory) => {
    setEditingId(category.id);
    setLabel(category.label);
    setColor(category.color);
  };

  const submit = () => {
    const nextLabel = label.trim();
    if (!nextLabel) return;
    if (editingId) onUpdate(editingId, { label: nextLabel, color });
    else onAdd({ label: nextLabel, color });
    reset();
  };

  const tileCount = (id: string) => tiles.filter((tile) => tile.categoryId === id).length;

  return (
    <div className="space-y-2 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold">دسته‌بندی‌ها</h3>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={onToggle}>
          {open ? "بستن" : "مدیریت"}
        </Button>
      </div>
      {open ? (
        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-3 text-center text-[11px] text-muted-foreground">
              هنوز دسته‌ای نساخته‌اید.
            </p>
          ) : null}
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5"
            >
              <span
                className={cn("size-2.5 rounded-full", TILE_CATEGORY_STYLES[category.color].dot)}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-[12px]">{category.label}</span>
              <span className="text-[10px] text-muted-foreground">
                {toPersianDigits(tileCount(category.id))}
              </span>
              <button
                type="button"
                onClick={() => startEdit(category)}
                aria-label={`ویرایش دسته ${category.label}`}
                className="rounded p-1 text-muted-foreground hover:bg-accent"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingId === category.id) reset();
                  onRemove(category.id);
                }}
                aria-label={`حذف دسته ${category.label}`}
                className="rounded p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          <div className="space-y-2 rounded-md border border-dashed p-2">
            <Label htmlFor="tile-category-label" className="text-[11px]">
              {editingId ? "ویرایش دسته" : "دسته جدید"}
            </Label>
            <Input
              id="tile-category-label"
              className="h-8"
              value={label}
              placeholder="ریاضی"
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <ColorPicker value={color} onChange={setColor} />
            {editingId ? (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" size="sm" onClick={submit}>
                  ذخیره
                </Button>
                <Button variant="ghost" size="sm" onClick={reset}>
                  انصراف
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full" size="sm" onClick={submit}>
                <Plus className="size-4" />
                افزودن دسته
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

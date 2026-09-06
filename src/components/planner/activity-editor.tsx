import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { CategoryPicker } from "@/components/planner/category-picker";
import { DAY_NAMES, toPersianDigits } from "@/lib/jalali";
import {
  CATEGORY_LABELS,
  type Activity,
  type Category,
  type Slot,
} from "@/lib/planner-types";

export type EditorTarget =
  | { mode: "create"; dayIndex: number; slotId: string }
  | { mode: "edit"; activity: Activity };

type Draft = {
  dayIndex: number;
  slotId: string;
  subject: string;
  topic: string;
  details: string;
  duration: number;
  category: Category;
};

type Props = {
  target: EditorTarget | null;
  slots: Slot[];
  onClose: () => void;
  onCreate: (draft: Draft) => void;
  onUpdate: (id: string, draft: Draft) => void;
  onDelete: (id: string) => void;
};

function draftFrom(target: EditorTarget, slots: Slot[]): Draft {
  if (target.mode === "edit") {
    const a = target.activity;
    return {
      dayIndex: a.dayIndex,
      slotId: a.slotId,
      subject: a.subject,
      topic: a.topic,
      details: a.details,
      duration: a.duration,
      category: a.category,
    };
  }
  return {
    dayIndex: target.dayIndex,
    slotId: target.slotId || (slots[0]?.id ?? ""),
    subject: "",
    topic: "",
    details: "",
    duration: 60,
    category: "study",
  };
}

export function ActivityEditor({ target, slots, onClose, onCreate, onUpdate, onDelete }: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    setDraft(target ? draftFrom(target, slots) : null);
  }, [target, slots]);

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const submit = () => {
    if (!draft || !target) return;
    const clean = { ...draft, subject: draft.subject.trim() || "بدون عنوان" };
    if (target.mode === "edit") onUpdate(target.activity.id, clean);
    else onCreate(clean);
    onClose();
  };

  return (
    <Sheet open={!!target} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-full gap-0 overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>
            {target?.mode === "edit" ? "ویرایش فعالیت" : "فعالیت جدید"}
          </SheetTitle>
          <SheetDescription>
            {draft
              ? `${DAY_NAMES[draft.dayIndex]} — ${slots.find((s) => s.id === draft.slotId)?.title ?? ""}`
              : ""}
          </SheetDescription>
        </SheetHeader>

        {draft ? (
          <div className="space-y-4 px-4 pb-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="ae-day">روز</Label>
                <select
                  id="ae-day"
                  value={draft.dayIndex}
                  onChange={(e) => patch({ dayIndex: Number(e.target.value) })}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  {DAY_NAMES.map((name, i) => (
                    <option key={name} value={i}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ae-slot">پارت زمانی</Label>
                <select
                  id="ae-slot"
                  value={draft.slotId}
                  onChange={(e) => patch({ slotId: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  {slots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.title} ({toPersianDigits(slot.start)}–{toPersianDigits(slot.end)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ae-subject">درس</Label>
              <Input
                id="ae-subject"
                value={draft.subject}
                placeholder="زیست‌شناسی"
                autoFocus
                onChange={(e) => patch({ subject: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="ae-topic">مبحث</Label>
                <Input
                  id="ae-topic"
                  value={draft.topic}
                  placeholder="فصل ۱ — دنیای زنده"
                  onChange={(e) => patch({ topic: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ae-duration">مدت (دقیقه)</Label>
                <Input
                  id="ae-duration"
                  type="number"
                  min={5}
                  step={5}
                  value={draft.duration}
                  onChange={(e) => patch({ duration: Math.max(0, Number(e.target.value)) })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ae-details">شرح کار / تعداد تست</Label>
              <Textarea
                id="ae-details"
                rows={3}
                value={draft.details}
                placeholder="۳۰ تست سرعتی"
                onChange={(e) => patch({ details: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>نوع فعالیت</Label>
              <CategoryPicker
                value={draft.category}
                onChange={(category) => patch({ category })}
              />
              <p className="text-[11px] text-muted-foreground">
                {CATEGORY_LABELS[draft.category]}
              </p>
            </div>
          </div>
        ) : null}

        <SheetFooter className="flex-row gap-2">
          <Button onClick={submit} className="flex-1">
            {target?.mode === "edit" ? "ذخیره" : "ثبت فعالیت"}
          </Button>
          {target?.mode === "edit" ? (
            <Button
              variant="outline"
              onClick={() => {
                onDelete(target.activity.id);
                onClose();
              }}
            >
              <Trash2 className="size-4" />
              حذف
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

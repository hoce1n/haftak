import { Lightbulb, RefreshCw, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type Props = {
  quotes: string[];
  onQuotesChange: (quotes: string[]) => void;
};

export function QuoteStrip({ quotes, onQuotesChange }: Props) {
  const [index, setIndex] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIndex(quotes.length ? Math.floor(Math.random() * quotes.length) : 0);
  }, [quotes]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (!lines.length) {
      toast.error("فایل خالی بود");
      return;
    }
    onQuotesChange(lines);
    toast.success(`${lines.length} جمله‌ی انگیزشی جایگزین شد`);
  };

  return (
    <div className="flex items-center gap-2 border-y bg-card/60 px-4 py-2.5 text-sm sm:rounded-lg sm:border">
      <Lightbulb className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <p className="flex-1 text-[13px] leading-relaxed text-muted-foreground">
        {quotes[index] ?? ""}
      </p>
      <div className="no-print flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setIndex((i) => (quotes.length ? (i + 1) % quotes.length : 0))}
        >
          <RefreshCw className="size-3.5" />
          <span className="sr-only">جمله‌ی بعدی</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-3.5" />
          <span className="sr-only">آپلود فایل جملات</span>
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

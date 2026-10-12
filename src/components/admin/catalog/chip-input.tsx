"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Text input that turns entries into removable chips (tags, SEO keywords).
 * Enter or comma adds a chip; Backspace on an empty input removes the last one.
 * Pasting "a, b, c" adds three chips.
 */
export function ChipInput({
  value,
  onChange,
  placeholder = "Type and press Enter",
  max,
  lowercase = true,
  invalid,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  max?: number;
  lowercase?: boolean;
  invalid?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const full = max !== undefined && value.length >= max;

  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => (lowercase ? s.trim().toLowerCase() : s.trim()))
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) if (!next.includes(p) && (max === undefined || next.length < max)) next.push(p);
    onChange(next);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm transition focus-within:border-foreground",
        invalid && "border-sale",
      )}
    >
      {value.map((chip) => (
        <span key={chip} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
          {chip}
          <button type="button" onClick={() => onChange(value.filter((c) => c !== chip))} className="rounded-full text-muted-foreground hover:text-foreground" aria-label={`Remove ${chip}`}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        disabled={full}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          if (text.includes(",")) {
            e.preventDefault();
            add(text);
          }
        }}
        placeholder={full ? `Maximum ${max}` : value.length ? "" : placeholder}
        className="h-7 min-w-24 flex-1 bg-transparent px-1 placeholder:text-muted-foreground/70 focus:outline-none"
      />
    </div>
  );
}

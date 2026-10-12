"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  size = "md",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "h-8" : "h-11";
  const w = size === "sm" ? "w-8" : "w-11";
  return (
    <div className={cn("inline-flex items-center rounded-md border", h)}>
      <button type="button" className={cn("flex h-full items-center justify-center hover:bg-muted disabled:opacity-40", w)} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Minus className="size-3.5" />
      </button>
      <span className={cn("min-w-8 text-center text-sm font-medium tabular-nums", size === "md" && "min-w-10")}>{value}</span>
      <button type="button" className={cn("flex h-full items-center justify-center hover:bg-muted disabled:opacity-40", w)} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

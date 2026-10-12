import { cn } from "@/lib/utils";

/**
 * "54 / 60" counter shown next to a field label.
 * Green while inside the ideal range, amber when too short, red past the ideal maximum.
 */
export function CharCount({ length, ideal, min = 0 }: { length: number; ideal: number; min?: number }) {
  const tone = length > ideal ? "text-sale" : length >= min && length > 0 ? "text-success" : "text-muted-foreground";
  return (
    <span className={cn("text-xs font-normal tabular-nums", tone)}>
      {length} / {ideal}
    </span>
  );
}

/** Label text with a counter pushed to the right. Use as `<Field label={<LabelWithCount … />}>`. */
export function LabelWithCount({ label, length, ideal, min }: { label: string; length: number; ideal: number; min?: number }) {
  return (
    <span className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <CharCount length={length} ideal={ideal} min={min} />
    </span>
  );
}

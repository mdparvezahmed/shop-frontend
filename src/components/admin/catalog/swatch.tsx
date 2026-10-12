import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** "#F5F5F5" → true when dark text reads better on top of it. */
export function isLightColor(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

/**
 * Round colour sample. The swatch colour itself is product data (a real hex),
 * so it is set inline; the check mark picks black/white for contrast.
 */
export function Swatch({ hex, checked, className, title }: { hex: string; checked?: boolean; className?: string; title?: string }) {
  return (
    <span className={cn("relative inline-flex size-5 shrink-0 items-center justify-center rounded-full border", className)} style={{ backgroundColor: hex }} title={title}>
      {checked && <Check className="size-3.5" style={{ color: isLightColor(hex) ? "#111111" : "#ffffff" }} />}
    </span>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

/** Small display components shared by the storefront and admin. */

const BADGE_TONES = {
  neutral: "bg-muted text-foreground",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  danger: "bg-sale/12 text-sale",
  info: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
  accent: "bg-accent/12 text-accent",
  dark: "bg-primary text-primary-foreground",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", BADGE_TONES[tone], className)}>
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border bg-card", className)}>{children}</div>;
}

export function CardHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
      <div>
        <h3 className="font-sans text-base font-semibold">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent", className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      {icon && <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>}
      <h3 className="font-sans text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Selling price with the "was" price struck through. */
export function Price({
  price,
  compareAtPrice,
  className,
  size = "md",
}: {
  price: number;
  compareAtPrice?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const onSale = !!compareAtPrice && compareAtPrice > price;
  const text = { sm: "text-sm", md: "text-base", lg: "text-2xl" }[size];
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-semibold", text, onSale && "text-sale")}>{formatPrice(price)}</span>
      {onSale && <span className={cn("text-muted-foreground line-through", size === "lg" ? "text-base" : "text-xs")}>{formatPrice(compareAtPrice)}</span>}
    </div>
  );
}

export function RatingStars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-muted text-border"}
        />
      ))}
    </span>
  );
}

/**
 * Page links that work without JavaScript (good for crawlers).
 * `hrefFor(page)` builds the URL for each page.
 */
export function Pagination({ page, totalPages, hrefFor, onChange }: { page: number; totalPages: number; hrefFor?: (page: number) => string; onChange?: (page: number) => void }) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages.at(-1) !== "…") pages.push("…");
  }

  const item = (p: number, label: ReactNode, key: string, disabled = false, active = false) => {
    const cls = cn(
      "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm transition",
      active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
      disabled && "pointer-events-none opacity-40",
    );
    if (hrefFor) return <Link key={key} href={hrefFor(p)} className={cls} aria-current={active ? "page" : undefined} scroll>{label}</Link>;
    return <button key={key} className={cls} onClick={() => onChange?.(p)} disabled={disabled}>{label}</button>;
  };

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
      {item(page - 1, <ChevronLeft className="size-4" />, "prev", page <= 1)}
      {pages.map((p, i) => (p === "…" ? <span key={`e${i}`} className="px-1 text-muted-foreground">…</span> : item(p, p, String(p), false, p === page)))}
      {item(page + 1, <ChevronRight className="size-4" />, "next", page >= totalPages)}
    </nav>
  );
}

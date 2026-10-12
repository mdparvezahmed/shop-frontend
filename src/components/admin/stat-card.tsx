import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, change, icon, hint }: { label: string; value: ReactNode; change?: number; icon?: ReactNode; hint?: ReactNode }) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {change !== undefined ? (
        <p className={cn("mt-1 inline-flex items-center gap-0.5 text-xs font-medium", up ? "text-success" : "text-sale")}>
          {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {Math.abs(change)}% <span className="font-normal text-muted-foreground">vs previous period</span>
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { CircleCheck, Clock, MessageSquare, PackageMinus, PackageX, Star, type LucideIcon } from "lucide-react";
import { ORDER_STATUSES, StatusBadge } from "@/components/admin/status-badge";
import { Card, CardHeader, EmptyState } from "@/components/ui/misc";
import { cn, formatNumber, formatPrice } from "@/lib/utils";
import type { DashboardData } from "@/types/admin-operations";

/** Dashboard side panels: status breakdown, "needs attention", top products. */

export function StatusBreakdown({ counts }: { counts: DashboardData["statusCounts"] }) {
  const total = ORDER_STATUSES.reduce((n, s) => n + (counts[s] ?? 0), 0);
  return (
    <Card>
      <CardHeader title="Orders by status" description={`${formatNumber(total)} orders in total`} />
      <ul className="space-y-3 px-5 py-4">
        {ORDER_STATUSES.map((s) => {
          const n = counts[s] ?? 0;
          const pct = total ? Math.round((n / total) * 100) : 0;
          return (
            <li key={s}>
              <Link href={`/admin/orders?status=${s}`} className="group block">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <StatusBadge status={s} />
                  <span className="tabular-nums text-muted-foreground group-hover:text-foreground">
                    {formatNumber(n)} <span className="text-xs">({pct}%)</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function AttentionList({ attention, threshold }: { attention: DashboardData["attention"]; threshold: number }) {
  const rows: { label: string; hint: string; count: number; href: string; icon: LucideIcon; tone: string }[] = [
    { label: "Pending orders", hint: "Call and confirm these orders", count: attention.pendingOrders, href: "/admin/orders?status=PENDING", icon: Clock, tone: "text-warning bg-warning/12" },
    { label: "Reviews to moderate", hint: "Approve or reject new reviews", count: attention.pendingReviews, href: "/admin/reviews", icon: Star, tone: "text-accent bg-accent/12" },
    { label: "Unread messages", hint: "From the contact form", count: attention.unreadMessages, href: "/admin/messages", icon: MessageSquare, tone: "text-sky-600 dark:text-sky-400 bg-sky-500/12" },
    { label: "Low stock", hint: `Variants with ${threshold} or fewer left`, count: attention.lowStock, href: "/admin/inventory", icon: PackageMinus, tone: "text-warning bg-warning/12" },
    { label: "Out of stock", hint: "Customers cannot buy these", count: attention.outOfStock, href: "/admin/inventory", icon: PackageX, tone: "text-sale bg-sale/12" },
  ];
  const open = rows.filter((r) => r.count > 0);

  return (
    <Card>
      <CardHeader title="Needs attention" />
      {open.length === 0 ? (
        <EmptyState icon={<CircleCheck className="size-6" />} title="All caught up" description="Nothing is waiting for you right now." className="py-10" />
      ) : (
        <ul className="divide-y">
          {open.map((r) => (
            <li key={r.label}>
              <Link href={r.href} className="flex items-center gap-3 px-5 py-3 transition hover:bg-muted/50">
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", r.tone)}>
                  <r.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{r.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.hint}</span>
                </span>
                <span className="text-lg font-semibold tabular-nums">{formatNumber(r.count)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function TopProducts({ products, days }: { products: DashboardData["topProducts"]; days: number }) {
  return (
    <Card>
      <CardHeader title="Top products" description={days === 1 ? "Best sellers today" : `Best sellers in the last ${days} days`} />
      {products.length === 0 ? (
        <EmptyState title="No sales in this period" className="py-10" />
      ) : (
        <ul className="divide-y">
          {products.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 px-5 py-3">
              <span className="w-4 text-xs font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
              <span className="size-11 shrink-0 overflow-hidden rounded-md border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image && <img src={p.image} alt="" className="size-full object-cover" loading="lazy" />}
              </span>
              <span className="min-w-0 flex-1">
                <Link href={`/admin/products/${p.id}`} className="line-clamp-1 text-sm font-medium hover:underline">
                  {p.name}
                </Link>
                <span className="block text-xs text-muted-foreground">{formatNumber(p.quantity)} sold</span>
              </span>
              <span className="text-sm font-semibold tabular-nums">{formatPrice(p.revenue)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

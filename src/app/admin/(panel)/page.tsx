"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Receipt, ShoppingBag, UserPlus, Wallet } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { AttentionList, StatusBreakdown, TopProducts } from "@/components/admin/operations/dashboard-panels";
import { PaymentBadges } from "@/components/admin/operations/order-badges";
import { SalesChart } from "@/components/admin/operations/sales-chart";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, Skeleton } from "@/components/ui/misc";
import { cn, formatDateTime, formatNumber, formatPrice } from "@/lib/utils";
import type { DashboardData, DashboardRange, DashboardRecentOrder } from "@/types/admin-operations";

const RANGES: { value: DashboardRange; label: string }[] = [
  { value: 1, label: "Today" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 365, label: "12 months" },
];

/** Dashboard — sales KPIs, chart, order pipeline and the things that need action. */
export default function DashboardPage() {
  const router = useRouter();
  const [days, setDays] = useState<DashboardRange>(30);
  const { data, isLoading, error } = useSWR<DashboardData>(`/admin/dashboard?days=${days}`, { keepPreviousData: true });

  const columns: Column<DashboardRecentOrder>[] = [
    {
      key: "order",
      header: "Order",
      cell: (o) => (
        <div>
          <p className="font-mono text-xs font-semibold">{o.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</p>
        </div>
      ),
    },
    { key: "customer", header: "Customer", cell: (o) => <span className="whitespace-nowrap">{o.customerName}</span> },
    { key: "payment", header: "Payment", cell: (o) => <PaymentBadges method={o.paymentMethod} status={o.paymentStatus} />, hideOnMobile: true },
    { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
    { key: "total", header: "Total", align: "right", cell: (o) => <span className="font-medium tabular-nums">{formatPrice(o.total)}</span> },
  ];

  const k = data?.kpis;
  const period = days === 1 ? "today" : days === 365 ? "in the last 12 months" : `in the last ${days} days`;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`How the store is doing ${period}.`}
        actions={
          <div className="scrollbar-none flex max-w-full overflow-x-auto rounded-lg border bg-card p-1" role="tablist" aria-label="Date range">
            {RANGES.map((r) => (
              <button
                key={r.value}
                role="tab"
                aria-selected={days === r.value}
                onClick={() => setDays(r.value)}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition",
                  days === r.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {error && !data && (
        <Card className="mb-6 p-5 text-sm text-sale">Could not load the dashboard. Please refresh the page.</Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {k ? (
          <>
            <StatCard label="Revenue" value={formatPrice(k.revenue.value)} change={k.revenue.change} icon={<Wallet className="size-4" />} />
            <StatCard label="Orders" value={formatNumber(k.orders.value)} change={k.orders.change} icon={<ShoppingBag className="size-4" />} />
            <StatCard label="Average order" value={formatPrice(k.averageOrder.value)} change={k.averageOrder.change} icon={<Receipt className="size-4" />} />
            <StatCard label="New customers" value={formatNumber(k.newCustomers.value)} change={k.newCustomers.change} icon={<UserPlus className="size-4" />} />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[118px] rounded-xl" />)
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader
              title="Sales"
              description={days > 90 ? "Revenue and orders per month (cancelled & returned excluded)" : "Revenue and orders per day (cancelled & returned excluded)"}
            />
            <div className={cn("px-2 py-4 sm:px-4", isLoading && "opacity-60")}>
              {data ? <SalesChart data={data.sales} /> : <Skeleton className="h-72 w-full" />}
            </div>
          </Card>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Recent orders</h2>
              <ButtonLink href="/admin/orders" variant="ghost" size="sm">View all</ButtonLink>
            </div>
            <DataTable
              rows={data?.recentOrders}
              columns={columns}
              loading={!data}
              onRowClick={(o) => router.push(`/admin/orders/${o.id}`)}
              empty={{ title: "No orders yet", description: "New orders will show up here." }}
            />
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          {data ? (
            <>
              <AttentionList attention={data.attention} threshold={data.stock.threshold} />
              <StatusBreakdown counts={data.statusCounts} />
              <TopProducts products={data.topProducts} days={days} />
            </>
          ) : (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
          )}
        </div>
      </div>
    </>
  );
}

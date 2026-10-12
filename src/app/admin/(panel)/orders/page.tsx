"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterTabs, ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { ORDER_STATUSES, PAYMENT_STATUSES, StatusBadge } from "@/components/admin/status-badge";
import { ORDER_STATUS_LABEL } from "@/components/admin/operations/helpers";
import { PaymentBadges } from "@/components/admin/operations/order-badges";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { useAdminList } from "@/hooks/use-admin-list";
import { formatDateTime, formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/types";
import type { AdminOrderRow, OrderStatusCounts } from "@/types/admin-operations";

/** Orders — status tabs, payment & date filters, search. Click a row to open the order. */
export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersList />
    </Suspense>
  );
}

/** Dates are picked in Bangladesh time; the API compares full timestamps. */
const dayStart = (d: string) => (d ? `${d}T00:00:00+06:00` : undefined);
const dayEnd = (d: string) => (d ? `${d}T23:59:59+06:00` : undefined);

function OrdersList() {
  const router = useRouter();
  const params = useSearchParams();
  const initialStatus = (ORDER_STATUSES as readonly string[]).includes(params.get("status") ?? "") ? (params.get("status") as OrderStatus) : "";

  const list = useAdminList<AdminOrderRow, { statusCounts: OrderStatusCounts }>("/admin/orders", {
    q: params.get("q") ?? "",
    status: initialStatus,
    paymentStatus: "",
    paymentMethod: "",
  });
  const [dates, setDates] = useState({ from: "", to: "" });

  const counts = list.extra?.statusCounts ?? {};
  const allCount = ORDER_STATUSES.reduce((n, s) => n + (counts[s] ?? 0), 0);
  const hasFilters = !!(list.filters.paymentStatus || list.filters.paymentMethod || dates.from || dates.to);

  const setDate = (key: "from" | "to", value: string) => {
    setDates((d) => ({ ...d, [key]: value }));
    list.setFilter(key, key === "from" ? dayStart(value) : dayEnd(value));
  };

  const clearFilters = () => {
    list.setFilter("paymentStatus", "");
    list.setFilter("paymentMethod", "");
    setDate("from", "");
    setDate("to", "");
  };

  const columns: Column<AdminOrderRow>[] = [
    {
      key: "order",
      header: "Order",
      cell: (o) => (
        <div>
          <p className="font-mono text-xs font-semibold whitespace-nowrap">{o.orderNumber}</p>
          <p className="text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(o.createdAt)}</p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (o) => (
        <div>
          <p className="font-medium whitespace-nowrap">{o.customerName}</p>
          <p className="text-xs whitespace-nowrap text-muted-foreground">
            {o.customerPhone} · {o.district}
          </p>
        </div>
      ),
    },
    { key: "items", header: "Items", align: "center", cell: (o) => o.itemCount, hideOnMobile: true },
    { key: "total", header: "Total", align: "right", cell: (o) => <span className="font-medium tabular-nums">{formatPrice(o.total)}</span> },
    { key: "payment", header: "Payment", cell: (o) => <PaymentBadges method={o.paymentMethod} status={o.paymentStatus} />, hideOnMobile: true },
    { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
    {
      key: "courier",
      header: "Courier",
      hideOnMobile: true,
      cell: (o) =>
        o.consignmentId ? (
          <div>
            <p className="font-mono text-xs">{o.consignmentId}</p>
            {o.courierStatus && <p className="text-xs text-muted-foreground capitalize">{o.courierStatus.replace(/[_-]/g, " ").toLowerCase()}</p>}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader title="Orders" description="Confirm, pack and ship customer orders." />

      <FilterTabs<OrderStatus>
        value={(list.filters.status as OrderStatus | "") ?? ""}
        onChange={(v) => list.setFilter("status", v)}
        options={[{ value: "", label: "All", count: allCount }, ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s], count: counts[s] ?? 0 }))]}
      />

      <ListToolbar search={String(list.filters.q ?? "")} onSearch={(q) => list.setFilter("q", q)} placeholder="Order no, name, phone or consignment…">
        <Select
          aria-label="Payment status"
          value={String(list.filters.paymentStatus ?? "")}
          onChange={(e) => list.setFilter("paymentStatus", e.target.value)}
          className="h-10 w-auto min-w-36 bg-card"
        >
          <option value="">Any payment</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Payment method"
          value={String(list.filters.paymentMethod ?? "")}
          onChange={(e) => list.setFilter("paymentMethod", e.target.value)}
          className="h-10 w-auto min-w-32 bg-card"
        >
          <option value="">Any method</option>
          <option value="COD">Cash on delivery</option>
          <option value="SSLCOMMERZ">Online</option>
        </Select>
        <div className="flex items-center gap-1.5">
          <Input type="date" aria-label="From date" value={dates.from} max={dates.to || undefined} onChange={(e) => setDate("from", e.target.value)} className="w-auto bg-card" />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" aria-label="To date" value={dates.to} min={dates.from || undefined} onChange={(e) => setDate("to", e.target.value)} className="w-auto bg-card" />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-3.5" /> Clear
          </Button>
        )}
      </ListToolbar>

      <DataTable
        rows={list.items}
        columns={columns}
        loading={list.isLoading}
        meta={list.meta}
        onPageChange={list.setPage}
        onRowClick={(o) => router.push(`/admin/orders/${o.id}`)}
        empty={{ title: "No orders found", description: hasFilters || list.filters.q || list.filters.status ? "Try a different filter or search." : "New orders will show up here." }}
      />
    </>
  );
}

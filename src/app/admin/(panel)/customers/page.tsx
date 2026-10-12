"use client";

import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterTabs, ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { useAdminList } from "@/hooks/use-admin-list";
import { formatDate, formatNumber, formatPrice, initials } from "@/lib/utils";
import type { CustomerRow } from "@/types/admin-operations";

/** Customers — everyone who registered on the storefront. */
export default function CustomersPage() {
  const router = useRouter();
  const list = useAdminList<CustomerRow>("/admin/customers", { q: "", status: "" });

  const columns: Column<CustomerRow>[] = [
    {
      key: "name",
      header: "Customer",
      cell: (c) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{initials(c.name)}</span>
          <div className="min-w-0">
            <p className="font-medium whitespace-nowrap">{c.name}</p>
            <p className="truncate text-xs text-muted-foreground">{[c.phone, c.email].filter(Boolean).join(" · ") || "—"}</p>
          </div>
        </div>
      ),
    },
    { key: "orders", header: "Orders", align: "center", cell: (c) => formatNumber(c.orderCount) },
    { key: "spent", header: "Total spent", align: "right", cell: (c) => <span className="font-medium tabular-nums">{formatPrice(c.totalSpent)}</span> },
    { key: "joined", header: "Joined", cell: (c) => <span className="whitespace-nowrap">{formatDate(c.createdAt)}</span>, hideOnMobile: true },
    { key: "login", header: "Last login", cell: (c) => (c.lastLoginAt ? formatDate(c.lastLoginAt) : "—"), hideOnMobile: true },
    { key: "status", header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
  ];

  return (
    <>
      <PageHeader title="Customers" description="People with an account on your store. Guest orders are not listed here." />
      <FilterTabs<"ACTIVE" | "BLOCKED">
        value={(list.filters.status as "ACTIVE" | "BLOCKED" | "") ?? ""}
        onChange={(v) => list.setFilter("status", v)}
        options={[
          { value: "", label: "All" },
          { value: "ACTIVE", label: "Active" },
          { value: "BLOCKED", label: "Blocked" },
        ]}
      />
      <ListToolbar search={String(list.filters.q ?? "")} onSearch={(q) => list.setFilter("q", q)} placeholder="Search name, email or phone…" />
      <DataTable
        rows={list.items}
        columns={columns}
        loading={list.isLoading}
        meta={list.meta}
        onPageChange={list.setPage}
        onRowClick={(c) => router.push(`/admin/customers/${c.id}`)}
        empty={{ title: "No customers found", description: "Customers appear here after they create an account." }}
      />
    </>
  );
}

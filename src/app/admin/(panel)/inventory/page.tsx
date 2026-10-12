"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { AlertTriangle, Boxes, History, ImageOff, PackageX, SlidersHorizontal } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterTabs, ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { StockAdjustModal, StockHistoryModal } from "@/components/admin/catalog/inventory-modals";
import { Swatch } from "@/components/admin/catalog/swatch";
import { Button } from "@/components/ui/button";
import { useAdminList } from "@/hooks/use-admin-list";
import { cn, formatNumber } from "@/lib/utils";
import type { InventoryRow, InventorySummary } from "@/types/admin-catalog";

/**
 * Inventory — stock per variant (size × colour). Lowest stock first,
 * so what needs restocking is always at the top.
 */
export default function InventoryPage() {
  const list = useAdminList<InventoryRow>("/admin/inventory", { q: "", stock: "" }, { limit: 30 });
  const { data: summary, mutate: reloadSummary } = useSWR<InventorySummary>("/admin/inventory/summary");
  const [adjusting, setAdjusting] = useState<InventoryRow | null>(null);
  const [history, setHistory] = useState<InventoryRow | null>(null);
  const threshold = summary?.threshold ?? 5;

  const columns: Column<InventoryRow>[] = [
    {
      key: "product",
      header: "Product",
      cell: (r) => (
        <div className="flex min-w-48 items-center gap-3">
          <div className="flex h-12 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {r.product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.product.image} alt="" className="size-full object-cover" loading="lazy" />
            ) : (
              <ImageOff className="size-4 text-muted-foreground" />
            )}
          </div>
          <Link href={`/admin/products/${r.product.id}`} className="line-clamp-2 font-medium hover:underline">
            {r.product.name}
          </Link>
        </div>
      ),
    },
    { key: "size", header: "Size", cell: (r) => r.size ?? "—" },
    {
      key: "color",
      header: "Colour",
      cell: (r) =>
        r.color ? (
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <Swatch hex={r.color.hex} className="size-4" /> {r.color.name}
          </span>
        ) : (
          "—"
        ),
    },
    { key: "sku", header: "SKU", hideOnMobile: true, cell: (r) => <span className="font-mono text-xs">{r.sku}</span> },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      cell: (r) => (
        <span className={cn("font-semibold tabular-nums", r.stock <= 0 ? "text-sale" : r.stock <= threshold && "text-warning")}>
          {r.stock <= 0 ? "Out" : r.stock}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="outline" onClick={() => setAdjusting(r)}>
            <SlidersHorizontal className="size-3.5" /> Adjust
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setHistory(r)} aria-label="History" title="History">
            <History className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Inventory" description="Stock for every size and colour. Restock, correct counts and see the full history." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Units in stock" value={summary ? formatNumber(summary.totalUnits) : "—"} icon={<Boxes className="size-4" />} hint="Across active products" />
        <StatCard label="Low stock" value={summary?.lowStock ?? "—"} icon={<AlertTriangle className="size-4" />} hint={`Variants with ${threshold} or fewer left`} />
        <StatCard label="Out of stock" value={summary?.outOfStock ?? "—"} icon={<PackageX className="size-4" />} hint="Variants customers cannot buy" />
      </div>

      <FilterTabs<"low" | "out">
        value={(list.filters.stock as "low" | "out" | "") ?? ""}
        onChange={(v) => list.setFilter("stock", v)}
        options={[
          { value: "", label: "All" },
          { value: "low", label: "Low stock", count: summary?.lowStock },
          { value: "out", label: "Out of stock", count: summary?.outOfStock },
        ]}
      />
      <ListToolbar search={String(list.filters.q ?? "")} onSearch={(q) => list.setFilter("q", q)} placeholder="Search product or SKU…" />

      <DataTable
        rows={list.items}
        columns={columns}
        loading={list.isLoading}
        meta={list.meta}
        onPageChange={list.setPage}
        empty={{
          title: list.filters.stock === "out" ? "Nothing is out of stock" : list.filters.stock === "low" ? "No low-stock variants" : "No variants found",
          description: list.filters.stock ? "Nice — everything is well stocked." : "Products you add will show their variants here.",
        }}
      />

      <StockAdjustModal
        row={adjusting}
        onClose={() => setAdjusting(null)}
        onSaved={() => {
          setAdjusting(null);
          list.reload();
          reloadSummary();
        }}
      />
      <StockHistoryModal row={history} onClose={() => setHistory(null)} />
    </>
  );
}

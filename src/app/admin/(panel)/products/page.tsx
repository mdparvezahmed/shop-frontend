"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { Archive, CheckCircle2, FileEdit, ImageOff, Plus, Star, StarOff, Trash2, X } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterTabs, ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { flattenMenus, indentedLabel } from "@/components/admin/catalog/menu-tree";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useAdminList } from "@/hooks/use-admin-list";
import { api, errorMessage } from "@/lib/api/client";
import { cn, formatPrice } from "@/lib/utils";
import type { AdminMenu, AdminProductListExtra, AdminProductRow, InventorySummary, ProductStatus } from "@/types/admin-catalog";

type BulkAction = "activate" | "draft" | "archive" | "feature" | "unfeature" | "delete";

const BULK_DONE: Record<BulkAction, string> = {
  activate: "activated",
  draft: "moved to draft",
  archive: "archived",
  feature: "featured",
  unfeature: "unfeatured",
  delete: "deleted",
};

/**
 * Products — filterable list with bulk actions. Rows open the editor.
 */
export default function ProductsPage() {
  const router = useRouter();
  const list = useAdminList<AdminProductRow, AdminProductListExtra>("/admin/products", { q: "", status: "", stock: "", menuId: "", sort: "newest" });
  const { data: menus } = useSWR<AdminMenu[]>("/admin/menus");
  const { data: summary } = useSWR<InventorySummary>("/admin/inventory/summary");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState<BulkAction | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const threshold = summary?.threshold ?? 5;
  const flatMenus = useMemo(() => flattenMenus(menus), [menus]);
  const counts = list.extra?.statusCounts ?? {};
  const total = Object.values(counts).reduce((s, n) => s + (n ?? 0), 0);

  const filter = (name: string, value: string) => {
    list.setFilter(name, value);
    setSelected([]);
  };

  const runBulk = async (action: BulkAction) => {
    setBusy(action);
    try {
      await api.post("/admin/products/bulk", { ids: selected, action });
      toast.success(
        action === "delete"
          ? `${selected.length} product(s) deleted — any with orders were archived instead`
          : `${selected.length} product(s) ${BULK_DONE[action]}`,
      );
      setSelected([]);
      setConfirmDelete(false);
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  /** Red when sold out; amber when stock averages at or below the low-stock threshold per variant. */
  const stockTone = (p: AdminProductRow) =>
    p.stock <= 0 ? "text-sale" : p.stock <= threshold * Math.max(1, p.variantCount) ? "text-warning" : "";

  const columns: Column<AdminProductRow>[] = [
    {
      key: "product",
      header: "Product",
      cell: (p) => (
        <div className="flex min-w-56 items-center gap-3">
          <div className="flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {p.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image} alt="" className="size-full object-cover" loading="lazy" />
            ) : (
              <ImageOff className="size-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-medium">
              <span className="line-clamp-2">{p.name}</span>
              {p.isFeatured && <Star className="size-3.5 shrink-0 fill-current text-warning" aria-label="Featured" />}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      cell: (p) => (
        <div className="whitespace-nowrap">
          <p className="font-medium">{formatPrice(p.price)}</p>
          {p.compareAtPrice && p.compareAtPrice > p.price && <p className="text-xs text-muted-foreground line-through">{formatPrice(p.compareAtPrice)}</p>}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      cell: (p) => (
        <div className="whitespace-nowrap">
          <p className={cn("font-medium tabular-nums", stockTone(p))}>{p.stock <= 0 ? "Out of stock" : p.stock}</p>
          <p className="text-xs text-muted-foreground">{p.variantCount} variant{p.variantCount === 1 ? "" : "s"}</p>
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
    {
      key: "menus",
      header: "Menus",
      hideOnMobile: true,
      cell: (p) => (
        <div className="flex max-w-60 flex-wrap gap-1">
          {p.menus.slice(0, 2).map((m) => (
            <Badge key={m.id}>{m.name}</Badge>
          ))}
          {p.menus.length > 2 && <Badge>+{p.menus.length - 2}</Badge>}
          {!p.menus.length && <span className="text-xs text-sale">No menu</span>}
        </div>
      ),
    },
    { key: "sold", header: "Sold", align: "right", hideOnMobile: true, cell: (p) => <span className="tabular-nums">{p.soldCount}</span> },
  ];

  const bulkButton = (action: BulkAction, label: string, icon: React.ReactNode) => (
    <Button size="sm" variant="outline" onClick={() => (action === "delete" ? setConfirmDelete(true) : runBulk(action))} loading={busy === action} disabled={!!busy}>
      {icon} {label}
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Products"
        description="Everything you sell. Click a product to edit it."
        actions={
          <ButtonLink href="/admin/products/new">
            <Plus className="size-4" /> Add product
          </ButtonLink>
        }
      />

      <FilterTabs<ProductStatus>
        value={(list.filters.status as ProductStatus | "") ?? ""}
        onChange={(v) => filter("status", v)}
        options={[
          { value: "", label: "All", count: total },
          { value: "ACTIVE", label: "Active", count: counts.ACTIVE ?? 0 },
          { value: "DRAFT", label: "Draft", count: counts.DRAFT ?? 0 },
          { value: "ARCHIVED", label: "Archived", count: counts.ARCHIVED ?? 0 },
        ]}
      />

      <ListToolbar search={String(list.filters.q ?? "")} onSearch={(q) => filter("q", q)} placeholder="Search name or SKU…">
        <Select value={String(list.filters.stock ?? "")} onChange={(e) => filter("stock", e.target.value)} className="w-36" aria-label="Stock">
          <option value="">Any stock</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </Select>
        <Select value={String(list.filters.menuId ?? "")} onChange={(e) => filter("menuId", e.target.value)} className="w-48" aria-label="Menu">
          <option value="">All menus</option>
          {flatMenus.map((f) => (
            <option key={f.menu.id} value={f.menu.id}>{indentedLabel(f)}</option>
          ))}
        </Select>
        <Select value={String(list.filters.sort ?? "newest")} onChange={(e) => filter("sort", e.target.value)} className="w-40" aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="best-selling">Best selling</option>
        </Select>
      </ListToolbar>

      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border bg-card px-4 py-2.5">
          <span className="mr-1 text-sm font-medium">{selected.length} selected</span>
          {bulkButton("activate", "Activate", <CheckCircle2 className="size-3.5" />)}
          {bulkButton("draft", "Draft", <FileEdit className="size-3.5" />)}
          {bulkButton("archive", "Archive", <Archive className="size-3.5" />)}
          {bulkButton("feature", "Feature", <Star className="size-3.5" />)}
          {bulkButton("unfeature", "Unfeature", <StarOff className="size-3.5" />)}
          {bulkButton("delete", "Delete", <Trash2 className="size-3.5 text-sale" />)}
          <Button size="sm" variant="ghost" onClick={() => setSelected([])} className="ml-auto">
            <X className="size-3.5" /> Clear
          </Button>
        </div>
      )}

      <DataTable
        rows={list.items}
        columns={columns}
        loading={list.isLoading}
        meta={list.meta}
        onPageChange={(p) => {
          list.setPage(p);
          setSelected([]);
        }}
        onRowClick={(p) => router.push(`/admin/products/${p.id}`)}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        empty={{
          title: list.filters.q || list.filters.status || list.filters.stock || list.filters.menuId ? "No products match these filters" : "No products yet",
          description: "Add your first t-shirt with sizes, colours and photos.",
          action: <ButtonLink href="/admin/products/new">Add product</ButtonLink>,
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => runBulk("delete")}
        loading={busy === "delete"}
        title={`Delete ${selected.length} product(s)?`}
        message="Products that were never ordered are deleted permanently. Products with orders are archived instead so your order history stays complete."
      />
    </>
  );
}

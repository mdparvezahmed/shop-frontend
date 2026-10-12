"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useAdminList } from "@/hooks/use-admin-list";
import { api, errorMessage } from "@/lib/api/client";
import { formatDate, formatPrice } from "@/lib/utils";
import { CouponForm, type Coupon } from "./coupon-form";

/**
 * Coupons — list + create/edit in a modal.
 * This page is the reference pattern for simple admin CRUD screens.
 */
export default function CouponsPage() {
  const list = useAdminList<Coupon>("/admin/coupons", { q: "" });
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/admin/coupons/${deleting.id}`);
      toast.success("Coupon deleted");
      setDeleting(null);
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const describe = (c: Coupon) =>
    c.type === "PERCENT" ? `${c.value}% off${c.maxDiscount ? ` (max ${formatPrice(c.maxDiscount)})` : ""}` : c.type === "FIXED" ? `${formatPrice(c.value)} off` : "Free delivery";

  const status = (c: Coupon) => {
    const now = Date.now();
    if (!c.isActive) return <Badge>Disabled</Badge>;
    if (c.endsAt && new Date(c.endsAt).getTime() < now) return <Badge tone="danger">Expired</Badge>;
    if (c.startsAt && new Date(c.startsAt).getTime() > now) return <Badge tone="info">Scheduled</Badge>;
    if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return <Badge tone="warning">Used up</Badge>;
    return <Badge tone="success">Active</Badge>;
  };

  const columns: Column<Coupon>[] = [
    {
      key: "code",
      header: "Code",
      cell: (c) => (
        <div>
          <p className="font-mono font-semibold">{c.code}</p>
          {c.description && <p className="max-w-64 truncate text-xs text-muted-foreground">{c.description}</p>}
        </div>
      ),
    },
    { key: "discount", header: "Discount", cell: describe },
    { key: "min", header: "Min. order", cell: (c) => (c.minOrderAmount ? formatPrice(c.minOrderAmount) : "—"), hideOnMobile: true },
    { key: "used", header: "Used", cell: (c) => `${c.usedCount}${c.usageLimit !== null ? ` / ${c.usageLimit}` : ""}`, hideOnMobile: true },
    { key: "ends", header: "Ends", cell: (c) => (c.endsAt ? formatDate(c.endsAt) : "No end"), hideOnMobile: true },
    { key: "status", header: "Status", cell: status },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <Button size="icon-sm" variant="ghost" onClick={() => setEditing(c)} aria-label="Edit"><Pencil className="size-4" /></Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setDeleting(c)} aria-label="Delete"><Trash2 className="size-4 text-sale" /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Discount codes customers can apply in the cart."
        actions={<Button onClick={() => setEditing("new")}><Plus className="size-4" /> New coupon</Button>}
      />
      <ListToolbar search={String(list.filters.q ?? "")} onSearch={(q) => list.setFilter("q", q)} placeholder="Search by code…" />
      <DataTable
        rows={list.items}
        columns={columns}
        loading={list.isLoading}
        meta={list.meta}
        onPageChange={list.setPage}
        empty={{ title: "No coupons yet", description: "Create a code like WELCOME10 to reward new customers.", action: <Button onClick={() => setEditing("new")}>Create coupon</Button> }}
      />

      <CouponForm
        coupon={editing === "new" ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          list.reload();
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title={`Delete ${deleting?.code}?`}
        message="Customers will no longer be able to use this code. Orders that already used it are not affected."
      />
    </>
  );
}

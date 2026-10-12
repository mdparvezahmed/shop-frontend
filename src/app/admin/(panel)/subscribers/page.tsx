"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Download, Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { downloadText, toCsv } from "@/components/admin/operations/helpers";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useAdminList } from "@/hooks/use-admin-list";
import { api, errorMessage } from "@/lib/api/client";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Subscriber } from "@/types/admin-operations";

/** Loads every subscriber matching the search, 100 at a time. */
async function fetchAll(q: string) {
  const all: Subscriber[] = [];
  for (let page = 1; page <= 200; page++) {
    const { items, meta } = await api.paged<Subscriber>("/admin/subscribers", { q, page, limit: 100 });
    all.push(...items);
    if (!meta || page >= meta.totalPages) break;
  }
  return all;
}

/** Newsletter subscribers — search, delete, copy or export the list. */
export default function SubscribersPage() {
  const list = useAdminList<Subscriber>("/admin/subscribers", { q: "" });
  const [deleting, setDeleting] = useState<Subscriber | null>(null);
  const [busy, setBusy] = useState<"delete" | "copy" | "csv" | null>(null);
  const q = String(list.filters.q ?? "");

  const copyAll = async () => {
    setBusy("copy");
    try {
      const all = await fetchAll(q);
      await navigator.clipboard.writeText(all.map((s) => s.email).join(", "));
      toast.success(`${all.length} email${all.length === 1 ? "" : "s"} copied`);
    } catch (e) {
      toast.error(errorMessage(e, "Could not copy — your browser blocked clipboard access"));
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = async () => {
    setBusy("csv");
    try {
      const all = await fetchAll(q);
      downloadText(`subscribers-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([["Email", "Subscribed at"], ...all.map((s) => [s.email, formatDateTime(s.createdAt)])]));
      toast.success(`Exported ${all.length} subscriber${all.length === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy("delete");
    try {
      await api.delete(`/admin/subscribers/${deleting.id}`);
      toast.success("Subscriber removed");
      setDeleting(null);
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const columns: Column<Subscriber>[] = [
    { key: "email", header: "Email", cell: (s) => <a href={`mailto:${s.email}`} className="font-medium break-all hover:underline">{s.email}</a> },
    { key: "date", header: "Subscribed", cell: (s) => <span className="whitespace-nowrap">{formatDate(s.createdAt)}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (s) => (
        <Button size="icon-sm" variant="ghost" onClick={() => setDeleting(s)} aria-label="Remove"><Trash2 className="size-4 text-sale" /></Button>
      ),
    },
  ];

  const total = list.meta?.total ?? 0;

  return (
    <>
      <PageHeader
        title="Subscribers"
        description={`${total} newsletter subscriber${total === 1 ? "" : "s"}. Export the list to your email tool to send campaigns.`}
        actions={
          <>
            <Button variant="outline" onClick={copyAll} loading={busy === "copy"} disabled={!total}>
              {busy !== "copy" && <Copy className="size-4" />} Copy all emails
            </Button>
            <Button variant="outline" onClick={exportCsv} loading={busy === "csv"} disabled={!total}>
              {busy !== "csv" && <Download className="size-4" />} Export CSV
            </Button>
          </>
        }
      />
      <ListToolbar search={q} onSearch={(v) => list.setFilter("q", v)} placeholder="Search email…" />
      <DataTable
        rows={list.items}
        columns={columns}
        loading={list.isLoading}
        meta={list.meta}
        onPageChange={list.setPage}
        empty={{ title: q ? "No subscriber matches" : "No subscribers yet", description: q ? "Try a different search." : "People who sign up in the footer appear here." }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy === "delete"}
        confirmText="Remove"
        title="Remove subscriber?"
        message={`${deleting?.email} will be removed from the newsletter list.`}
      />
    </>
  );
}

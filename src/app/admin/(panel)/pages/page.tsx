"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/overlay";
import { api, errorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import type { CmsPage } from "@/types/admin-operations";

/** Content pages — About, policies, FAQ — shown at /pages/{slug}. */
export default function PagesPage() {
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR<CmsPage[]>("/admin/pages");
  const [q, setQ] = useState("");
  const [deleting, setDeleting] = useState<CmsPage | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data?.filter((p) => !needle || p.title.toLowerCase().includes(needle) || p.slug.includes(needle));
  }, [data, q]);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/admin/pages/${deleting.id}`);
      toast.success("Page deleted");
      setDeleting(null);
      mutate();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<CmsPage>[] = [
    {
      key: "title",
      header: "Page",
      cell: (p) => (
        <div>
          <p className="font-medium">{p.title}</p>
          <p className="font-mono text-xs text-muted-foreground">/pages/{p.slug}</p>
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (p) => (p.isPublished ? <Badge tone="success">Published</Badge> : <Badge>Draft</Badge>) },
    { key: "footer", header: "Footer link", cell: (p) => (p.showInFooter ? "Yes" : "—"), hideOnMobile: true },
    { key: "updated", header: "Updated", cell: (p) => formatDate(p.updatedAt), hideOnMobile: true },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (p) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <a href={`/pages/${p.slug}`} target="_blank" rel="noreferrer" className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted" aria-label="View on store">
            <ExternalLink className="size-4" />
          </a>
          <ButtonLink href={`/admin/pages/${p.id}`} size="icon-sm" variant="ghost" aria-label="Edit"><Pencil className="size-4" /></ButtonLink>
          <Button size="icon-sm" variant="ghost" onClick={() => setDeleting(p)} aria-label="Delete"><Trash2 className="size-4 text-sale" /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Pages"
        description="About us, policies, FAQ and other content pages."
        actions={<ButtonLink href="/admin/pages/new"><Plus className="size-4" /> New page</ButtonLink>}
      />
      <ListToolbar search={q} onSearch={setQ} placeholder="Search pages…" />
      <DataTable
        rows={rows}
        columns={columns}
        loading={isLoading}
        onRowClick={(p) => router.push(`/admin/pages/${p.id}`)}
        empty={{
          title: q ? "No pages match" : "No pages yet",
          description: q ? "Try a different search." : "Start with About Us, Privacy Policy and Refund Policy.",
          action: q ? undefined : <ButtonLink href="/admin/pages/new">Create page</ButtonLink>,
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title={`Delete “${deleting?.title}”?`}
        message="The page and its footer link are removed. Links to it will show “page not found”."
      />
    </>
  );
}

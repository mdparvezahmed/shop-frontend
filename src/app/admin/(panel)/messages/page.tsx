"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { isForbidden } from "@/components/admin/operations/helpers";
import { MessageModal } from "@/components/admin/operations/message-modal";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useAdminList } from "@/hooks/use-admin-list";
import { api, errorMessage } from "@/lib/api/client";
import { cn, formatDateTime } from "@/lib/utils";
import type { ContactMessage } from "@/types/admin-operations";

/** Contact form inbox. Opening a message marks it read. */
export default function MessagesPage() {
  const list = useAdminList<ContactMessage, { unread: number }>("/admin/messages", { q: "" });
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState<ContactMessage | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    list.reload();
    mutate("/admin/dashboard/badges");
  };

  const setRead = async (m: ContactMessage, isRead: boolean) => {
    try {
      await api.patch(`/admin/messages/${m.id}`, { isRead });
      refresh();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const openMessage = (m: ContactMessage) => {
    setOpen(m);
    if (!m.isRead) setRead(m, true);
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/admin/messages/${deleting.id}`);
      toast.success("Message deleted");
      setDeleting(null);
      setOpen(null);
      refresh();
    } catch (e) {
      toast.error(isForbidden(e) ? "Only a manager or the owner can delete messages." : errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<ContactMessage>[] = [
    {
      key: "from",
      header: "From",
      cell: (m) => (
        <div className="flex items-start gap-2.5">
          <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", m.isRead ? "bg-transparent" : "bg-accent")} aria-label={m.isRead ? undefined : "Unread"} />
          <div className="min-w-0">
            <p className={cn("whitespace-nowrap", !m.isRead && "font-semibold")}>{m.name}</p>
            <p className="truncate text-xs text-muted-foreground">{m.email ?? m.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: "message",
      header: "Message",
      cell: (m) => (
        <div className="max-w-md min-w-48">
          <p className={cn("truncate", !m.isRead && "font-semibold")}>{m.subject || "No subject"}</p>
          <p className="truncate text-xs text-muted-foreground">{m.message}</p>
        </div>
      ),
    },
    { key: "date", header: "Received", cell: (m) => <span className="text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(m.createdAt)}</span>, hideOnMobile: true },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (m) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button size="icon-sm" variant="ghost" onClick={() => setDeleting(m)} aria-label="Delete"><Trash2 className="size-4 text-sale" /></Button>
        </div>
      ),
    },
  ];

  const unread = list.extra?.unread ?? 0;

  return (
    <>
      <PageHeader title="Messages" description={unread ? `${unread} unread message${unread === 1 ? "" : "s"} from the contact form.` : "Messages sent through the contact form."} />
      <ListToolbar search={String(list.filters.q ?? "")} onSearch={(q) => list.setFilter("q", q)} placeholder="Search name or message…" />
      <DataTable
        rows={list.items}
        columns={columns}
        loading={list.isLoading}
        meta={list.meta}
        onPageChange={list.setPage}
        onRowClick={openMessage}
        empty={{ title: "No messages", description: "When customers use the contact form, their messages land here." }}
      />

      <MessageModal
        message={open}
        onClose={() => setOpen(null)}
        onMarkUnread={(m) => {
          setRead(m, false);
          setOpen(null);
          toast.success("Marked as unread");
        }}
        onDelete={(m) => {
          setOpen(null);
          setDeleting(m);
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title="Delete this message?"
        message={`The message from ${deleting?.name} will be permanently deleted.`}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Globe, Lock } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Textarea } from "@/components/ui/form";
import { Badge, Card, CardHeader } from "@/components/ui/misc";
import { api, errorMessage } from "@/lib/api/client";
import { cn, formatDateTime } from "@/lib/utils";
import type { AdminOrder } from "@/types/admin-operations";

/**
 * Order history, newest first. Internal notes (hidden from the customer) are
 * drawn with a dashed outline and a lock. The form adds a note (POST /notes).
 */
export function OrderTimeline({ order, onChange }: { order: AdminOrder; onChange: (order: AdminOrder) => void }) {
  const [note, setNote] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const entries = [...order.history].reverse();

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      onChange(await api.post<AdminOrder>(`/admin/orders/${order.id}/notes`, { note: note.trim(), isPublic }));
      setNote("");
      setIsPublic(false);
      toast.success(isPublic ? "Update posted to the tracking page" : "Internal note added");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Timeline" description="Everything that happened to this order." />
      <form onSubmit={add} className="space-y-2 border-b px-5 py-4">
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Add a note — e.g. Called customer, will receive on Friday" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Checkbox checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} label="Show to customer on the tracking page" />
          <Button type="submit" size="sm" loading={saving} disabled={!note.trim()}>Add note</Button>
        </div>
      </form>
      <ol className="px-5 py-4">
        {entries.map((h, i) => (
          <li key={h.id} className="relative flex gap-3 pb-5 last:pb-0">
            {i < entries.length - 1 && <span className="absolute top-5 bottom-0 left-[7px] w-px bg-border" aria-hidden />}
            <span
              className={cn(
                "relative mt-1 size-[15px] shrink-0 rounded-full border-2",
                h.isPublic ? (i === 0 ? "border-primary bg-primary" : "border-primary bg-card") : "border-dashed border-warning bg-card",
              )}
              aria-hidden
            />
            <div className={cn("min-w-0 flex-1", !h.isPublic && "rounded-md border border-dashed border-warning/50 bg-warning/5 px-3 py-2")}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{h.title}</p>
                {h.status && <StatusBadge status={h.status} />}
                {h.isPublic ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground" title="Visible on the customer's tracking page">
                    <Globe className="size-3" /> Customer can see
                  </span>
                ) : (
                  <Badge tone="warning"><Lock className="size-3" /> Internal</Badge>
                )}
              </div>
              {h.note && <p className="mt-1 text-sm whitespace-pre-line text-foreground/90">{h.note}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(h.createdAt)}
                {h.actorName && <> · {h.actorName}</>}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

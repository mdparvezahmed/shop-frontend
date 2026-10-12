"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Field, Switch, Textarea } from "@/components/ui/form";
import { Card, CardHeader } from "@/components/ui/misc";
import { api, errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";
import type { AdminOrder } from "@/types/admin-operations";
import { ORDER_STATUS_HINT, ORDER_STATUS_LABEL } from "./helpers";

const DANGER: OrderStatus[] = ["CANCELLED", "RETURNED"];

/** Moves the order to one of `allowedTransitions` (POST /admin/orders/:id/status). */
export function OrderStatusCard({ order, onChange }: { order: AdminOrder; onChange: (order: AdminOrder) => void }) {
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTarget(null);
    setNote("");
    setNotify(true);
  }, [order.status]);

  const save = async () => {
    if (!target) return;
    setSaving(true);
    try {
      const updated = await api.post<AdminOrder>(`/admin/orders/${order.id}/status`, { status: target, note: note.trim() || undefined, notifyCustomer: notify });
      toast.success(`Order marked ${ORDER_STATUS_LABEL[target].toLowerCase()}`);
      onChange(updated);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Order status" action={<StatusBadge status={order.status} />} />
      <div className="space-y-4 px-5 py-4">
        {order.allowedTransitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">This order is closed — its status can no longer change.</p>
        ) : (
          <>
            <div>
              <p className="mb-2 text-sm font-medium">Move to</p>
              <div className="flex flex-wrap gap-2">
                {order.allowedTransitions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTarget(target === s ? null : s)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm transition",
                      target === s
                        ? DANGER.includes(s)
                          ? "border-sale bg-sale text-white"
                          : "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    {ORDER_STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
              {target && <p className={cn("mt-2 text-xs", DANGER.includes(target) ? "text-sale" : "text-muted-foreground")}>{ORDER_STATUS_HINT[target]}</p>}
            </div>
            {target && (
              <>
                <Field label="Note" hint="Optional — e.g. reason for cancelling">
                  <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
                </Field>
                <Switch checked={notify} onChange={setNotify} label="Show on tracking page" description="The customer sees this step (and the note) when tracking the order." />
                <Button className="w-full" variant={DANGER.includes(target) ? "danger" : "primary"} onClick={save} loading={saving}>
                  Mark as {ORDER_STATUS_LABEL[target].toLowerCase()}
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

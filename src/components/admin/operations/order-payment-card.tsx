"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PAYMENT_STATUSES, StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Card, CardHeader } from "@/components/ui/misc";
import { api, errorMessage } from "@/lib/api/client";
import { formatDateTime, formatPrice } from "@/lib/utils";
import type { PaymentStatus } from "@/types";
import type { AdminOrder } from "@/types/admin-operations";
import { PAYMENT_METHOD_LABEL, isForbidden } from "./helpers";

/**
 * Payment summary, gateway attempts and a manual update form
 * (POST /admin/orders/:id/payment — managers and the owner only).
 */
export function OrderPaymentCard({ order, onChange }: { order: AdminOrder; onChange: (order: AdminOrder) => void }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const due = Math.max(0, order.total - order.paidAmount);

  useEffect(() => {
    setStatus(order.paymentStatus);
    setAmount("");
    setNote("");
    setOpen(false);
  }, [order.paymentStatus, order.updatedAt]);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.post<AdminOrder>(`/admin/orders/${order.id}/payment`, {
        paymentStatus: status,
        ...(amount !== "" ? { paidAmount: Number(amount) } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      toast.success("Payment updated");
      onChange(updated);
    } catch (e) {
      toast.error(isForbidden(e) ? "Only a manager or the owner can change payments." : errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Payment" action={<StatusBadge status={order.paymentStatus} />} />
      <div className="space-y-4 px-5 py-4 text-sm">
        <dl className="grid grid-cols-2 gap-y-1.5">
          <dt className="text-muted-foreground">Method</dt>
          <dd className="text-right">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</dd>
          <dt className="text-muted-foreground">Paid</dt>
          <dd className="text-right tabular-nums">{formatPrice(order.paidAmount)}</dd>
          <dt className="text-muted-foreground">Due</dt>
          <dd className={due > 0 ? "text-right font-semibold text-warning tabular-nums" : "text-right text-success tabular-nums"}>{formatPrice(due)}</dd>
        </dl>

        {order.payments.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">Online payment attempts</p>
            <ul className="space-y-2">
              {order.payments.map((p) => (
                <li key={p.id} className="rounded-md border px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium tabular-nums">{formatPrice(p.amount)}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 font-mono text-[11px] break-all text-muted-foreground">{p.tranId}</p>
                  <p className="text-xs text-muted-foreground">
                    {[p.cardType, p.bankTranId && `Bank ref ${p.bankTranId}`].filter(Boolean).join(" · ") || "—"} · {formatDateTime(p.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!open ? (
          <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(true)}>Update payment</Button>
        ) : (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <Field label="Payment status">
              <Select value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus)}>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                ))}
              </Select>
            </Field>
            <Field label="Amount received (৳)" hint={status === "PAID" ? `Empty = full total (${formatPrice(order.total)})` : status === "REFUNDED" ? "Empty = 0" : "Empty = keep current amount"}>
              <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Note">
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="e.g. bKash TrxID 8N7A…" />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={save} loading={saving}>Save payment</Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

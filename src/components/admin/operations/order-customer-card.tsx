"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import { Mail, MapPin, Pencil, Phone, UserRound } from "lucide-react";
import { WhatsappIcon } from "@/components/shared/social-icons";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Card, CardHeader } from "@/components/ui/misc";
import { Modal } from "@/components/ui/overlay";
import { api, ApiError, errorMessage } from "@/lib/api/client";
import type { AdminOrder, ShippingZonesResponse } from "@/types/admin-operations";
import { whatsappLink } from "./helpers";

type Props = { order: AdminOrder; onChange: (order: AdminOrder) => void };

const LOCKED = ["SHIPPED", "DELIVERED", "RETURNED"];

/** Customer contact + delivery address, with an "Edit" dialog (PATCH /admin/orders/:id). */
export function OrderCustomerCard({ order, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const wa = whatsappLink(order.customerPhone, `Hello ${order.customerName}, about your order ${order.orderNumber}`);

  return (
    <Card>
      <CardHeader
        title="Customer & delivery"
        action={
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" /> Edit
          </Button>
        }
      />
      <div className="space-y-4 px-5 py-4 text-sm">
        <div>
          <p className="font-medium">{order.customerName}</p>
          {order.user ? (
            <Link href={`/admin/customers/${order.user.id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
              <UserRound className="size-3" /> Registered customer
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground">Guest checkout</p>
          )}
        </div>
        <div className="space-y-1.5">
          <a href={`tel:${order.customerPhone}`} className="flex items-center gap-2 hover:underline">
            <Phone className="size-4 text-muted-foreground" /> {order.customerPhone}
          </a>
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
              <WhatsappIcon className="size-4 text-success" /> WhatsApp
            </a>
          )}
          {order.customerEmail && (
            <a href={`mailto:${order.customerEmail}`} className="flex items-center gap-2 break-all hover:underline">
              <Mail className="size-4 shrink-0 text-muted-foreground" /> {order.customerEmail}
            </a>
          )}
        </div>
        <div className="flex gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="leading-relaxed">
            {order.addressLine}
            <br />
            {order.area}, {order.district}
            <br />
            <span className="text-xs text-muted-foreground">Zone: {order.shippingZone}</span>
          </p>
        </div>
        {order.note && (
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">Customer note</p>
            <p className="mt-0.5 whitespace-pre-line">{order.note}</p>
          </div>
        )}
      </div>
      <EditCustomerModal order={order} open={editing} onClose={() => setEditing(false)} onSaved={(o) => { onChange(o); setEditing(false); }} />
    </Card>
  );
}

function EditCustomerModal({ order, open, onClose, onSaved }: { order: AdminOrder; open: boolean; onClose: () => void; onSaved: (o: AdminOrder) => void }) {
  const initial = () => ({
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail ?? "",
    district: order.district,
    area: order.area,
    addressLine: order.addressLine,
  });
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const { data: shipping } = useSWR<ShippingZonesResponse>(open ? "/admin/shipping-zones" : null);
  const locked = LOCKED.includes(order.status);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(initial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order]);

  const set = (key: keyof ReturnType<typeof initial>, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const districts = shipping?.districts ?? [];
  const districtOptions = districts.includes(form.district) ? districts : [form.district, ...districts];

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    // Send only what changed: the API refuses address changes after shipping.
    const before = initial();
    const body: Record<string, string | null> = {};
    (Object.keys(form) as (keyof typeof form)[]).forEach((k) => {
      if (form[k].trim() !== before[k]) body[k] = k === "customerEmail" ? form[k].trim() || null : form[k].trim();
    });
    if (!Object.keys(body).length) return onClose();

    setSaving(true);
    setErrors({});
    try {
      const updated = await api.patch<AdminOrder>(`/admin/orders/${order.id}`, body);
      toast.success("Order details updated");
      onSaved(updated);
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit customer & delivery"
      description={locked ? "This order has shipped — only the name and email can change." : "Changes are noted on the order timeline."}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="order-customer-form" loading={saving}>Save changes</Button>
        </>
      }
    >
      <form id="order-customer-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required error={errors.customerName}>
          <Input value={form.customerName} onChange={(e) => set("customerName", e.target.value)} />
        </Field>
        <Field label="Phone" required error={errors.customerPhone}>
          <Input value={form.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} disabled={locked} inputMode="tel" />
        </Field>
        <Field label="Email" error={errors.customerEmail} className="sm:col-span-2">
          <Input type="email" value={form.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} placeholder="Optional" />
        </Field>
        <Field label="District" required error={errors.district}>
          <Select value={form.district} onChange={(e) => set("district", e.target.value)} disabled={locked}>
            {districtOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </Field>
        <Field label="Area / thana" required error={errors.area}>
          <Input value={form.area} onChange={(e) => set("area", e.target.value)} disabled={locked} />
        </Field>
        <Field label="Address" required error={errors.addressLine} className="sm:col-span-2" hint="Changing the district does not recalculate the delivery charge.">
          <Textarea rows={2} value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} disabled={locked} />
        </Field>
      </form>
    </Modal>
  );
}

/** Private note for the team, saved on the order (never shown to the customer). */
export function OrderAdminNoteCard({ order, onChange }: Props) {
  const [note, setNote] = useState(order.adminNote ?? "");
  const [saving, setSaving] = useState(false);
  useEffect(() => setNote(order.adminNote ?? ""), [order.adminNote]);
  const dirty = note.trim() !== (order.adminNote ?? "");

  const save = async () => {
    setSaving(true);
    try {
      onChange(await api.patch<AdminOrder>(`/admin/orders/${order.id}`, { adminNote: note.trim() || null }));
      toast.success("Note saved");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Admin note" description="Only your team can see this." />
      <div className="space-y-3 px-5 py-4">
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="e.g. Customer asked to deliver after 5pm" />
        <div className="flex justify-end">
          <Button size="sm" onClick={save} loading={saving} disabled={!dirty}>Save note</Button>
        </div>
      </div>
    </Card>
  );
}

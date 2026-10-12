"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { ExternalLink, MapPin, RefreshCw, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Badge, Card, CardHeader } from "@/components/ui/misc";
import { Modal } from "@/components/ui/overlay";
import { api, ApiError, errorMessage } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import type { AdminOrder, AdminSettings, PathaoArea, PathaoCity, PathaoZone, SendToCourierInput } from "@/types/admin-operations";

type Props = { order: AdminOrder; onChange: (order: AdminOrder) => void };

const CLOSED = ["CANCELLED", "RETURNED", "DELIVERED"];

/** "order.in-transit" → "In transit" (same normalising as the API). */
function courierLabel(raw: string | null) {
  if (!raw) return "Unknown";
  const s = raw.replace(/^order\./, "").trim().toLowerCase().replace(/[\s_-]+/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Pathao parcel: book it, or show the consignment with a refresh button. */
export function OrderCourierCard({ order, onChange }: Props) {
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const sync = async () => {
    setSyncing(true);
    try {
      const updated = await api.post<AdminOrder>(`/admin/orders/${order.id}/courier/sync`);
      onChange(updated);
      toast.success(updated.courierStatus === order.courierStatus ? "No new updates from Pathao" : `Pathao: ${courierLabel(updated.courierStatus)}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Courier" description="Pathao delivery" action={order.consignmentId ? <Badge tone="info">{courierLabel(order.courierStatus)}</Badge> : undefined} />
      <div className="space-y-3 px-5 py-4 text-sm">
        {order.consignmentId ? (
          <>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-muted-foreground">Consignment</dt>
              <dd className="text-right font-mono text-xs break-all">{order.consignmentId}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="text-right">{courierLabel(order.courierStatus)}</dd>
              {order.courierFee !== null && (
                <>
                  <dt className="text-muted-foreground">Delivery fee</dt>
                  <dd className="text-right tabular-nums">{formatPrice(order.courierFee)}</dd>
                </>
              )}
            </dl>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={sync} loading={syncing}>
                {!syncing && <RefreshCw className="size-3.5" />} Refresh status
              </Button>
              <a
                href={`https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(order.consignmentId)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium hover:bg-muted"
              >
                Track on Pathao <ExternalLink className="size-3.5" />
              </a>
            </div>
          </>
        ) : CLOSED.includes(order.status) ? (
          <p className="text-muted-foreground">Not sent to a courier.</p>
        ) : (
          <>
            <p className="text-muted-foreground">Book a Pathao pickup for this parcel. The order is marked as shipped once the parcel is booked.</p>
            <Button className="w-full" onClick={() => setSending(true)}>
              <Truck className="size-4" /> Send to Pathao
            </Button>
          </>
        )}
      </div>
      <SendToPathaoModal order={order} open={sending} onClose={() => setSending(false)} onSent={(o) => { onChange(o); setSending(false); }} />
    </Card>
  );
}

function SendToPathaoModal({ order, open, onClose, onSent }: { order: AdminOrder; open: boolean; onClose: () => void; onSent: (o: AdminOrder) => void }) {
  const defaultWeight = Math.min(10, Math.max(0.5, Math.round((order.totalWeightGrams / 1000) * 2) / 2));
  const { data: settings } = useSWR<AdminSettings>(open ? "/admin/settings" : null);
  const courier = settings?.courier;

  const initial = () => ({
    cityId: "",
    zoneId: "",
    areaId: "",
    weightKg: String(defaultWeight),
    deliveryType: "" as "" | "48" | "12",
    itemType: "" as "" | "1" | "2",
    amountToCollect: String(Math.max(0, order.total - order.paidAmount)),
    instruction: "",
  });
  const [form, setForm] = useState(initial);
  const [pickLocation, setPickLocation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initial());
    setErrors({});
    setPickLocation(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Use the store's courier defaults once they load.
  useEffect(() => {
    if (!courier) return;
    setForm((f) => ({ ...f, deliveryType: f.deliveryType || (String(courier.deliveryType) as "48" | "12"), itemType: f.itemType || (String(courier.itemType) as "1" | "2") }));
  }, [courier]);

  const cities = useSWR<PathaoCity[]>(open && pickLocation ? "/admin/courier/cities" : null);
  const zones = useSWR<PathaoZone[]>(open && form.cityId ? `/admin/courier/cities/${form.cityId}/zones` : null);
  const areas = useSWR<PathaoArea[]>(open && form.zoneId ? `/admin/courier/zones/${form.zoneId}/areas` : null);
  const lookupError = cities.error ?? zones.error ?? areas.error;

  const set = <K extends keyof ReturnType<typeof initial>>(key: K, value: ReturnType<typeof initial>[K]) => setForm((f) => ({ ...f, [key]: value }));

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: SendToCourierInput = {
      weightKg: Number(form.weightKg),
      amountToCollect: Number(form.amountToCollect || 0),
      ...(form.deliveryType ? { deliveryType: Number(form.deliveryType) as 48 | 12 } : {}),
      ...(form.itemType ? { itemType: Number(form.itemType) as 1 | 2 } : {}),
      ...(form.instruction.trim() ? { instruction: form.instruction.trim() } : {}),
      ...(pickLocation && form.cityId ? { cityId: Number(form.cityId) } : {}),
      ...(pickLocation && form.zoneId ? { zoneId: Number(form.zoneId) } : {}),
      ...(pickLocation && form.areaId ? { areaId: Number(form.areaId) } : {}),
    };
    setSaving(true);
    setErrors({});
    try {
      const updated = await api.post<AdminOrder>(`/admin/orders/${order.id}/courier`, body);
      toast.success(`Booked with Pathao — consignment ${updated.consignmentId}`);
      onSent(updated);
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
      size="lg"
      title="Send to Pathao"
      description={`${order.customerName} · ${order.addressLine}, ${order.area}, ${order.district}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="pathao-form" loading={saving}><Truck className="size-4" /> Book parcel</Button>
        </>
      }
    >
      <form id="pathao-form" onSubmit={send} className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-muted/30 p-3 sm:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm">
              <p className="flex items-center gap-1.5 font-medium"><MapPin className="size-4" /> Delivery location</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Optional — Pathao detects the city, zone and area from the address.</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setPickLocation((v) => !v)}>{pickLocation ? "Let Pathao detect" : "Choose manually"}</Button>
          </div>
          {pickLocation && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="City" error={errors.cityId}>
                <Select value={form.cityId} onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value, zoneId: "", areaId: "" }))} disabled={!cities.data}>
                  <option value="">{cities.isLoading ? "Loading…" : "Auto"}</option>
                  {cities.data?.map((c) => <option key={c.city_id} value={c.city_id}>{c.city_name}</option>)}
                </Select>
              </Field>
              <Field label="Zone" error={errors.zoneId}>
                <Select value={form.zoneId} onChange={(e) => setForm((f) => ({ ...f, zoneId: e.target.value, areaId: "" }))} disabled={!zones.data}>
                  <option value="">{zones.isLoading ? "Loading…" : "Auto"}</option>
                  {zones.data?.map((z) => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
                </Select>
              </Field>
              <Field label="Area" error={errors.areaId}>
                <Select value={form.areaId} onChange={(e) => set("areaId", e.target.value)} disabled={!areas.data}>
                  <option value="">{areas.isLoading ? "Loading…" : "Auto"}</option>
                  {areas.data?.map((a) => (
                    <option key={a.area_id} value={a.area_id}>{a.area_name}{a.home_delivery_available ? "" : " (no home delivery)"}</option>
                  ))}
                </Select>
              </Field>
              {lookupError && <p className="text-xs text-sale sm:col-span-3">{errorMessage(lookupError)} You can still book without choosing a location.</p>}
            </div>
          )}
        </div>

        <Field label="Weight (kg)" required error={errors.weightKg} hint={`Order weight ${(order.totalWeightGrams / 1000).toFixed(2)} kg · 0.5 – 10 kg`}>
          <Input type="number" min={0.5} max={10} step={0.5} value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} />
        </Field>
        <Field label="Amount to collect (৳)" required error={errors.amountToCollect} hint={order.paidAmount ? `Already paid ${formatPrice(order.paidAmount)}` : "Cash the rider collects"}>
          <Input type="number" min={0} value={form.amountToCollect} onChange={(e) => set("amountToCollect", e.target.value)} />
        </Field>
        <Field label="Delivery type" error={errors.deliveryType}>
          <Select value={form.deliveryType} onChange={(e) => set("deliveryType", e.target.value as "" | "48" | "12")}>
            {!form.deliveryType && <option value="">Store default</option>}
            <option value="48">Normal delivery (48h)</option>
            <option value="12">On-demand (12h)</option>
          </Select>
        </Field>
        <Field label="Item type" error={errors.itemType}>
          <Select value={form.itemType} onChange={(e) => set("itemType", e.target.value as "" | "1" | "2")}>
            {!form.itemType && <option value="">Store default</option>}
            <option value="2">Parcel</option>
            <option value="1">Document</option>
          </Select>
        </Field>
        <Field label="Special instruction" error={errors.instruction} className="sm:col-span-2" hint="Empty = the default instruction from Store Settings → Courier">
          <Textarea rows={2} value={form.instruction} onChange={(e) => set("instruction", e.target.value)} maxLength={250} placeholder={courier?.defaultInstruction || "Please call the customer before delivery."} />
        </Field>
      </form>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/form";
import { api, errorMessage } from "@/lib/api/client";
import type { PathaoStore } from "@/types/admin-operations";
import { SettingsSection, useSettingForm, type SettingsTabProps } from "./settings-shared";

/** Payment methods, free-delivery threshold, minimum order and order numbers. */
export function CheckoutSettingsTab(props: SettingsTabProps<"checkout">) {
  const { form, set, errors, saving, dirty, save, reset } = useSettingForm("checkout", props);
  const numberValue = (v: string) => Math.max(0, Math.round(Number(v || 0)));

  return (
    <SettingsSection title="Checkout" description="How customers pay and what they pay for delivery." onSubmit={save} saving={saving} dirty={dirty} canSave={props.canSave} onReset={reset}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-4 rounded-lg border p-4 sm:col-span-2">
          <Switch checked={form.codEnabled} onChange={(v) => set("codEnabled", v)} label="Cash on delivery" description="Customers pay the rider when the parcel arrives." />
          <Switch
            checked={form.onlinePaymentEnabled}
            onChange={(v) => set("onlinePaymentEnabled", v)}
            label="Online payment (SSLCommerz)"
            description={
              props.integrations.sslcommerz
                ? "bKash, Nagad, Rocket and cards through SSLCommerz."
                : "SSLCommerz is not configured in the backend .env — this stays hidden at checkout until it is."
            }
          />
          {!form.codEnabled && !form.onlinePaymentEnabled && <p className="text-xs text-sale">Turn on at least one payment method, or customers cannot place orders.</p>}
        </div>
        <Field label="Free delivery from (৳)" error={errors.freeShippingThreshold} hint="Order subtotal that ships free. 0 = never free.">
          <Input type="number" min={0} value={form.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", numberValue(e.target.value))} />
        </Field>
        <Field label="Minimum order (৳)" error={errors.minOrderAmount} hint="0 = no minimum">
          <Input type="number" min={0} value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", numberValue(e.target.value))} />
        </Field>
        <Field label="Order number prefix" error={errors.orderPrefix} hint={`New orders look like ${form.orderPrefix || "UT"}261012001`}>
          <Input value={form.orderPrefix} onChange={(e) => set("orderPrefix", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} maxLength={6} className="font-mono uppercase" />
        </Field>
        <div className="hidden sm:block" />
        <Field label="Checkout note" error={errors.checkoutNote} hint="Shown above the “Place order” button" className="sm:col-span-2">
          <Textarea rows={2} value={form.checkoutNote} onChange={(e) => set("checkoutNote", e.target.value)} maxLength={300} />
        </Field>
      </div>
    </SettingsSection>
  );
}

/** Pathao defaults used when booking parcels from an order. */
export function CourierSettingsTab(props: SettingsTabProps<"courier">) {
  const { form, set, errors, saving, dirty, save, reset } = useSettingForm("courier", props);
  const [stores, setStores] = useState<PathaoStore[] | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStores = async () => {
    setLoading(true);
    try {
      const list = await api.get<PathaoStore[]>("/admin/courier/stores");
      setStores(list);
      if (!list.length) toast.info("No stores on this Pathao account yet");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsSection title="Courier (Pathao)" description="Defaults for “Send to Pathao” on an order. You can change them per parcel." onSubmit={save} saving={saving} dirty={dirty} canSave={props.canSave} onReset={reset}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pickup store" error={errors.pathaoStoreId} hint="Empty = PATHAO_STORE_ID from .env, or the account's default store" className="sm:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            {stores && stores.length > 0 ? (
              <div className="flex-1">
                <Select value={form.pathaoStoreId} onChange={(e) => set("pathaoStoreId", e.target.value)}>
                  <option value="">Automatic (default store)</option>
                  {stores.map((s) => (
                    <option key={s.store_id} value={String(s.store_id)}>
                      {s.store_name} — #{s.store_id}{s.is_default_store ? " (default)" : ""}{s.is_active ? "" : " (inactive)"}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <Input value={form.pathaoStoreId} onChange={(e) => set("pathaoStoreId", e.target.value.replace(/\D/g, ""))} placeholder="Store ID, e.g. 12345" className="flex-1 font-mono" />
            )}
            <Button variant="outline" onClick={loadStores} loading={loading} disabled={!props.integrations.pathao}>
              {!loading && <Store className="size-4" />} Load stores
            </Button>
          </div>
        </Field>
        <Field label="Delivery type">
          <Select value={form.deliveryType} onChange={(e) => set("deliveryType", Number(e.target.value) as 48 | 12)}>
            <option value={48}>Normal delivery (48 hours)</option>
            <option value={12}>On-demand (12 hours)</option>
          </Select>
        </Field>
        <Field label="Item type">
          <Select value={form.itemType} onChange={(e) => set("itemType", Number(e.target.value) as 1 | 2)}>
            <option value={2}>Parcel</option>
            <option value={1}>Document</option>
          </Select>
        </Field>
        <Field label="Default special instruction" error={errors.defaultInstruction} className="sm:col-span-2">
          <Textarea rows={2} value={form.defaultInstruction} onChange={(e) => set("defaultInstruction", e.target.value)} maxLength={200} />
        </Field>
      </div>
    </SettingsSection>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Switch } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { api, ApiError, errorMessage } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import type { ShippingZone } from "@/types/admin-operations";
import { DistrictPicker } from "./district-picker";
import { chargeForWeight } from "./helpers";

const EMPTY = {
  name: "",
  code: "",
  baseCharge: "100",
  baseWeightGrams: "1000",
  extraChargePerKg: "20",
  codChargePercent: "0",
  estimatedDays: "2-3 days",
  districts: [] as string[],
  isDefault: false,
  isActive: true,
  sortOrder: "0",
};

/** Create / edit a delivery zone (POST /admin/shipping-zones, PUT /admin/shipping-zones/:id). */
export function ZoneForm({
  zone,
  zones,
  districts,
  open,
  onClose,
  onSaved,
}: {
  zone: ShippingZone | null;
  zones: ShippingZone[];
  districts: string[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      zone
        ? {
            name: zone.name,
            code: zone.code,
            baseCharge: String(zone.baseCharge),
            baseWeightGrams: String(zone.baseWeightGrams),
            extraChargePerKg: String(zone.extraChargePerKg),
            codChargePercent: String(zone.codChargePercent),
            estimatedDays: zone.estimatedDays,
            districts: zone.districts,
            isDefault: zone.isDefault,
            isActive: zone.isActive,
            sortOrder: String(zone.sortOrder),
          }
        : { ...EMPTY, sortOrder: String(zones.length + 1) },
    );
  }, [open, zone, zones.length]);

  /** Districts already listed by another zone → that zone's name. */
  const taken = useMemo(() => {
    const map: Record<string, string> = {};
    zones.filter((z) => z.id !== zone?.id).forEach((z) => z.districts.forEach((d) => (map[d] = z.name)));
    return map;
  }, [zones, zone]);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const example = chargeForWeight(
    { baseCharge: Number(form.baseCharge || 0), baseWeightGrams: Number(form.baseWeightGrams || 0), extraChargePerKg: Number(form.extraChargePerKg || 0) },
    2500,
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const body = {
      ...form,
      baseCharge: Number(form.baseCharge || 0),
      baseWeightGrams: Number(form.baseWeightGrams || 0),
      extraChargePerKg: Number(form.extraChargePerKg || 0),
      codChargePercent: Number(form.codChargePercent || 0),
      sortOrder: Number(form.sortOrder || 0),
    };
    try {
      if (zone) await api.put(`/admin/shipping-zones/${zone.id}`, body);
      else await api.post("/admin/shipping-zones", body);
      toast.success(zone ? "Zone updated" : "Zone created");
      onSaved();
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
      title={zone ? `Edit ${zone.name}` : "New delivery zone"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="zone-form" loading={saving}>Save zone</Button>
        </>
      }
    >
      <form id="zone-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label="Zone name" required error={errors.name} hint="Shown to customers at checkout">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Inside Dhaka" />
        </Field>
        <Field label="Code" required error={errors.code} hint="Letters, numbers and _">
          <Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))} placeholder="INSIDE_DHAKA" className="font-mono" />
        </Field>
        <Field label="Base charge (৳)" required error={errors.baseCharge}>
          <Input type="number" min={0} value={form.baseCharge} onChange={(e) => set("baseCharge", e.target.value)} />
        </Field>
        <Field label="Base weight (grams)" required error={errors.baseWeightGrams} hint="The base charge covers up to this weight">
          <Input type="number" min={100} step={100} value={form.baseWeightGrams} onChange={(e) => set("baseWeightGrams", e.target.value)} />
        </Field>
        <Field label="Extra per kg (৳)" error={errors.extraChargePerKg} hint="For every started kg above the base weight">
          <Input type="number" min={0} value={form.extraChargePerKg} onChange={(e) => set("extraChargePerKg", e.target.value)} />
        </Field>
        <Field label="COD charge (%)" error={errors.codChargePercent} hint="Added for cash on delivery. 0 = none (max 10)">
          <Input type="number" min={0} max={10} step={0.5} value={form.codChargePercent} onChange={(e) => set("codChargePercent", e.target.value)} />
        </Field>
        <Field label="Estimated delivery" error={errors.estimatedDays}>
          <Input value={form.estimatedDays} onChange={(e) => set("estimatedDays", e.target.value)} placeholder="2-3 days" />
        </Field>
        <Field label="Sort order" error={errors.sortOrder}>
          <Input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
        </Field>
        <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground sm:col-span-2">
          Example: a 2.5 kg parcel costs <span className="font-semibold text-foreground">{formatPrice(example)}</span> in this zone.
        </p>
        <Field label={`Districts (${form.districts.length})`} error={errors.districts} className="sm:col-span-2" hint={form.isDefault ? "The default zone also covers every district not listed in another zone." : undefined}>
          <DistrictPicker districts={districts} value={form.districts} onChange={(v) => set("districts", v)} taken={taken} />
        </Field>
        <div className="space-y-3 sm:col-span-2">
          <Switch checked={form.isDefault} onChange={(v) => set("isDefault", v)} label="Default zone" description="Catches every district not listed elsewhere. Only one zone can be the default." />
          <Switch checked={form.isActive} onChange={(v) => set("isActive", v)} label="Active" description="Inactive zones are ignored at checkout." />
        </div>
      </form>
    </Modal>
  );
}

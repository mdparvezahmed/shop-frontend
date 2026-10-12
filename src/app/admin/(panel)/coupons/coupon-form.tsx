"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { api, ApiError, errorMessage } from "@/lib/api/client";

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
};

const EMPTY = {
  code: "",
  description: "",
  type: "PERCENT" as Coupon["type"],
  value: "10",
  minOrderAmount: "0",
  maxDiscount: "",
  usageLimit: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

export function CouponForm({ coupon, open, onClose, onSaved }: { coupon: Coupon | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      coupon
        ? {
            code: coupon.code,
            description: coupon.description ?? "",
            type: coupon.type,
            value: String(coupon.value),
            minOrderAmount: String(coupon.minOrderAmount),
            maxDiscount: coupon.maxDiscount?.toString() ?? "",
            usageLimit: coupon.usageLimit?.toString() ?? "",
            startsAt: toDateInput(coupon.startsAt),
            endsAt: toDateInput(coupon.endsAt),
            isActive: coupon.isActive,
          }
        : EMPTY,
    );
  }, [open, coupon]);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const body = {
      ...form,
      value: Number(form.value || 0),
      minOrderAmount: Number(form.minOrderAmount || 0),
      startsAt: form.startsAt || null,
      endsAt: form.endsAt ? `${form.endsAt}T23:59:59` : null,
    };
    try {
      if (coupon) await api.put(`/admin/coupons/${coupon.id}`, body);
      else await api.post("/admin/coupons", body);
      toast.success(coupon ? "Coupon updated" : "Coupon created");
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
      title={coupon ? `Edit ${coupon.code}` : "New coupon"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="coupon-form" loading={saving}>Save coupon</Button>
        </>
      }
    >
      <form id="coupon-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label="Code" required error={errors.code} hint="Customers type this in the cart" className="sm:col-span-2">
          <Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="WELCOME10" className="font-mono uppercase" />
        </Field>
        <Field label="Description" error={errors.description} className="sm:col-span-2">
          <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="10% off your first order" />
        </Field>
        <Field label="Type" required>
          <Select value={form.type} onChange={(e) => set("type", e.target.value as Coupon["type"])}>
            <option value="PERCENT">Percentage off</option>
            <option value="FIXED">Fixed amount off</option>
            <option value="FREE_SHIPPING">Free delivery</option>
          </Select>
        </Field>
        {form.type !== "FREE_SHIPPING" && (
          <Field label={form.type === "PERCENT" ? "Percent (%)" : "Amount (৳)"} required error={errors.value}>
            <Input type="number" min={0} value={form.value} onChange={(e) => set("value", e.target.value)} />
          </Field>
        )}
        <Field label="Minimum order (৳)" error={errors.minOrderAmount}>
          <Input type="number" min={0} value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", e.target.value)} />
        </Field>
        {form.type === "PERCENT" && (
          <Field label="Maximum discount (৳)" hint="Leave empty for no cap" error={errors.maxDiscount}>
            <Input type="number" min={0} value={form.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} />
          </Field>
        )}
        <Field label="Usage limit" hint="Total times it can be used. Empty = unlimited" error={errors.usageLimit}>
          <Input type="number" min={0} value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} />
        </Field>
        <Field label="Starts on" error={errors.startsAt}>
          <Input type="date" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
        </Field>
        <Field label="Ends on" error={errors.endsAt}>
          <Input type="date" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Switch checked={form.isActive} onChange={(v) => set("isActive", v)} label="Active" description="Turn off to pause the code without deleting it" />
        </div>
      </form>
    </Modal>
  );
}

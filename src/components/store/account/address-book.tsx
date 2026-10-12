"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Badge, EmptyState, Skeleton } from "@/components/ui/misc";
import { ConfirmDialog, Modal } from "@/components/ui/overlay";
import { ApiError, errorMessage } from "@/lib/api/client";
import { accountApi, checkoutApi } from "@/services/shop";
import type { Address } from "@/types";

type Draft = Omit<Address, "id">;
const EMPTY: Draft = { label: "Home", name: "", phone: "", district: "", area: "", addressLine: "", isDefault: false };

export function AddressBook() {
  const { data, isLoading, mutate } = useSWR("my-addresses", () => accountApi.addresses());
  const { data: shipping } = useSWR("shipping-info", () => checkoutApi.shippingInfo());
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const open = (a: Address | "new") => {
    setErrors({});
    setDraft(a === "new" ? { ...EMPTY, isDefault: !data?.length } : { ...a });
    setEditing(a);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing === "new") await accountApi.createAddress(draft);
      else if (editing) await accountApi.updateAddress(editing.id, draft);
      toast.success("Address saved");
      setEditing(null);
      mutate();
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await accountApi.deleteAddress(deleting.id);
      toast.success("Address deleted");
      setDeleting(null);
      mutate();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const set = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-sans text-lg font-semibold">Saved addresses</h2>
        <Button size="sm" onClick={() => open("new")}><Plus className="size-4" /> Add address</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-32" />
      ) : !data?.length ? (
        <EmptyState icon={<MapPin className="size-6" />} title="No saved addresses" description="Save an address to check out faster next time." className="rounded-xl border" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((a) => (
            <div key={a.id} className="rounded-xl border p-5 text-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-semibold">{a.label}</span>
                {a.isDefault && <Badge tone="dark">Default</Badge>}
              </div>
              <p className="font-medium">{a.name}</p>
              <p className="text-muted-foreground">{a.phone}</p>
              <p className="mt-1 text-muted-foreground">{a.addressLine}, {a.area}, {a.district}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => open(a)}><Pencil className="size-3.5" /> Edit</Button>
                <Button size="sm" variant="ghost" className="text-sale" onClick={() => setDeleting(a)}><Trash2 className="size-3.5" /> Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New address" : "Edit address"}
        footer={<><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" form="address-form" loading={saving}>Save address</Button></>}
      >
        <form id="address-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Label" error={errors.label}><Input value={draft.label} onChange={set("label")} placeholder="Home, Office…" /></Field>
          <Field label="Receiver name" required error={errors.name}><Input value={draft.name} onChange={set("name")} required /></Field>
          <Field label="Phone" required error={errors.phone}><Input value={draft.phone} onChange={set("phone")} type="tel" placeholder="01XXXXXXXXX" required /></Field>
          <Field label="District" required error={errors.district}>
            <Select value={draft.district} onChange={set("district")} required>
              <option value="">Select district</option>
              {shipping?.districts.map((d) => <option key={d}>{d}</option>)}
            </Select>
          </Field>
          <Field label="Area / Thana" required error={errors.area} className="sm:col-span-2"><Input value={draft.area} onChange={set("area")} required /></Field>
          <Field label="Full address" required error={errors.addressLine} className="sm:col-span-2"><Textarea value={draft.addressLine} onChange={set("addressLine")} rows={2} required /></Field>
          <Checkbox label="Use as my default address" checked={draft.isDefault} onChange={(e) => setDraft((d) => ({ ...d, isDefault: e.target.checked }))} className="sm:col-span-2" />
        </form>
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} title="Delete this address?" message={deleting ? `${deleting.addressLine}, ${deleting.area}` : ""} />
    </div>
  );
}

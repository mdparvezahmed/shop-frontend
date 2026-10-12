"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Card, CardHeader, Skeleton } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/overlay";
import { api, ApiError, errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { Color, Size } from "@/types/admin-catalog";
import { Swatch } from "./swatch";

/**
 * Sizes and colours used to build product variants.
 * Each card lists the values with inline editing; the API refuses (409) to delete
 * a value that is still used by variants, and we show its message.
 */

const HEX = /^#[0-9a-fA-F]{6}$/;

type Draft = { name: string; hex: string; sortOrder: string };

const nextSort = (list: { sortOrder: number }[] | undefined) => (list?.length ? Math.max(...list.map((x) => x.sortOrder)) + 1 : 0);

/** Generic list card shared by sizes and colours. */
function AttributeCard<T extends Size | Color>({
  kind,
  endpoint,
  title,
  description,
  withHex,
  placeholder,
}: {
  kind: string;
  endpoint: "/admin/sizes" | "/admin/colors";
  title: string;
  description: string;
  withHex?: boolean;
  placeholder: string;
}) {
  const { data, isLoading, mutate } = useSWR<T[]>(endpoint);
  const [adding, setAdding] = useState<Draft>({ name: "", hex: "#111111", sortOrder: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Draft>({ name: "", hex: "", sortOrder: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);

  const toBody = (d: Draft, fallbackSort: number) => ({
    name: d.name.trim(),
    ...(withHex ? { hex: d.hex.toUpperCase() } : {}),
    sortOrder: d.sortOrder === "" ? fallbackSort : Number(d.sortOrder),
  });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adding.name.trim()) return;
    setSaving(true);
    setErrors({});
    try {
      await api.post(endpoint, toBody(adding, nextSort(data)));
      toast.success(`${kind} added`);
      setAdding({ name: "", hex: adding.hex, sortOrder: "" });
      mutate();
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: T) => {
    setEditingId(item.id);
    setErrors({});
    setEdit({ name: item.name, hex: "hex" in item ? item.hex : "", sortOrder: String(item.sortOrder) });
  };

  const update = async (item: T) => {
    setSaving(true);
    try {
      await api.put(`${endpoint}/${item.id}`, toBody(edit, item.sortOrder));
      toast.success(`${kind} updated`);
      setEditingId(null);
      mutate();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`${endpoint}/${deleting.id}`);
      toast.success(`${kind} deleted`);
      setDeleting(null);
      mutate();
    } catch (error) {
      // 409 when still used by variants — the message explains what to do.
      toast.error(errorMessage(error));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader title={title} description={description} />

      <form onSubmit={create} className="flex flex-wrap items-start gap-2 border-b p-4">
        {withHex && <HexInput value={adding.hex} onChange={(hex) => setAdding((a) => ({ ...a, hex }))} />}
        <div className="min-w-32 flex-1">
          <Input value={adding.name} onChange={(e) => setAdding((a) => ({ ...a, name: e.target.value }))} placeholder={placeholder} maxLength={withHex ? 40 : 20} aria-invalid={!!errors.name} />
          {(errors.name || errors.hex) && <p className="mt-1 text-xs text-sale">{(errors.name ?? errors.hex)[0]}</p>}
        </div>
        <Input type="number" value={adding.sortOrder} onChange={(e) => setAdding((a) => ({ ...a, sortOrder: e.target.value }))} placeholder={`Order (${nextSort(data)})`} className="w-28" aria-label="Sort order" />
        <Button type="submit" loading={saving && !editingId} disabled={!adding.name.trim() || (withHex && !HEX.test(adding.hex))}>
          <Plus className="size-4" /> Add
        </Button>
      </form>

      {isLoading && !data ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !data?.length ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">Nothing yet — add your first {kind.toLowerCase()} above.</p>
      ) : (
        <ul className="divide-y">
          {data.map((item) => {
            const hex = "hex" in item ? item.hex : null;
            const isEditing = editingId === item.id;
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                {isEditing ? (
                  <>
                    {withHex && <HexInput value={edit.hex} onChange={(v) => setEdit((d) => ({ ...d, hex: v }))} />}
                    <Input value={edit.name} onChange={(e) => setEdit((d) => ({ ...d, name: e.target.value }))} className="h-9 min-w-28 flex-1" autoFocus aria-label="Name" />
                    <Input type="number" value={edit.sortOrder} onChange={(e) => setEdit((d) => ({ ...d, sortOrder: e.target.value }))} className="h-9 w-20" aria-label="Sort order" />
                    <div className="flex gap-1">
                      <Button size="icon-sm" onClick={() => update(item)} loading={saving} disabled={!edit.name.trim() || (withHex && !HEX.test(edit.hex))} aria-label="Save">
                        {!saving && <Check className="size-4" />}
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => setEditingId(null)} aria-label="Cancel">
                        <X className="size-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {hex && <Swatch hex={hex} className="size-7" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {hex && <span className="mr-2 font-mono">{hex}</span>}
                        Order {item.sortOrder} · {item.variantCount ?? 0} variant{item.variantCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon-sm" variant="ghost" onClick={() => startEdit(item)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => setDeleting(item)} aria-label="Delete">
                        <Trash2 className={cn("size-4", item.variantCount ? "text-muted-foreground" : "text-sale")} />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title={`Delete ${deleting?.name}?`}
        message={
          deleting?.variantCount
            ? `It is used by ${deleting.variantCount} variant(s), so it cannot be deleted until you remove it from those products.`
            : `Remove this ${kind.toLowerCase()} from the list.`
        }
      />
    </Card>
  );
}

/** Native colour picker + hex text box kept in sync. */
function HexInput({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const valid = HEX.test(value);
  return (
    <div className="flex items-center gap-1.5">
      <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border" style={{ backgroundColor: valid ? value : "transparent" }} title="Pick colour">
        <input type="color" value={valid ? value : "#000000"} onChange={(e) => onChange(e.target.value.toUpperCase())} className="absolute inset-0 size-full cursor-pointer opacity-0" aria-label="Colour picker" />
      </label>
      <Input
        value={value}
        onChange={(e) => {
          const v = e.target.value.trim();
          onChange(v.startsWith("#") ? v : `#${v}`);
        }}
        maxLength={7}
        className={cn("h-9 w-24 font-mono text-xs uppercase", !valid && "border-sale")}
        aria-label="Hex colour"
      />
    </div>
  );
}

export function SizesCard() {
  return <AttributeCard<Size> kind="Size" endpoint="/admin/sizes" title="Sizes" description="Listed smallest to largest using the order number." placeholder="e.g. XL, 32, Free size" />;
}

export function ColorsCard() {
  return <AttributeCard<Color> kind="Colour" endpoint="/admin/colors" title="Colours" description="The swatch shoppers click on the product page." placeholder="e.g. Bottle Green" withHex />;
}

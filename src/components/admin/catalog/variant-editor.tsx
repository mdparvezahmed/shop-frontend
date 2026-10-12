"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label, Switch } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/misc";
import { cn, formatNumber } from "@/lib/utils";
import type { Color, Size } from "@/types/admin-catalog";
import { Swatch } from "./swatch";
import { buildVariantMatrix, type VariantRow } from "./product-form-model";

type VariantValue = { sizeIds: string[]; colorIds: string[]; variants: VariantRow[] };

/**
 * Pick sizes and colours → the size × colour matrix is generated automatically.
 * Each row has its own stock, optional price override, SKU (auto when empty) and an active toggle.
 */
export function VariantEditor({
  sizes,
  colors,
  value,
  onChange,
  basePrice,
  error,
  loading,
}: {
  sizes: Size[] | undefined;
  colors: Color[] | undefined;
  value: VariantValue;
  onChange: (value: VariantValue) => void;
  basePrice: string;
  error?: string;
  loading?: boolean;
}) {
  const [bulkStock, setBulkStock] = useState("");
  const sizeList = sizes ?? [];
  const colorList = colors ?? [];

  const update = (sizeIds: string[], colorIds: string[]) =>
    onChange({ sizeIds, colorIds, variants: buildVariantMatrix(sizeIds, colorIds, sizeList, colorList, value.variants) });
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const patchRow = (i: number, patch: Partial<VariantRow>) =>
    onChange({ ...value, variants: value.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) });
  const applyStockToAll = () => {
    if (bulkStock === "") return;
    onChange({ ...value, variants: value.variants.map((v) => ({ ...v, stock: bulkStock })) });
  };

  const sizeName = (id: string | null) => sizeList.find((s) => s.id === id)?.name;
  const color = (id: string | null) => colorList.find((c) => c.id === id);
  const totalStock = value.variants.filter((v) => v.isActive).reduce((sum, v) => sum + Number(v.stock || 0), 0);

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <Label className="mb-0">Sizes</Label>
          <div className="flex gap-3 text-xs">
            {sizeList.length > 0 && (
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => update(value.sizeIds.length === sizeList.length ? [] : sizeList.map((s) => s.id), value.colorIds)}>
                {value.sizeIds.length === sizeList.length ? "Clear" : "Select all"}
              </button>
            )}
            <Link href="/admin/attributes" className="text-muted-foreground hover:text-foreground">Manage</Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {sizeList.map((s) => {
            const on = value.sizeIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => update(toggle(value.sizeIds, s.id), value.colorIds)}
                aria-pressed={on}
                className={cn("h-9 min-w-11 rounded-md border px-3 text-sm font-medium transition", on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}
              >
                {s.name}
              </button>
            );
          })}
          {!sizeList.length && <p className="text-sm text-muted-foreground">No sizes yet — add them under Sizes &amp; Colours.</p>}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <Label className="mb-0">Colours</Label>
          <Link href="/admin/attributes" className="text-xs text-muted-foreground hover:text-foreground">Manage</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {colorList.map((c) => {
            const on = value.colorIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => update(value.sizeIds, toggle(value.colorIds, c.id))}
                aria-pressed={on}
                className={cn("inline-flex h-9 items-center gap-2 rounded-full border py-1 pr-3 pl-1.5 text-sm transition", on ? "border-primary ring-1 ring-primary" : "bg-card hover:bg-muted")}
              >
                <Swatch hex={c.hex} checked={on} className="size-6" />
                {c.name}
              </button>
            );
          })}
          {!colorList.length && <p className="text-sm text-muted-foreground">No colours yet.</p>}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <span className="font-semibold">{value.variants.length}</span> variant{value.variants.length === 1 ? "" : "s"} ·{" "}
          <span className="font-semibold">{formatNumber(totalStock)}</span> units in stock
        </p>
        <div className="flex items-center gap-2">
          <Input type="number" min={0} value={bulkStock} onChange={(e) => setBulkStock(e.target.value)} placeholder="Stock" className="h-8 w-24 text-xs" />
          <Button size="sm" variant="outline" onClick={applyStockToAll} disabled={bulkStock === ""}>Set stock for all</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b bg-muted/50 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Variant</th>
              <th className="px-3 py-2 text-left font-medium">Stock</th>
              <th className="px-3 py-2 text-left font-medium">Price (৳)</th>
              <th className="px-3 py-2 text-left font-medium">SKU</th>
              <th className="px-3 py-2 text-center font-medium">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {value.variants.map((v, i) => {
              const c = color(v.colorId);
              const label = [sizeName(v.sizeId), c?.name].filter(Boolean).join(" / ") || "Default (one size)";
              const stock = Number(v.stock || 0);
              return (
                <tr key={`${v.sizeId}|${v.colorId}`} className={cn(!v.isActive && "opacity-50")}>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2 font-medium whitespace-nowrap">
                      {c && <Swatch hex={c.hex} className="size-4" />}
                      {label}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => patchRow(i, { stock: e.target.value })}
                      className={cn("h-8 w-20", stock === 0 && "border-sale/60")}
                      aria-label={`Stock for ${label}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      value={v.price}
                      onChange={(e) => patchRow(i, { price: e.target.value })}
                      placeholder={basePrice || "Same"}
                      className="h-8 w-24"
                      aria-label={`Price for ${label}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input value={v.sku} onChange={(e) => patchRow(i, { sku: e.target.value.toUpperCase() })} placeholder="Auto" className="h-8 w-40 font-mono text-xs" aria-label={`SKU for ${label}`} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-center">
                      <Switch checked={v.isActive} onChange={(on) => patchRow(i, { isActive: on })} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Leave price empty to use the main price. Inactive variants are hidden from the store. Removing a size or colour deletes its variants
        (variants that were already ordered are deactivated instead).
      </p>
      {error && <p className="text-xs text-sale">{error}</p>}
    </div>
  );
}

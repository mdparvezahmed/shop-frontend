"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Badge, EmptyState, Skeleton, type BadgeTone } from "@/components/ui/misc";
import { Modal } from "@/components/ui/overlay";
import { api, ApiError, errorMessage } from "@/lib/api/client";
import { cn, formatDateTime } from "@/lib/utils";
import type { InventoryMovement, InventoryRow, StockReason } from "@/types/admin-catalog";
import { Swatch } from "./swatch";

const REASONS: Record<StockReason, { label: string; tone: BadgeTone }> = {
  INITIAL: { label: "Initial stock", tone: "neutral" },
  RESTOCK: { label: "Restock", tone: "success" },
  ADJUSTMENT: { label: "Adjustment", tone: "info" },
  ORDER: { label: "Order", tone: "accent" },
  ORDER_CANCELLED: { label: "Order cancelled", tone: "warning" },
  RETURN: { label: "Return", tone: "success" },
};

/** "Essential Tee — M / Black" */
export function variantTitle(row: InventoryRow) {
  const options = [row.size, row.color?.name].filter(Boolean).join(" / ");
  return options ? `${row.product.name} — ${options}` : row.product.name;
}

/**
 * Change stock for one variant. "Add" adds the quantity (use a negative number to remove),
 * "Set" sets the exact count after a stock take.
 */
export function StockAdjustModal({ row, onClose, onSaved }: { row: InventoryRow | null; onClose: () => void; onSaved: () => void }) {
  const [mode, setMode] = useState<"add" | "set">("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState<"RESTOCK" | "ADJUSTMENT" | "RETURN">("RESTOCK");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!row) return;
    setMode("add");
    setQuantity("");
    setReason("RESTOCK");
    setNote("");
    setErrors({});
  }, [row]);

  const qty = Number(quantity || 0);
  const result = row ? (mode === "set" ? qty : row.stock + qty) : 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!row) return;
    setSaving(true);
    setErrors({});
    try {
      await api.post(`/admin/inventory/${row.id}/adjust`, { mode, quantity: qty, reason, note: note.trim() || undefined });
      toast.success(`Stock updated to ${result}`);
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
      open={!!row}
      onClose={onClose}
      title="Adjust stock"
      description={row ? variantTitle(row) : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="stock-adjust-form" loading={saving} disabled={quantity === "" || result < 0}>Save</Button>
        </>
      }
    >
      {row && (
        <form id="stock-adjust-form" onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["add", "set"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn("rounded-md px-3 py-2 text-sm font-medium transition", mode === m ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                {m === "add" ? "Add / remove" : "Set exact count"}
              </button>
            ))}
          </div>
          <Field
            label={mode === "add" ? "Quantity to add" : "New stock count"}
            required
            error={errors.quantity}
            hint={mode === "add" ? "Use a negative number to remove units, e.g. -2 for damaged items." : "Use after counting the shelf."}
          >
            <Input type="number" min={mode === "set" ? 0 : undefined} value={quantity} onChange={(e) => setQuantity(e.target.value)} autoFocus inputMode="numeric" />
          </Field>
          <Field label="Reason" error={errors.reason}>
            <Select value={reason} onChange={(e) => setReason(e.target.value as typeof reason)}>
              <option value="RESTOCK">Restock — new units arrived</option>
              <option value="ADJUSTMENT">Adjustment — count correction, damage</option>
              <option value="RETURN">Return — customer sent it back</option>
            </Select>
          </Field>
          <Field label="Note" error={errors.note} hint="Optional, e.g. supplier invoice number">
            <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
          </Field>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
            <span className="text-muted-foreground">Current {row.stock}</span>
            <span className={cn("font-semibold tabular-nums", result < 0 && "text-sale")}>New stock: {quantity === "" ? "—" : result}</span>
          </div>
          {result < 0 && <p className="text-xs text-sale">Stock cannot go below zero.</p>}
        </form>
      )}
    </Modal>
  );
}

/** Last 50 stock movements (the ledger) for one variant. */
export function StockHistoryModal({ row, onClose }: { row: InventoryRow | null; onClose: () => void }) {
  const { data, isLoading } = useSWR<InventoryMovement[]>(row ? `/admin/inventory/${row.id}/history` : null);

  return (
    <Modal
      open={!!row}
      onClose={onClose}
      size="lg"
      title="Stock history"
      description={
        row && (
          <span className="inline-flex items-center gap-2">
            {row.color && <Swatch hex={row.color.hex} className="size-3.5" />}
            {variantTitle(row)} · <span className="font-mono text-xs">{row.sku}</span>
          </span>
        )
      }
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState icon={<History className="size-6" />} title="No movements yet" description="Every stock change will be listed here." />
      ) : (
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="border-y bg-muted/50 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-2 text-left font-medium">When</th>
                <th className="px-3 py-2 text-left font-medium">Reason</th>
                <th className="px-3 py-2 text-right font-medium">Change</th>
                <th className="px-5 py-2 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-2.5 whitespace-nowrap text-muted-foreground">{formatDateTime(m.createdAt)}</td>
                  <td className="px-3 py-2.5">
                    <Badge tone={REASONS[m.reason]?.tone ?? "neutral"}>{REASONS[m.reason]?.label ?? m.reason}</Badge>
                    {m.note && <p className="mt-0.5 text-xs text-muted-foreground">{m.note}</p>}
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-medium tabular-nums", m.change > 0 ? "text-success" : "text-sale")}>
                    {m.change > 0 ? `+${m.change}` : m.change}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{m.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

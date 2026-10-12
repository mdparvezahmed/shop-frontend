"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { api, ApiError, errorMessage } from "@/lib/api/client";
import type { AdminSizeChart } from "@/types/admin-catalog";

type ChartDraft = { name: string; unit: string; columns: string[]; rows: string[][]; note: string };

/** A sensible starting point for a t-shirt chart. */
const STARTER: ChartDraft = {
  name: "",
  unit: "inch",
  columns: ["Size", "Chest", "Length", "Shoulder"],
  rows: ["S", "M", "L", "XL", "XXL"].map((s) => [s, "", "", ""]),
  note: "",
};

const cellClass = "h-9 min-w-20 rounded-none border-0 bg-transparent px-2 text-center focus:bg-muted/60";

/**
 * Modal editor for a size chart: an editable grid where columns and rows can be
 * added/removed. Body: { name, unit, columns: string[], rows: string[][], note }.
 */
export function SizeChartForm({ chart, open, onClose, onSaved }: { chart: AdminSizeChart | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ChartDraft>(STARTER);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(chart ? { name: chart.name, unit: chart.unit, columns: [...chart.columns], rows: chart.rows.map((r) => [...r]), note: chart.note ?? "" } : STARTER);
  }, [open, chart]);

  const setColumn = (c: number, value: string) => setForm((f) => ({ ...f, columns: f.columns.map((x, i) => (i === c ? value : x)) }));
  const setCell = (r: number, c: number, value: string) =>
    setForm((f) => ({ ...f, rows: f.rows.map((row, ri) => (ri === r ? row.map((x, ci) => (ci === c ? value : x)) : row)) }));
  const addColumn = () => setForm((f) => ({ ...f, columns: [...f.columns, ""], rows: f.rows.map((r) => [...r, ""]) }));
  const removeColumn = (c: number) =>
    setForm((f) => ({ ...f, columns: f.columns.filter((_, i) => i !== c), rows: f.rows.map((r) => r.filter((_, i) => i !== c)) }));
  const addRow = () => setForm((f) => ({ ...f, rows: [...f.rows, f.columns.map(() => "")] }));
  const removeRow = (r: number) => setForm((f) => ({ ...f, rows: f.rows.filter((_, i) => i !== r) }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const body = { ...form, note: form.note.trim() || null };
    try {
      if (chart) await api.put(`/admin/size-charts/${chart.id}`, body);
      else await api.post("/admin/size-charts", body);
      toast.success(chart ? "Size chart updated" : "Size chart created");
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
      size="xl"
      title={chart ? `Edit ${chart.name}` : "New size chart"}
      description="Measurements shown in the “Size guide” on product pages."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="size-chart-form" loading={saving}>Save chart</Button>
        </>
      }
    >
      <form id="size-chart-form" onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <Field label="Name" required error={errors.name} hint="e.g. Regular Fit T-Shirt, Oversized Tee">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={80} autoFocus />
          </Field>
          <Field label="Unit" error={errors.unit}>
            <Select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
              <option value="inch">Inches</option>
              <option value="cm">Centimetres</option>
            </Select>
          </Field>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Measurements</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={addColumn} disabled={form.columns.length >= 10}>
                <Plus className="size-3.5" /> Column
              </Button>
              <Button size="sm" variant="outline" onClick={addRow} disabled={form.rows.length >= 30}>
                <Plus className="size-3.5" /> Row
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="divide-x">
                  {form.columns.map((col, c) => (
                    <th key={c} className="p-0 font-medium">
                      <div className="flex items-center">
                        <Input value={col} onChange={(e) => setColumn(c, e.target.value)} placeholder="Column" maxLength={30} className={`${cellClass} font-semibold`} aria-label={`Column ${c + 1} title`} />
                        {form.columns.length > 2 && (
                          <button type="button" onClick={() => removeColumn(c)} className="mr-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-sale" aria-label={`Remove column ${col || c + 1}`}>
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {form.rows.map((row, r) => (
                  <tr key={r} className="divide-x">
                    {row.map((cell, c) => (
                      <td key={c} className="p-0">
                        <Input value={cell} onChange={(e) => setCell(r, c, e.target.value)} maxLength={30} className={`${cellClass} ${c === 0 ? "font-medium" : ""}`} aria-label={`Row ${r + 1}, ${form.columns[c] || `column ${c + 1}`}`} />
                      </td>
                    ))}
                    <td className="w-10 text-center">
                      <button type="button" onClick={() => removeRow(r)} disabled={form.rows.length <= 1} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-sale disabled:opacity-30" aria-label={`Remove row ${r + 1}`}>
                        <X className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(errors.columns || errors.rows) && <p className="mt-1 text-xs text-sale">{(errors.columns ?? errors.rows)[0]}</p>}
          <p className="mt-1 text-xs text-muted-foreground">The first column is usually the size name. Measure garments laid flat.</p>
        </div>

        <Field label="Note" error={errors.note} hint="Optional tip shown under the chart">
          <Textarea rows={2} maxLength={500} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Oversized fit — size down for a regular look." />
        </Field>
      </form>
    </Modal>
  );
}

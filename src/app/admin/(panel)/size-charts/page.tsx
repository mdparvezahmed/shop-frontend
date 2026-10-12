"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Pencil, Plus, Ruler, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { SizeChartForm } from "@/components/admin/catalog/size-chart-form";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, Skeleton } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/overlay";
import { api, errorMessage } from "@/lib/api/client";
import type { AdminSizeChart } from "@/types/admin-catalog";

/** Size charts — reusable measurement tables attached to products. */
export default function SizeChartsPage() {
  const { data: charts, isLoading, mutate } = useSWR<AdminSizeChart[]>("/admin/size-charts");
  const [editing, setEditing] = useState<AdminSizeChart | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminSizeChart | null>(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/admin/size-charts/${deleting.id}`);
      toast.success("Size chart deleted");
      setDeleting(null);
      mutate();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Size charts"
        description="Measurement tables shown in the size guide. Create one per fit and attach it to products."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" /> New size chart
          </Button>
        }
      />

      {isLoading && !charts ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : !charts?.length ? (
        <Card>
          <EmptyState
            icon={<Ruler className="size-6" />}
            title="No size charts yet"
            description="Shoppers buy with more confidence (and return less) when they can check measurements."
            action={<Button onClick={() => setEditing("new")}>Create size chart</Button>}
          />
        </Card>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2">
          {charts.map((chart) => (
            <Card key={chart.id} className="overflow-hidden">
              <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{chart.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    In {chart.unit === "cm" ? "centimetres" : chart.unit === "inch" ? "inches" : chart.unit} · used by {chart.productCount ?? 0} product{chart.productCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => setEditing(chart)} aria-label="Edit">
                    <Pencil className="size-4" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setDeleting(chart)} aria-label="Delete">
                    <Trash2 className="size-4 text-sale" />
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      {chart.columns.map((c, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {chart.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td key={c} className={c === 0 ? "px-3 py-1.5 font-medium" : "px-3 py-1.5 tabular-nums"}>{cell || "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {chart.note && <p className="border-t px-5 py-3 text-xs text-muted-foreground">{chart.note}</p>}
            </Card>
          ))}
        </div>
      )}

      <SizeChartForm
        chart={editing === "new" ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          mutate();
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title={`Delete ${deleting?.name}?`}
        message={
          deleting?.productCount
            ? `${deleting.productCount} product(s) use this chart. They will no longer show a size guide.`
            : "This size chart is not used by any product."
        }
      />
    </>
  );
}

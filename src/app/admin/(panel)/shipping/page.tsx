"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import { Info, Pencil, Plus, Trash2, Truck } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ChargeCalculator } from "@/components/admin/operations/charge-calculator";
import { isForbidden } from "@/components/admin/operations/helpers";
import { ZoneForm } from "@/components/admin/operations/zone-form";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, Skeleton } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/overlay";
import { api, errorMessage } from "@/lib/api/client";
import { cn, formatPrice } from "@/lib/utils";
import type { PublicCheckoutSettings } from "@/types";
import type { ShippingZone, ShippingZonesResponse } from "@/types/admin-operations";

/** Shipping & delivery — zones with their charges and districts, plus a charge calculator. */
export default function ShippingPage() {
  const { data, isLoading, mutate } = useSWR<ShippingZonesResponse>("/admin/shipping-zones");
  const { data: publicSettings } = useSWR<{ checkout: PublicCheckoutSettings }>("/settings/public");
  const [editing, setEditing] = useState<ShippingZone | "new" | null>(null);
  const [deleting, setDeleting] = useState<ShippingZone | null>(null);
  const [busy, setBusy] = useState(false);

  const zones = data?.zones ?? [];
  const districts = data?.districts ?? [];
  const listed = new Set(zones.flatMap((z) => z.districts));
  const unlisted = districts.filter((d) => !listed.has(d)).length;
  const threshold = publicSettings?.checkout.freeShippingThreshold ?? 0;

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/admin/shipping-zones/${deleting.id}`);
      toast.success("Zone deleted");
      setDeleting(null);
      mutate();
    } catch (e) {
      toast.error(isForbidden(e) ? "Only a manager or the owner can change delivery zones." : errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Shipping & delivery"
        description="Delivery charges by district. Charge = base charge + extra per started kg above the base weight."
        actions={<Button onClick={() => setEditing("new")}><Plus className="size-4" /> New zone</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          {isLoading && !data ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)
          ) : zones.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Truck className="size-6" />}
                title="No delivery zones"
                description="Customers cannot check out until you add at least one zone."
                action={<Button onClick={() => setEditing("new")}>Create zone</Button>}
              />
            </Card>
          ) : (
            zones.map((z) => (
              <Card key={z.id} className={cn("p-5", !z.isActive && "opacity-70")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{z.name}</h3>
                      <span className="font-mono text-xs text-muted-foreground">{z.code}</span>
                      {z.isDefault && <Badge tone="dark">Default</Badge>}
                      {!z.isActive && <Badge>Inactive</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">Delivers in {z.estimatedDays}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon-sm" variant="ghost" onClick={() => setEditing(z)} aria-label="Edit"><Pencil className="size-4" /></Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => setDeleting(z)} aria-label="Delete"><Trash2 className="size-4 text-sale" /></Button>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Base charge" value={formatPrice(z.baseCharge)} />
                  <Stat label="Base weight" value={`${z.baseWeightGrams / 1000} kg`} />
                  <Stat label="Extra per kg" value={z.extraChargePerKg ? formatPrice(z.extraChargePerKg) : "—"} />
                  <Stat label="COD charge" value={z.codChargePercent ? `${z.codChargePercent}%` : "None"} />
                </dl>

                <div className="mt-4">
                  {z.districts.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {z.districts.map((d) => <Badge key={d}>{d}</Badge>)}
                    </div>
                  ) : null}
                  {z.isDefault && (
                    <p className={cn("text-xs text-muted-foreground", z.districts.length && "mt-2")}>
                      + every district not listed in another zone ({unlisted} right now)
                    </p>
                  )}
                  {!z.isDefault && !z.districts.length && <p className="text-xs text-warning">No districts — this zone is never used.</p>}
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="min-w-0 space-y-4">
          {data && <ChargeCalculator zones={zones} districts={districts} freeShippingThreshold={threshold} />}
          <Card className="flex gap-3 p-4 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">Free delivery</p>
              <p className="mt-0.5 text-muted-foreground">
                {threshold > 0 ? <>Orders of {formatPrice(threshold)} or more ship free. </> : <>Free delivery is off. </>}
                Change the threshold in{" "}
                <Link href="/admin/settings?tab=checkout" className="font-medium text-foreground underline underline-offset-2">Store settings → Checkout</Link>.
                Coupons can also give free delivery.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <ZoneForm
        zone={editing === "new" ? null : editing}
        zones={zones}
        districts={districts}
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
        message={deleting?.isDefault ? "This is the default zone. Districts not listed elsewhere will have no delivery until you choose a new default." : "Its districts fall back to the default zone. Existing orders are not affected."}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2">
      <dt className="text-[11px] text-muted-foreground uppercase">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

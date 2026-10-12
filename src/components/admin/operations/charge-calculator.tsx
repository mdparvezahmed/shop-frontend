"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/form";
import { Card, CardHeader } from "@/components/ui/misc";
import { formatPrice } from "@/lib/utils";
import type { ShippingZone } from "@/types/admin-operations";
import { chargeForWeight } from "./helpers";

/** Picks the zone the same way the API does: listed district → default zone → last zone. */
function resolveZone(zones: ShippingZone[], district: string) {
  const active = zones.filter((z) => z.isActive);
  const needle = district.toLowerCase();
  return active.find((z) => z.districts.some((d) => d.toLowerCase() === needle)) ?? active.find((z) => z.isDefault) ?? active.at(-1) ?? null;
}

/** Live delivery-charge preview for a district and parcel weight. */
export function ChargeCalculator({ zones, districts, freeShippingThreshold }: { zones: ShippingZone[]; districts: string[]; freeShippingThreshold: number }) {
  const [district, setDistrict] = useState("Dhaka");
  const [weight, setWeight] = useState("500");
  const grams = Math.max(0, Number(weight || 0));
  const zone = resolveZone(zones, district);
  const charge = zone ? chargeForWeight(zone, grams) : null;
  const extraKg = zone ? Math.ceil(Math.max(0, grams - zone.baseWeightGrams) / 1000) : 0;

  return (
    <Card>
      <CardHeader title={<span className="flex items-center gap-2"><Calculator className="size-4" /> Charge calculator</span>} description="See what a customer pays." />
      <div className="space-y-4 px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="District">
            <Select value={district} onChange={(e) => setDistrict(e.target.value)}>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
          <Field label="Weight (g)" hint="A t-shirt ≈ 200 g">
            <Input type="number" min={0} step={100} value={weight} onChange={(e) => setWeight(e.target.value)} />
          </Field>
        </div>
        {zone && charge !== null ? (
          <div className="rounded-lg bg-muted/60 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-muted-foreground">{zone.name}</span>
              <span className="text-2xl font-semibold tabular-nums">{formatPrice(charge)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatPrice(zone.baseCharge)} up to {zone.baseWeightGrams / 1000} kg
              {extraKg > 0 && <> + {extraKg} × {formatPrice(zone.extraChargePerKg)} extra kg</>} · {zone.estimatedDays}
              {zone.codChargePercent > 0 && <> · +{zone.codChargePercent}% COD charge</>}
            </p>
            {freeShippingThreshold > 0 && <p className="mt-1 text-xs text-success">Free when the order subtotal is {formatPrice(freeShippingThreshold)} or more.</p>}
          </div>
        ) : (
          <p className="text-sm text-sale">No active zone — customers cannot check out.</p>
        )}
      </div>
    </Card>
  );
}

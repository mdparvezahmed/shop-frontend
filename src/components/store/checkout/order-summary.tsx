"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/stores/cart-store";
import type { CheckoutQuote } from "@/types";

/** Right-hand summary on the checkout page: items, coupon, totals. */
export function OrderSummary({
  items,
  quote,
  loading,
  couponCode,
  onApplyCoupon,
  onRemoveCoupon,
}: {
  items: CartItem[];
  quote: CheckoutQuote | null;
  loading: boolean;
  couponCode: string;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
}) {
  const [code, setCode] = useState("");
  const totals = quote?.totals;
  const apply = () => code.trim() && onApplyCoupon(code.trim().toUpperCase());

  return (
    <div className="rounded-xl border bg-card p-5 sm:p-6">
      <h2 className="flex items-center justify-between font-sans text-lg font-semibold">
        Order summary {loading && <Spinner className="size-4 text-muted-foreground" />}
      </h2>

      <ul className="mt-4 max-h-80 space-y-4 overflow-y-auto pr-1">
        {items.map((item) => (
          <li key={item.variantId} className="flex gap-3">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
              {item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} className="size-full object-cover" />
              )}
              <span className="absolute -top-0 -right-0 flex size-5 items-center justify-center rounded-bl-md bg-primary text-[11px] font-semibold text-primary-foreground">
                {item.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="line-clamp-2 font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">{[item.color, item.size && `Size ${item.size}`].filter(Boolean).join(" · ")}</p>
            </div>
            <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      {/* Coupon */}
      <div className="mt-5 border-t pt-5">
        {couponCode && quote?.coupon ? (
          <div className="flex items-center justify-between rounded-md border border-dashed border-success bg-success/5 px-3 py-2 text-sm">
            <span className="flex items-center gap-2">
              <Tag className="size-4 text-success" />
              <span><strong className="font-mono">{quote.coupon.code}</strong>{quote.coupon.description && <span className="block text-xs text-muted-foreground">{quote.coupon.description}</span>}</span>
            </span>
            <button type="button" onClick={onRemoveCoupon} className="rounded p-1 hover:bg-muted" aria-label="Remove coupon"><X className="size-4" /></button>
          </div>
        ) : (
          // Not a <form>: this sits inside the checkout form, and forms cannot be nested.
          <div className="flex gap-2">
            <input
              value={code}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                apply();
              }}
              onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coupon code" className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm uppercase placeholder:font-sans placeholder:normal-case focus:border-foreground focus:outline-none" aria-label="Coupon code" />
            <Button variant="outline" onClick={apply}>Apply</Button>
          </div>
        )}
        {couponCode && quote?.couponError && <p className="mt-2 text-xs text-sale">{quote.couponError}</p>}
      </div>

      <dl className="mt-5 space-y-2.5 border-t pt-5 text-sm">
        <Row label="Subtotal" value={formatPrice(totals?.subtotal)} />
        {!!totals?.discount && <Row label="Discount" value={`-${formatPrice(totals.discount)}`} className="text-success" />}
        <Row
          label={quote?.shipping ? `Delivery (${quote.shipping.zone.name})` : "Delivery"}
          value={quote?.shipping ? (quote.shipping.isFree ? "Free" : formatPrice(quote.shipping.charge)) : "Select district"}
          muted={!quote?.shipping}
        />
        {!!totals?.codCharge && <Row label="Cash on delivery charge" value={formatPrice(totals.codCharge)} />}
      </dl>
      <div className="mt-4 flex items-baseline justify-between border-t pt-4">
        <span className="font-semibold">Total</span>
        <span className="text-2xl font-semibold">{formatPrice(totals?.total)}</span>
      </div>
      {quote?.shipping && <p className="mt-1 text-right text-xs text-muted-foreground">Estimated delivery: {quote.shipping.zone.estimatedDays}</p>}
    </div>
  );
}

function Row({ label, value, className, muted }: { label: string; value: string; className?: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${className ?? ""}`}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={muted ? "text-muted-foreground" : "font-medium"}>{value}</dd>
    </div>
  );
}

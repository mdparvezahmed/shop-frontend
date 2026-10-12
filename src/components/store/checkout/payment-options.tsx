"use client";

import { Banknote, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

export function PaymentOptions({
  value,
  onChange,
  codEnabled,
  onlineEnabled,
}: {
  value: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
  codEnabled: boolean;
  onlineEnabled: boolean;
}) {
  const options = [
    codEnabled && {
      value: "COD" as const,
      icon: Banknote,
      title: "Cash on delivery",
      text: "Pay in cash when the parcel arrives.",
    },
    onlineEnabled && {
      value: "SSLCOMMERZ" as const,
      icon: CreditCard,
      title: "Pay online",
      text: "bKash, Nagad, Rocket, Visa, Mastercard & more — secured by SSLCommerz.",
    },
  ].filter(Boolean) as { value: PaymentMethod; icon: typeof Banknote; title: string; text: string }[];

  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4 text-left transition",
            value === o.value ? "border-primary bg-muted/60 ring-1 ring-primary" : "hover:border-foreground/40",
          )}
        >
          <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2", value === o.value ? "border-primary" : "border-input")}>
            {value === o.value && <span className="size-2.5 rounded-full bg-primary" />}
          </span>
          <span>
            <span className="flex items-center gap-2 text-sm font-semibold"><o.icon className="size-4" /> {o.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{o.text}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

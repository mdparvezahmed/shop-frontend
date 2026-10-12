"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { QuantityStepper } from "@/components/ui/quantity";
import { Price } from "@/components/ui/misc";
import { cn, formatPrice } from "@/lib/utils";
import { useCart, type CartItem } from "@/stores/cart-store";

/** One row in the cart drawer / cart page. */
export function CartLineItem({ item, compact, onNavigate }: { item: CartItem; compact?: boolean; onNavigate?: () => void }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const options = [item.color, item.size && `Size ${item.size}`].filter(Boolean).join(" · ");

  return (
    <li className="flex gap-3 py-4 sm:gap-4">
      <Link href={`/products/${item.slug}`} onClick={onNavigate} className={cn("shrink-0 overflow-hidden rounded-md bg-muted", compact ? "h-24 w-20" : "h-28 w-24 sm:h-36 sm:w-28")}>
        {item.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.name} className="size-full object-cover" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/products/${item.slug}`} onClick={onNavigate} className="line-clamp-2 text-sm font-medium hover:underline">
              {item.name}
            </Link>
            {options && <p className="mt-0.5 text-xs text-muted-foreground">{options}</p>}
          </div>
          <button onClick={() => remove(item.variantId)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-sale" aria-label={`Remove ${item.name}`}>
            <Trash2 className="size-4" />
          </button>
        </div>
        <Price price={item.price} compareAtPrice={item.compareAtPrice} size="sm" className="mt-1" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <QuantityStepper size="sm" value={item.quantity} max={Math.min(20, item.maxQuantity)} onChange={(q) => setQuantity(item.variantId, q)} />
          <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
        </div>
        {item.quantity >= item.maxQuantity && <p className="mt-1 text-[11px] text-warning">Only {item.maxQuantity} in stock</p>}
      </div>
    </li>
  );
}

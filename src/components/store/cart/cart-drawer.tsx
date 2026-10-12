"use client";

import Link from "next/link";
import { ShoppingBag, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/overlay";
import { formatPrice } from "@/lib/utils";
import { cartCount, cartSubtotal, useCart } from "@/stores/cart-store";
import { useUi } from "@/stores/ui-store";
import { CartLineItem } from "./cart-line";

/** Slide-out mini cart. Opens when something is added. */
export function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const panel = useUi((s) => s.panel);
  const close = useUi((s) => s.close);
  const items = useCart((s) => s.items);
  const subtotal = cartSubtotal(items);

  return (
    <Sheet
      open={panel === "cart"}
      onClose={close}
      title={`Your cart (${cartCount(items)})`}
      footer={
        items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-base font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Delivery charge is calculated at checkout.</p>
            <div className="grid grid-cols-2 gap-2">
              <ButtonLink href="/cart" variant="outline" size="lg" onClick={close}>View cart</ButtonLink>
              <ButtonLink href="/checkout" size="lg" onClick={close}>Checkout</ButtonLink>
            </div>
          </div>
        )
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="size-6" />}
          title="Your cart is empty"
          description="Find something you love — new drops land every week."
          action={<ButtonLink href="/shop" onClick={close}>Start shopping</ButtonLink>}
        />
      ) : (
        <div>
          {freeShippingThreshold > 0 && <FreeShippingMeter subtotal={subtotal} threshold={freeShippingThreshold} />}
          <ul className="divide-y px-4">
            {items.map((item) => (
              <CartLineItem key={item.variantId} item={item} compact onNavigate={close} />
            ))}
          </ul>
          <div className="px-4 pb-4">
            <Link href="/shop" onClick={close} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Continue shopping
            </Link>
          </div>
        </div>
      )}
    </Sheet>
  );
}

export function FreeShippingMeter({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  const left = threshold - subtotal;
  const progress = Math.min(100, (subtotal / threshold) * 100);
  return (
    <div className="border-b bg-muted/50 px-4 py-3">
      <p className="mb-2 flex items-center gap-2 text-xs">
        <Truck className="size-4" />
        {left > 0 ? (
          <span>
            Add <strong>{formatPrice(left)}</strong> more for <strong>free delivery</strong>
          </span>
        ) : (
          <span className="font-medium text-success">You’ve unlocked free delivery!</span>
        )}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-success transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

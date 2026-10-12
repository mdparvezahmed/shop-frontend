"use client";

import { ShieldCheck, ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { useCartValidation } from "@/hooks/use-cart-validation";
import { useMounted } from "@/hooks/use-debounce";
import { formatPrice } from "@/lib/utils";
import { cartCount, cartSubtotal, useCart } from "@/stores/cart-store";
import { FreeShippingMeter } from "./cart-drawer";
import { CartLineItem } from "./cart-line";

export function CartView({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const mounted = useMounted();
  const items = useCart((s) => s.items);
  useCartValidation();

  if (!mounted) {
    return (
      <div className="container-page py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={<ShoppingBag className="size-6" />} title="Your cart is empty" description="Looks like you haven't added anything yet." action={<ButtonLink href="/shop" size="lg">Start shopping</ButtonLink>} />
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const savings = items.reduce((s, i) => s + (i.compareAtPrice && i.compareAtPrice > i.price ? (i.compareAtPrice - i.price) * i.quantity : 0), 0);

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="text-3xl font-semibold">Shopping cart <span className="text-lg font-normal text-muted-foreground">({cartCount(items)})</span></h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          {freeShippingThreshold > 0 && (
            <div className="mb-2 overflow-hidden rounded-lg border">
              <FreeShippingMeter subtotal={subtotal} threshold={freeShippingThreshold} />
            </div>
          )}
          <ul className="divide-y border-b">
            {items.map((item) => (
              <CartLineItem key={item.variantId} item={item} />
            ))}
          </ul>
        </div>

        <aside className="h-fit rounded-xl border bg-card p-6 lg:sticky lg:top-24">
          <h2 className="font-sans text-lg font-semibold">Order summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-medium">{formatPrice(subtotal)}</dd></div>
            {savings > 0 && <div className="flex justify-between text-success"><dt>You save</dt><dd>-{formatPrice(savings)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="text-muted-foreground">Calculated at checkout</dd></div>
          </dl>
          <div className="mt-5 flex justify-between border-t pt-5 text-base font-semibold">
            <span>Estimated total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">Proceed to checkout</ButtonLink>
          <ButtonLink href="/shop" variant="ghost" className="mt-2 w-full">Continue shopping</ButtonLink>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4" /> Secure checkout · Cash on delivery available
          </p>
        </aside>
      </div>
    </div>
  );
}

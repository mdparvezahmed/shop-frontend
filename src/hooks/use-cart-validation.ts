"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { checkoutApi } from "@/services/shop";
import { cartPayload, useCart } from "@/stores/cart-store";

/**
 * Re-prices the saved cart against the server once per page view: updates
 * prices/stock and drops items that are no longer available.
 */
export function useCartValidation() {
  const items = useCart((s) => s.items);
  const sync = useCart((s) => s.sync);
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !items.length) return;
    done.current = true;
    checkoutApi
      .validateCart(cartPayload(items))
      .then(({ lines, issues }) => {
        const removed = issues.filter((i) => i.type !== "QUANTITY_REDUCED").map((i) => i.variantId);
        sync(lines, removed);
        issues.forEach((i) => toast.warning(i.message));
      })
      .catch(() => {});
  }, [items, sync]);
}

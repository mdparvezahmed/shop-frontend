"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { accountApi } from "@/services/shop";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuth } from "./use-auth";

/**
 * Wishlist that works logged-in or not.
 * On login, guest ids are merged into the account once.
 */
export function useWishlist() {
  const { user } = useAuth();
  const ids = useWishlistStore((s) => s.ids);
  const setIds = useWishlistStore((s) => s.set);
  const toggleLocal = useWishlistStore((s) => s.toggle);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const local = useWishlistStore.getState().ids;
      let server = await accountApi.wishlistIds().catch(() => null);
      if (!server) return;
      for (const id of local.filter((id) => !server!.includes(id))) {
        server = await accountApi.addToWishlist(id).catch(() => server);
      }
      if (!cancelled) setIds(server!);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, setIds]);

  const toggle = async (productId: string) => {
    const added = toggleLocal(productId);
    toast.success(added ? "Added to wishlist" : "Removed from wishlist");
    if (user) {
      try {
        setIds(added ? await accountApi.addToWishlist(productId) : await accountApi.removeFromWishlist(productId));
      } catch {
        toggleLocal(productId);
        toast.error("Could not update your wishlist");
      }
    }
  };

  return { ids, has: (id: string) => ids.includes(id), toggle };
}

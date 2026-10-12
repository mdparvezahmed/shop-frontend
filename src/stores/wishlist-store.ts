"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Wishlist product ids. Guests keep them in localStorage; when logged in the
 * list is mirrored to the account (see hooks/use-wishlist.ts).
 */
type WishlistState = {
  ids: string[];
  set: (ids: string[]) => void;
  toggle: (id: string) => boolean;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      set: (ids) => set({ ids }),
      toggle: (id) => {
        const has = get().ids.includes(id);
        set({ ids: has ? get().ids.filter((x) => x !== id) : [id, ...get().ids] });
        return !has;
      },
    }),
    { name: "ut-wishlist" },
  ),
);

/** Recently viewed product slugs, newest first. */
type RecentState = { slugs: string[]; push: (slug: string) => void };

export const useRecentlyViewed = create<RecentState>()(
  persist(
    (set, get) => ({
      slugs: [],
      push: (slug) => set({ slugs: [slug, ...get().slugs.filter((s) => s !== slug)].slice(0, 12) }),
    }),
    { name: "ut-recent" },
  ),
);

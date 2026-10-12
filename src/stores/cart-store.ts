"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Shopping cart, saved in localStorage so it survives reloads and works for guests.
 * Prices here are for display only; the server re-prices everything at checkout.
 */
export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  size: string | null;
  color: string | null;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  /** Stock when added; caps the quantity stepper */
  maxQuantity: number;
};

const MAX_PER_LINE = 20;

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  /** Apply fresh prices/stock from /cart/validate */
  sync: (lines: { variantId: string; unitPrice: number; compareAtPrice: number | null; available: number; quantity: number }[], removedIds: string[]) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      add: (item, quantity = 1) =>
        set((state) => {
          const limit = Math.min(MAX_PER_LINE, item.maxQuantity);
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId ? { ...i, ...item, quantity: Math.min(limit, i.quantity + quantity) } : i,
              ),
            };
          }
          return { items: [{ ...item, quantity: Math.min(limit, quantity) }, ...state.items] };
        }),

      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxQuantity, MAX_PER_LINE)) } : i,
          ),
        })),

      remove: (variantId) => set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),

      clear: () => set({ items: [] }),

      sync: (lines, removedIds) =>
        set((state) => ({
          items: state.items
            .filter((i) => !removedIds.includes(i.variantId))
            .map((i) => {
              const line = lines.find((l) => l.variantId === i.variantId);
              return line
                ? { ...i, price: line.unitPrice, compareAtPrice: line.compareAtPrice, maxQuantity: line.available, quantity: Math.min(i.quantity, line.available) }
                : i;
            }),
        })),
    }),
    { name: "ut-cart", version: 1 },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((s, i) => s + i.price * i.quantity, 0);
export const cartPayload = (items: CartItem[]) => items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));

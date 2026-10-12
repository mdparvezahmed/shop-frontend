"use client";

/**
 * Remembers the order just placed on this device so the confirmation page
 * (also reached after the SSLCommerz redirect) can show it without a login.
 */
const KEY = "ut-last-order";

export type LastOrder = { orderNumber: string; phone: string };

export function saveLastOrder(order: LastOrder) {
  try {
    localStorage.setItem(KEY, JSON.stringify(order));
  } catch {}
}

export function readLastOrder(): LastOrder | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LastOrder) : null;
  } catch {
    return null;
  }
}

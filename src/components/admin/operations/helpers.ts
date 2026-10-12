import { ApiError } from "@/lib/api/client";
import type { OrderStatus } from "@/types";

/** Small helpers shared by the operations admin screens. */

/** Human labels for order statuses in filters and buttons. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Packing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

/** What happens when an order moves to a status (shown next to the buttons). */
export const ORDER_STATUS_HINT: Record<OrderStatus, string> = {
  PENDING: "Waiting for confirmation",
  CONFIRMED: "Customer confirmed by phone",
  PROCESSING: "Items are being packed",
  SHIPPED: "Handed to the courier",
  DELIVERED: "Customer received it — COD orders are marked paid",
  CANCELLED: "Stops the order and puts items back in stock",
  RETURNED: "Parcel came back — items go back in stock",
};

export const PAYMENT_METHOD_LABEL = { COD: "Cash on delivery", SSLCOMMERZ: "Online (SSLCommerz)" } as const;

/** "01712-345678" → "8801712345678" for wa.me links. Returns null for non-BD numbers. */
export function whatsappNumber(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (/^8801\d{9}$/.test(digits)) return digits;
  if (/^01\d{9}$/.test(digits)) return `88${digits}`;
  if (/^1\d{9}$/.test(digits)) return `880${digits}`;
  return digits.length >= 10 ? digits : null;
}

export function whatsappLink(phone: string | null | undefined, text?: string) {
  const n = whatsappNumber(phone);
  if (!n) return null;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** "2026-10-06" → "6 Oct", "2026-10" → "Oct 26" (chart axis labels). */
export function shortDateLabel(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const month = new Date(Date.UTC(y, (m || 1) - 1, d || 1)).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return d ? `${d} ${month}` : `${month} ${String(y).slice(2)}`;
}

/** True when the API refused the action because of the user's role. */
export const isForbidden = (e: unknown) => e instanceof ApiError && e.status === 403;

/** Builds a CSV string, quoting every cell. */
export function toCsv(rows: (string | number | null | undefined)[][]) {
  return rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

/** Starts a browser download of a text file. */
export function downloadText(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob(["﻿", content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Delivery charge — same formula as the API: base + every started kg above the base weight. */
export function chargeForWeight(zone: { baseCharge: number; baseWeightGrams: number; extraChargePerKg: number }, weightGrams: number) {
  const extra = Math.max(0, weightGrams - zone.baseWeightGrams);
  return zone.baseCharge + Math.ceil(extra / 1000) * zone.extraChargePerKg;
}

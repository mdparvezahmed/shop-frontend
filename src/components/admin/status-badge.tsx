import { Badge, type BadgeTone } from "@/components/ui/misc";

/** Consistent colours for every status shown in the admin. */
const TONES: Record<string, BadgeTone> = {
  // Orders
  PENDING: "warning",
  CONFIRMED: "info",
  PROCESSING: "accent",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  RETURNED: "neutral",
  // Payments
  UNPAID: "neutral",
  PAID: "success",
  FAILED: "danger",
  REFUNDED: "neutral",
  // Products
  ACTIVE: "success",
  DRAFT: "neutral",
  ARCHIVED: "danger",
  // Reviews / users
  APPROVED: "success",
  REJECTED: "danger",
  BLOCKED: "danger",
};

const LABELS: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Packing",
  SHIPPED: "Shipped",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const text = label ?? LABELS[status] ?? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
  return <Badge tone={TONES[status] ?? "neutral"}>{text}</Badge>;
}

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"] as const;
export const PAYMENT_STATUSES = ["UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED"] as const;

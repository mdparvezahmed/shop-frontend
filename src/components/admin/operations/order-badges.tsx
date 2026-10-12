import { Banknote, CreditCard } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/misc";
import type { PaymentMethod, PaymentStatus } from "@/types";

/** "COD" / "Online" pill with an icon. */
export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  return method === "COD" ? (
    <Badge>
      <Banknote className="size-3" /> COD
    </Badge>
  ) : (
    <Badge tone="accent">
      <CreditCard className="size-3" /> Online
    </Badge>
  );
}

/** Payment method + payment status, stacked in tables. */
export function PaymentBadges({ method, status }: { method: PaymentMethod; status: PaymentStatus }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <PaymentMethodBadge method={method} />
      <StatusBadge status={status} />
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/overlay";
import { errorMessage } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import { accountApi, checkoutApi } from "@/services/shop";
import type { CustomerOrder } from "@/types";

/** Pay now (online orders not yet paid) and Cancel (before packing). */
export function OrderActions({ order }: { order: CustomerOrder }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState<"pay" | "cancel" | null>(null);

  if (!order.canPay && !order.canCancel) return null;

  const pay = async () => {
    setBusy("pay");
    try {
      const { gatewayUrl } = await checkoutApi.retryPayment(order.orderNumber, order.customerPhone);
      window.location.href = gatewayUrl;
    } catch (e) {
      toast.error(errorMessage(e));
      setBusy(null);
    }
  };

  const cancel = async () => {
    setBusy("cancel");
    try {
      await accountApi.cancelOrder(order.orderNumber);
      toast.success("Order cancelled");
      setConfirm(false);
      router.refresh();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {order.canPay && (
        <Button onClick={pay} loading={busy === "pay"}>Pay {formatPrice(order.dueAmount)} now</Button>
      )}
      {order.canCancel && (
        <Button variant="outline" onClick={() => setConfirm(true)}>Cancel order</Button>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={cancel}
        loading={busy === "cancel"}
        title="Cancel this order?"
        message="The items will be released and the order cannot be restored."
        confirmText="Yes, cancel order"
      />
    </div>
  );
}

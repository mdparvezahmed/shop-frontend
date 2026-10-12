"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { OrderDetails } from "@/components/store/order/order-details";
import { errorMessage } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import { checkoutApi } from "@/services/shop";
import type { CustomerOrder } from "@/types";
import { readLastOrder } from "./last-order";

export function OrderComplete({ orderNumber, payment }: { orderNumber: string | null; payment: string | null }) {
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const last = readLastOrder();
    const number = orderNumber ?? last?.orderNumber;
    if (!number || !last || last.orderNumber !== number) {
      setLoading(false);
      return;
    }
    setPhone(last.phone);
    checkoutApi
      .track(number, last.phone)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderNumber]);

  const retry = async () => {
    if (!order || !phone) return;
    setPaying(true);
    try {
      const { gatewayUrl } = await checkoutApi.retryPayment(order.orderNumber, phone);
      window.location.href = gatewayUrl;
    } catch (error) {
      toast.error(errorMessage(error));
      setPaying(false);
    }
  };

  const failed = payment === "failed" || payment === "cancelled";
  const paidOnline = payment === "success" || order?.paymentStatus === "PAID";

  return (
    <div className="container-page max-w-5xl py-10 sm:py-14">
      <div className="mb-10 flex flex-col items-center text-center">
        {failed && !paidOnline ? (
          <>
            <CircleAlert className="size-14 text-warning" />
            <h1 className="mt-4 text-3xl font-semibold">Payment {payment === "cancelled" ? "cancelled" : "not completed"}</h1>
            <p className="mt-2 max-w-md text-muted-foreground">
              Your order {orderNumber && <strong>#{orderNumber}</strong>} is saved, but we did not receive the payment. You can try again — your items are reserved for now.
            </p>
            {order?.canPay && (
              <Button size="lg" className="mt-6" onClick={retry} loading={paying}>
                Pay {formatPrice(order.dueAmount)} now
              </Button>
            )}
          </>
        ) : (
          <>
            <CheckCircle2 className="size-14 text-success" />
            <h1 className="mt-4 text-3xl font-semibold">Thank you for your order!</h1>
            <p className="mt-2 max-w-md text-muted-foreground">
              {orderNumber ? <>Your order <strong className="font-mono">#{orderNumber}</strong> has been placed. </> : null}
              {paidOnline ? "Your payment was received." : "We'll call you shortly to confirm it."} Save your order number to track the delivery.
            </p>
          </>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/shop" variant="outline">Continue shopping</ButtonLink>
          <ButtonLink href={`/track-order${orderNumber ? `?order=${orderNumber}` : ""}`} variant="ghost">Track order</ButtonLink>
        </div>
      </div>

      {loading ? <Skeleton className="h-96 w-full" /> : order && <OrderDetails order={order} />}
    </div>
  );
}

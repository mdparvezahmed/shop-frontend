"use client";

import { useEffect, useState } from "react";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { errorMessage } from "@/lib/api/client";
import { checkoutApi } from "@/services/shop";
import type { CustomerOrder } from "@/types";
import { readLastOrder } from "@/components/store/checkout/last-order";
import { OrderDetails } from "./order-details";

/** Public order tracking: order number + the phone used at checkout. */
export function TrackOrder({ initialOrderNumber }: { initialOrderNumber: string }) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const last = readLastOrder();
    if (last && (!initialOrderNumber || last.orderNumber === initialOrderNumber)) {
      setOrderNumber(last.orderNumber);
      setPhone(last.phone);
    }
  }, [initialOrderNumber]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      setOrder(await checkoutApi.track(orderNumber.trim(), phone.trim()));
    } catch (err) {
      setOrder(null);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page max-w-5xl py-10 sm:py-14">
      <div className="mx-auto max-w-lg text-center">
        <PackageSearch className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-3xl font-semibold">Track your order</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter the order number from your confirmation and the phone number you used at checkout.</p>
      </div>
      <form onSubmit={submit} className="mx-auto mt-8 grid max-w-lg gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Order number">
          <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value.toUpperCase())} placeholder="UT261012001" className="font-mono" required />
        </Field>
        <Field label="Phone number">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="01XXXXXXXXX" required />
        </Field>
        <Button type="submit" loading={loading} className="h-10">Track</Button>
      </form>
      {error && <p className="mt-4 text-center text-sm text-sale">{error}</p>}
      {order && (
        <div className="mt-12">
          <OrderDetails order={order} />
        </div>
      )}
    </div>
  );
}

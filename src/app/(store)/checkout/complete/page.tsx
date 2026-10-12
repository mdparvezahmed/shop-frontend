import type { Metadata } from "next";
import { OrderComplete } from "@/components/store/checkout/order-complete";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false } };

type Props = { searchParams: Promise<{ order?: string; payment?: string }> };

/** Landing page after checkout — also where SSLCommerz sends the customer back. */
export default async function CheckoutCompletePage({ searchParams }: Props) {
  const { order, payment } = await searchParams;
  return <OrderComplete orderNumber={order ?? null} payment={payment ?? null} />;
}

import type { Metadata } from "next";
import { TrackOrder } from "@/components/store/order/track-order";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Track your order",
  description: "Check the delivery status of your order with your order number and phone number.",
  path: "/track-order",
});

type Props = { searchParams: Promise<{ order?: string }> };

export default async function TrackOrderPage({ searchParams }: Props) {
  const { order } = await searchParams;
  return <TrackOrder initialOrderNumber={order ?? ""} />;
}

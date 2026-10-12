import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout/checkout-form";
import { getLayout } from "@/services/storefront.server";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const { checkout } = await getLayout();
  return <CheckoutForm settings={checkout} />;
}

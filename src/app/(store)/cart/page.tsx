import type { Metadata } from "next";
import { CartView } from "@/components/store/cart/cart-view";
import { getLayout } from "@/services/storefront.server";

export const metadata: Metadata = { title: "Shopping cart", robots: { index: false } };

export default async function CartPage() {
  const { checkout } = await getLayout();
  return <CartView freeShippingThreshold={checkout.freeShippingThreshold} />;
}

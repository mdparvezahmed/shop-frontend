import type { Metadata } from "next";
import { WishlistView } from "@/components/store/account/wishlist-view";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function WishlistPage() {
  return <WishlistView />;
}

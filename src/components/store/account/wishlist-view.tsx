"use client";

import useSWR from "swr";
import { Heart } from "lucide-react";
import { ProductGrid } from "@/components/store/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { useMounted } from "@/hooks/use-debounce";
import { useWishlist } from "@/hooks/use-wishlist";
import { catalogApi } from "@/services/shop";

/** Works for guests (ids in this browser) and logged-in customers (synced to the account). */
export function WishlistView() {
  const mounted = useMounted();
  const { ids } = useWishlist();
  const { data, isLoading } = useSWR(mounted && ids.length ? ["wishlist-products", ids.join(",")] : null, () =>
    catalogApi.products({ ids: ids.join(","), limit: 60 }),
  );
  const products = data?.items.filter((p) => ids.includes(p.id)) ?? [];

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="text-3xl font-semibold">Wishlist</h1>
      <p className="mt-1 text-sm text-muted-foreground">{mounted ? ids.length : 0} saved items</p>
      <div className="mt-8">
        {!mounted || (isLoading && !data) ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5]" />)}</div>
        ) : products.length ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState icon={<Heart className="size-6" />} title="Your wishlist is empty" description="Tap the heart on any product to save it for later." action={<ButtonLink href="/shop">Discover products</ButtonLink>} />
        )}
      </div>
    </div>
  );
}

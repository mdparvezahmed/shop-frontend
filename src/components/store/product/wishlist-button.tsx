"use client";

import { Heart } from "lucide-react";
import { useMounted } from "@/hooks/use-debounce";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, className, withLabel }: { productId: string; className?: string; withLabel?: boolean }) {
  const mounted = useMounted();
  const { has, toggle } = useWishlist();
  const active = mounted && has(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      className={cn("inline-flex items-center justify-center gap-2 transition", className)}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
    >
      <Heart className={cn("size-[18px]", active && "fill-sale text-sale")} />
      {withLabel && <span className="text-sm">{active ? "Saved" : "Wishlist"}</span>}
    </button>
  );
}

import Link from "next/link";
import { Price, RatingStars } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import type { ProductCard as ProductCardData } from "@/types";
import { WishlistButton } from "./wishlist-button";

/**
 * Product tile: 4:5 photo that swaps to the second image on hover,
 * discount / new / sold-out badges, colour dots, price and rating.
 */
export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const href = `/products/${product.slug}`;
  return (
    <article className="group relative flex flex-col">
      <Link href={href} className="relative block aspect-[4/5] overflow-hidden rounded-lg bg-muted" aria-label={product.name}>
        {product.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image.url}
            alt={product.image.alt ?? product.name}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            className={cn("absolute inset-0 size-full object-cover transition duration-500", product.hoverImage && "group-hover:opacity-0", "group-hover:scale-[1.03]")}
          />
        )}
        {product.hoverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.hoverImage.url}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 size-full scale-[1.03] object-cover opacity-0 transition duration-500 group-hover:opacity-100"
          />
        )}

        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {product.discountPercent > 0 && (
            <span className="rounded bg-sale px-1.5 py-0.5 text-[11px] font-semibold text-white">-{product.discountPercent}%</span>
          )}
          {product.isNew && <span className="rounded bg-background/90 px-1.5 py-0.5 text-[11px] font-semibold text-foreground">NEW</span>}
        </div>
        {!product.inStock && (
          <span className="absolute inset-x-2 bottom-2 rounded bg-background/90 py-1 text-center text-xs font-semibold tracking-wide uppercase">
            Out of stock
          </span>
        )}
      </Link>

      <WishlistButton
        productId={product.id}
        className="absolute top-2 right-2 size-9 rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
      />

      <div className="mt-3 flex flex-1 flex-col gap-1">
        {product.colors.length > 1 && (
          <div className="flex items-center gap-1" aria-label={`${product.colors.length} colours`}>
            {product.colors.slice(0, 5).map((c) => (
              <span key={c.name} title={c.name} className="size-3 rounded-full border border-black/10 dark:border-white/20" style={{ backgroundColor: c.hex }} />
            ))}
            {product.colors.length > 5 && <span className="text-[11px] text-muted-foreground">+{product.colors.length - 5}</span>}
          </div>
        )}
        <h3 className="font-sans text-sm leading-snug font-medium">
          <Link href={href} className="line-clamp-2 hover:underline">{product.name}</Link>
        </h3>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} size="sm" />
        {product.rating.count > 0 && (
          <div className="flex items-center gap-1.5">
            <RatingStars value={product.rating.average} size={12} />
            <span className="text-[11px] text-muted-foreground">({product.rating.count})</span>
          </div>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products, className, priorityCount = 0 }: { products: ProductCardData[]; className?: string; priorityCount?: number }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4", className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Ruler, ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Price, RatingStars } from "@/components/ui/misc";
import { QuantityStepper } from "@/components/ui/quantity";
import { cn } from "@/lib/utils";
import { useCart } from "@/stores/cart-store";
import { useUi } from "@/stores/ui-store";
import { useRecentlyViewed } from "@/stores/wishlist-store";
import type { ProductDetail } from "@/types";
import { ProductGallery } from "./product-gallery";
import { SizeChartModal } from "./size-chart-modal";
import { WishlistButton } from "./wishlist-button";

/**
 * Interactive top section of the product page: gallery + options + add to cart.
 * Selecting a colour switches the gallery to that colour's photos.
 */
export function ProductView({ product, deliveryNote }: { product: ProductDetail; deliveryNote: React.ReactNode }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const openPanel = useUi((s) => s.open);
  const pushRecent = useRecentlyViewed((s) => s.push);

  const { sizes, colors } = product.options;
  const [colorId, setColorId] = useState<string | null>(
    colors.find((c) => product.variants.some((v) => v.colorId === c.id && v.stock > 0))?.id ?? colors[0]?.id ?? null,
  );
  const [sizeId, setSizeId] = useState<string | null>(sizes.length === 1 ? sizes[0].id : null);
  const [quantity, setQuantity] = useState(1);
  const [chartOpen, setChartOpen] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => pushRecent(product.slug), [product.slug, pushRecent]);

  const variantFor = (s: string | null, c: string | null) =>
    product.variants.find((v) => (sizes.length ? v.sizeId === s : true) && (colors.length ? v.colorId === c : true));

  const variant = variantFor(sizeId, colorId);
  const stockFor = (s: string) => variantFor(s, colorId)?.stock ?? 0;
  const color = colors.find((c) => c.id === colorId);
  const price = variant?.price ?? product.price;
  const compareAt = variant ? variant.compareAtPrice : product.compareAtPrice;
  const anyStock = product.variants.some((v) => v.stock > 0);

  const images = useMemo(() => {
    const forColor = product.images.filter((i) => i.colorId === colorId);
    const neutral = product.images.filter((i) => !i.colorId);
    const list = forColor.length ? [...forColor, ...neutral] : product.images;
    return list.length ? list : [{ id: "none", url: "", alt: product.name, colorId: null }];
  }, [product.images, colorId, product.name]);

  const addToCart = (buyNow = false) => {
    if (sizes.length && !sizeId) {
      setSizeError(true);
      toast.error("Please select a size");
      return;
    }
    if (!variant || variant.stock <= 0) {
      toast.error("This option is out of stock");
      return;
    }
    add(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: images[0]?.url || product.image?.url || null,
        size: variant.size,
        color: variant.color,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        maxQuantity: variant.stock,
      },
      quantity,
    );
    if (buyNow) router.push("/checkout");
    else {
      toast.success("Added to cart");
      openPanel("cart");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
      <ProductGallery key={colorId ?? "all"} images={images} name={product.name} discount={product.discountPercent} />

      <div className="lg:sticky lg:top-24 lg:self-start">
        <h1 className="text-2xl leading-tight font-semibold sm:text-3xl">{product.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>SKU: {variant?.sku ?? product.sku}</span>
          {product.rating.count > 0 && (
            <a href="#reviews" className="inline-flex items-center gap-1.5 hover:text-foreground">
              <RatingStars value={product.rating.average} /> {product.rating.average} ({product.rating.count} reviews)
            </a>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Price price={price} compareAtPrice={compareAt} size="lg" />
          {compareAt && compareAt > price && (
            <span className="rounded bg-sale/10 px-2 py-0.5 text-xs font-semibold text-sale">
              Save {Math.round(((compareAt - price) / compareAt) * 100)}%
            </span>
          )}
        </div>

        {product.shortDescription && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.shortDescription}</p>}

        {/* Colour */}
        {colors.length > 0 && (
          <div className="mt-6">
            <p className="mb-2.5 text-sm">
              <span className="font-medium">Colour:</span> <span className="text-muted-foreground">{color?.name}</span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {colors.map((c) => {
                const available = product.variants.some((v) => v.colorId === c.id && v.stock > 0);
                return (
                  <button
                    key={c.id}
                    onClick={() => setColorId(c.id)}
                    title={c.name}
                    aria-label={c.name}
                    aria-pressed={c.id === colorId}
                    className={cn(
                      "relative size-9 rounded-full border transition",
                      c.id === colorId ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-110",
                      !available && "opacity-40",
                    )}
                    style={{ backgroundColor: c.hex }}
                  >
                    {!available && <span className="absolute inset-0 m-auto h-px w-full rotate-45 bg-foreground" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Size */}
        {sizes.length > 0 && (
          <div className="mt-6">
            <div className="mb-2.5 flex items-center justify-between">
              <p className={cn("text-sm font-medium", sizeError && "text-sale")}>{sizeError ? "Please select a size" : "Size"}</p>
              {product.sizeChart && (
                <button onClick={() => setChartOpen(true)} className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4">
                  <Ruler className="size-4" /> Size chart
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const stock = stockFor(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSizeId(s.id);
                      setSizeError(false);
                      setQuantity(1);
                    }}
                    disabled={stock <= 0}
                    aria-pressed={s.id === sizeId}
                    className={cn(
                      "h-11 min-w-14 rounded-md border px-4 text-sm font-medium transition",
                      s.id === sizeId ? "border-primary bg-primary text-primary-foreground" : "hover:border-foreground",
                      stock <= 0 && "cursor-not-allowed text-muted-foreground line-through opacity-50",
                    )}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stock */}
        <p className="mt-4 text-sm">
          {!anyStock ? (
            <span className="font-medium text-sale">Out of stock</span>
          ) : variant ? (
            variant.stock <= 0 ? (
              <span className="font-medium text-sale">This option is out of stock</span>
            ) : variant.stock <= 5 ? (
              <span className="font-medium text-warning">Hurry — only {variant.stock} left!</span>
            ) : (
              <span className="text-success">In stock</span>
            )
          ) : (
            <span className="text-muted-foreground">Select options to see availability</span>
          )}
        </p>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <QuantityStepper value={quantity} onChange={setQuantity} max={Math.max(1, Math.min(20, variant?.stock ?? 20))} />
          <Button size="lg" className="h-11 flex-1" onClick={() => addToCart(false)} disabled={!anyStock}>
            <ShoppingBag className="size-4" /> Add to cart
          </Button>
          <WishlistButton productId={product.id} className="size-11 rounded-md border hover:bg-muted" />
        </div>
        <Button size="lg" variant="accent" className="mt-3 h-12 w-full" onClick={() => addToCart(true)} disabled={!anyStock}>
          <Zap className="size-4" /> Buy it now
        </Button>

        <div className="mt-6">{deliveryNote}</div>

        {/* Sticky bar on phones */}
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">{[color?.name, sizes.find((s) => s.id === sizeId)?.name].filter(Boolean).join(" · ") || "Select options"}</p>
            <Price price={price} compareAtPrice={compareAt} size="sm" />
          </div>
          <Button size="lg" className="h-11" onClick={() => addToCart(false)} disabled={!anyStock}>
            <ShoppingBag className="size-4" /> Add to cart
          </Button>
        </div>
      </div>

      {product.sizeChart && <SizeChartModal chart={product.sizeChart} open={chartOpen} onClose={() => setChartOpen(false)} />}
    </div>
  );
}

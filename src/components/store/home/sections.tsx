import Link from "next/link";
import { ArrowRight, RefreshCcw, ShieldCheck, Truck, Wallet } from "lucide-react";
import { ProductGrid } from "@/components/store/product/product-card";
import type { Banner, HomeData, ProductCard } from "@/types";

/** Building blocks of the home page. Each is a server component. */

export function SectionHeading({ title, subtitle, href, linkText = "View all" }: { title: string; subtitle?: string; href?: string; linkText?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-wide uppercase sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium underline-offset-4 hover:underline">
          {linkText} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

export function ProductSection({ title, subtitle, href, products, priorityCount }: { title: string; subtitle?: string; href?: string; products: ProductCard[]; priorityCount?: number }) {
  if (!products.length) return null;
  return (
    <section className="container-page py-10 sm:py-14">
      <SectionHeading title={title} subtitle={subtitle} href={href} />
      <ProductGrid products={products} priorityCount={priorityCount} />
    </section>
  );
}

export function CategoryTiles({ categories }: { categories: HomeData["categories"] }) {
  if (!categories.length) return null;
  return (
    <section className="container-page py-10 sm:py-14">
      <SectionHeading title="Shop by category" />
      <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {categories.map((c) => (
          <Link key={c.id} href={c.href} className="group w-32 shrink-0 snap-start text-center sm:w-auto">
            <div className="aspect-square overflow-hidden rounded-full bg-muted sm:rounded-2xl">
              {c.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt={c.name} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
              )}
            </div>
            <p className="mt-3 text-sm font-medium tracking-wide uppercase">{c.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PromoBanner({ banner }: { banner: Banner }) {
  return (
    <section className="container-page py-6 sm:py-10">
      <Link href={banner.link ?? "/shop"} className="group relative block overflow-hidden rounded-2xl">
        <picture>
          {banner.mobileImage && <source media="(max-width: 767px)" srcSet={banner.mobileImage} />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner.image} alt={banner.title} loading="lazy" className="aspect-square w-full object-cover transition duration-700 group-hover:scale-[1.02] md:aspect-[16/5]" />
        </picture>
        <div className="absolute inset-0 flex items-start p-6 sm:p-10 md:items-center md:p-14">
          <div className="max-w-sm text-white">
            <h2 className="text-2xl font-semibold sm:text-4xl">{banner.title}</h2>
            {banner.subtitle && <p className="mt-2 text-sm text-white/85 sm:text-base">{banner.subtitle}</p>}
            <span className="mt-5 inline-flex h-11 items-center rounded-md bg-white px-6 text-sm font-semibold text-black">
              {banner.buttonText || "Shop now"}
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}

export function TrustBar() {
  const items = [
    { icon: Truck, title: "Fast delivery", text: "1–2 days inside Dhaka" },
    { icon: Wallet, title: "Cash on delivery", text: "All over Bangladesh" },
    { icon: RefreshCcw, title: "Easy exchange", text: "7-day size exchange" },
    { icon: ShieldCheck, title: "Secure payment", text: "bKash, Nagad & cards" },
  ];
  return (
    <section className="border-y bg-muted/40">
      <div className="container-page grid grid-cols-2 gap-6 py-6 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background"><Icon className="size-5" /></span>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { HeroSlider } from "@/components/store/home/hero-slider";
import { CategoryTiles, ProductSection, PromoBanner, TrustBar } from "@/components/store/home/sections";
import { JsonLd } from "@/components/shared/json-ld";
import { itemListJsonLd, pageMetadata } from "@/lib/seo";
import { getHome, getLayout } from "@/services/storefront.server";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getLayout();
  return { ...pageMetadata({ title: seo.title, description: seo.description, path: "/", image: seo.ogImage || null }), title: { absolute: seo.title } };
}

export default async function HomePage() {
  const home = await getHome();
  const [promoA, promoB] = home.banners.promo;

  return (
    <>
      <JsonLd data={itemListJsonLd(home.newArrivals)} />
      <HeroSlider banners={home.banners.hero} />
      <TrustBar />
      <CategoryTiles categories={home.categories} />
      <ProductSection title="New arrivals" subtitle="Fresh drops, just landed" href="/shop?newArrival=true" products={home.newArrivals} priorityCount={4} />
      {promoA && <PromoBanner banner={promoA} />}
      {home.sections.slice(0, 2).map((s) => (
        <ProductSection key={s.id} title={`${s.name} collection`} href={s.href} products={s.products} />
      ))}
      <ProductSection title="Best sellers" subtitle="What everyone is wearing" href="/shop?sort=popular" products={home.bestSellers} />
      {promoB && <PromoBanner banner={promoB} />}
      {home.sections.slice(2).map((s) => (
        <ProductSection key={s.id} title={`${s.name} collection`} href={s.href} products={s.products} />
      ))}
      <ProductSection title="Staff picks" href="/shop?featured=true" products={home.featured} />
    </>
  );
}

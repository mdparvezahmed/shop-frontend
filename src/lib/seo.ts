import type { Metadata } from "next";
import type { Breadcrumb, ProductCard, ProductDetail, StoreLayout } from "@/types";
import { absoluteUrl, plainText } from "./utils";

/**
 * SEO helpers: page metadata (title, description, canonical, Open Graph,
 * Twitter) and schema.org JSON-LD for rich results in Google.
 */

export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  noIndex,
  keywords,
}: {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  noIndex?: boolean;
  keywords?: string[];
}): Metadata {
  const url = absoluteUrl(path);
  const images = image ? [{ url: absoluteUrl(image) }] : undefined;
  return {
    title,
    description: description ?? undefined,
    keywords,
    alternates: { canonical: url },
    openGraph: { title, description: description ?? undefined, url, type, images },
    twitter: { card: image ? "summary_large_image" : "summary", title, description: description ?? undefined, images: image ? [absoluteUrl(image)] : undefined },
    robots: noIndex ? { index: false, follow: true } : undefined,
  };
}

// ─── JSON-LD ─────────────────────────────────────────────────────────────────

export function organizationJsonLd(layout: StoreLayout) {
  const { store } = layout;
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: store.name,
    url: absoluteUrl("/"),
    logo: store.logo ? absoluteUrl(store.logo) : undefined,
    email: store.email,
    telephone: store.phone,
    address: { "@type": "PostalAddress", streetAddress: store.address, addressCountry: "BD" },
    sameAs: Object.values(store.social).filter(Boolean),
    priceRange: "৳৳",
    currenciesAccepted: "BDT",
    paymentAccepted: "Cash, bKash, Nagad, Credit Card",
  };
}

export function websiteJsonLd(name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", href: "/" }, ...items].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

export function productJsonLd(product: ProductDetail, storeName: string) {
  const prices = product.variants.map((v) => v.price);
  const inStock = product.variants.some((v) => v.stock > 0);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seo.description ?? plainText(product.shortDescription || product.description, 500),
    sku: product.sku,
    image: product.images.map((i) => absoluteUrl(i.url)),
    brand: { "@type": "Brand", name: product.brand || storeName },
    category: product.menus[0]?.name,
    material: product.fabric ?? undefined,
    color: product.options.colors.map((c) => c.name).join(", ") || undefined,
    size: product.options.sizes.map((s) => s.name).join(", ") || undefined,
    url: absoluteUrl(`/products/${product.slug}`),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BDT",
      lowPrice: prices.length ? Math.min(...prices) : product.price,
      highPrice: prices.length ? Math.max(...prices) : product.price,
      offerCount: product.variants.length,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: storeName },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "BD" },
      },
    },
    ...(product.rating.count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.average, reviewCount: product.rating.count } }
      : {}),
  };
}

export function itemListJsonLd(products: ProductCard[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/products/${p.slug}`),
      name: p.name,
    })),
  };
}

export const breadcrumbsFrom = (crumbs: Breadcrumb[]) => crumbs.map((c) => ({ name: c.name, href: c.href }));

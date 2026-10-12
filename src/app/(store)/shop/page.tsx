import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { ProductListing } from "@/components/store/listing/product-listing";
import { hasFilters, parseListingParams, type SearchParams } from "@/components/store/listing/params";
import { pageMetadata } from "@/lib/seo";
import { getFacets, getProducts } from "@/services/storefront.server";

type Props = { searchParams: Promise<SearchParams> };

function titleFor(q: ReturnType<typeof parseListingParams>) {
  if (q.newArrival) return "New Arrivals";
  if (q.onSale) return "Offers & Discounts";
  if (q.featured) return "Staff Picks";
  if (q.sort === "popular") return "Best Sellers";
  return "Shop All";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = parseListingParams(await searchParams);
  const title = titleFor(query);
  return pageMetadata({
    title,
    description: `${title} — t-shirts, polos, shirts, hoodies, pants and panjabi. Cash on delivery all over Bangladesh.`,
    path: "/shop",
    noIndex: hasFilters(query) || !!query.newArrival || !!query.onSale || !!query.featured,
  });
}

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const query = parseListingParams(sp);
  const [{ items, meta }, facets] = await Promise.all([getProducts(query), getFacets()]);
  const title = titleFor(query);

  return (
    <ProductListing
      products={items}
      meta={meta}
      facets={facets}
      basePath="/shop"
      searchParams={sp}
      header={
        <div className="mb-8">
          <Breadcrumbs items={[{ name: title, href: "/shop" }]} />
          <h1 className="text-3xl font-semibold tracking-wide uppercase sm:text-4xl">{title}</h1>
        </div>
      }
    />
  );
}

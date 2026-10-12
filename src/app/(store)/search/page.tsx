import type { Metadata } from "next";
import { ProductListing } from "@/components/store/listing/product-listing";
import { parseListingParams, type SearchParams } from "@/components/store/listing/params";
import { pageMetadata } from "@/lib/seo";
import { getFacets, getProducts } from "@/services/storefront.server";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = parseListingParams(await searchParams);
  // Search result pages should not be indexed.
  return pageMetadata({ title: q ? `Search: ${q}` : "Search", path: "/search", noIndex: true });
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const query = parseListingParams(sp);
  const [{ items, meta }, facets] = await Promise.all([getProducts(query), getFacets(undefined, query.q)]);

  return (
    <ProductListing
      products={items}
      meta={meta}
      facets={facets}
      basePath="/search"
      searchParams={sp}
      header={
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Search results</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{query.q ? `“${query.q}”` : "All products"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{meta.total} products found</p>
        </div>
      }
    />
  );
}

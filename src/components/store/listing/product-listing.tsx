import type { ReactNode } from "react";
import { SearchX } from "lucide-react";
import { ProductGrid } from "@/components/store/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Pagination } from "@/components/ui/misc";
import type { Facets, PaginationMeta, ProductCard } from "@/types";
import { FilterSidebar, ListingToolbar } from "./filters";
import { pageHref, type SearchParams } from "./params";

/**
 * Shared layout for /shop, /collections/[slug] and /search:
 * filter sidebar (desktop) / sheet (mobile), sort, grid, crawlable pagination.
 */
export function ProductListing({
  header,
  products,
  meta,
  facets,
  basePath,
  searchParams,
  footer,
}: {
  header: ReactNode;
  products: ProductCard[];
  meta: PaginationMeta;
  facets: Facets;
  basePath: string;
  searchParams: SearchParams;
  footer?: ReactNode;
}) {
  return (
    <div className="container-page py-6 sm:py-10">
      {header}
      <div className="flex gap-10">
        <FilterSidebar facets={facets} />
        <div className="min-w-0 flex-1">
          <ListingToolbar facets={facets} total={meta.total} />
          {products.length ? (
            <>
              <ProductGrid products={products} className="lg:grid-cols-3 xl:grid-cols-4" priorityCount={4} />
              <div className="mt-12">
                <Pagination page={meta.page} totalPages={meta.totalPages} hrefFor={(p) => pageHref(basePath, searchParams, p)} />
              </div>
            </>
          ) : (
            <EmptyState
              icon={<SearchX className="size-6" />}
              title="No products match"
              description="Try removing a filter or browse all products."
              action={<ButtonLink href="/shop" variant="outline">Browse all products</ButtonLink>}
            />
          )}
          {footer}
        </div>
      </div>
    </div>
  );
}

import "server-only";
import { cache } from "react";
import { REVALIDATE } from "@/config/site";
import { serverApi } from "@/lib/api/server";
import type {
  Collection,
  ContentPage,
  CustomerOrder,
  Facets,
  HomeData,
  ProductCard,
  ProductDetail,
  ShippingInfo,
  StoreLayout,
  User,
} from "@/types";

/**
 * Data loaders for storefront Server Components.
 * `cache()` de-duplicates calls within one render (layout + page + metadata).
 */

export type ProductQuery = {
  menu?: string;
  q?: string;
  size?: string[];
  color?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
  newArrival?: boolean;
  onSale?: boolean;
  inStock?: boolean;
};

export const getLayout = cache(() =>
  serverApi.get<StoreLayout>("/storefront/layout", { revalidate: REVALIDATE.layout, tags: ["layout"] }),
);

export const getHome = cache(() => serverApi.get<HomeData>("/storefront/home", { revalidate: REVALIDATE.catalog, tags: ["home"] }));

export const getProducts = cache((query: ProductQuery) =>
  serverApi.paged<ProductCard>("/products", { query, revalidate: REVALIDATE.catalog, tags: ["products"] }),
);

export const getFacets = cache((menu?: string, q?: string) =>
  serverApi.get<Facets>("/products/facets", { query: { menu, q }, revalidate: REVALIDATE.catalog }),
);

export const getProduct = cache((slug: string) =>
  serverApi.getOrNull<ProductDetail>(`/products/${encodeURIComponent(slug)}`, { revalidate: REVALIDATE.product, tags: [`product:${slug}`] }),
);

export const getRelated = cache((slug: string) =>
  serverApi.get<ProductCard[]>(`/products/${encodeURIComponent(slug)}/related`, { revalidate: REVALIDATE.product }),
);

export const getCollection = cache((slug: string) =>
  serverApi.getOrNull<Collection>(`/menus/${encodeURIComponent(slug)}`, { revalidate: REVALIDATE.catalog, tags: [`menu:${slug}`] }),
);

export const getPage = cache((slug: string) =>
  serverApi.getOrNull<ContentPage>(`/pages/${encodeURIComponent(slug)}`, { revalidate: REVALIDATE.content }),
);

export const getShippingInfo = cache(() => serverApi.get<ShippingInfo>("/shipping", { revalidate: REVALIDATE.content }));

export const getSitemap = () =>
  serverApi.get<{ path: string; updatedAt: string }[]>("/storefront/sitemap", { revalidate: 3600 });

/** The logged-in user, or null. Never cached. */
export const getCurrentUser = cache(() => serverApi.getOrNull<User>("/auth/me", { auth: true }));

export const getMyOrder = (orderNumber: string) =>
  serverApi.getOrNull<CustomerOrder>(`/account/orders/${encodeURIComponent(orderNumber)}`, { auth: true });

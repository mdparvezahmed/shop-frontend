import type { ProductQuery } from "@/services/storefront.server";

/** URL search params ⇄ product query. Filters live in the URL so every view is shareable and crawlable. */
export type SearchParams = Record<string, string | string[] | undefined>;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Best selling" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
] as const;

const list = (v: string | string[] | undefined) => (v === undefined ? [] : (Array.isArray(v) ? v : v.split(",")).filter(Boolean));
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | string[] | undefined) => {
  const n = Number(one(v));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
const flag = (v: string | string[] | undefined) => (one(v) === "true" ? true : undefined);

export function parseListingParams(sp: SearchParams): ProductQuery {
  return {
    q: one(sp.q)?.trim() || undefined,
    size: list(sp.size),
    color: list(sp.color),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    sort: one(sp.sort) || "newest",
    page: num(sp.page) ?? 1,
    featured: flag(sp.featured),
    newArrival: flag(sp.newArrival),
    onSale: flag(sp.onSale),
    inStock: flag(sp.inStock),
    limit: 24,
  };
}

/** True when any narrowing filter is active (used to noindex thin filtered pages). */
export function hasFilters(q: ProductQuery) {
  return !!(q.size?.length || q.color?.length || q.minPrice || q.maxPrice || q.inStock || (q.sort && q.sort !== "newest"));
}

export function pageHref(basePath: string, sp: SearchParams, page: number) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "page" || v === undefined) continue;
    (Array.isArray(v) ? v : [v]).forEach((x) => params.append(k, x));
  }
  if (page > 1) params.set("page", String(page));
  const s = params.toString();
  return s ? `${basePath}?${s}` : basePath;
}

"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api/client";
import { toQueryString } from "@/lib/utils";

/**
 * State + data for a paginated admin list.
 *
 *   const list = useAdminList<Coupon>("/admin/coupons", { q: "" });
 *   list.items, list.meta, list.isLoading
 *   list.setFilter("status", "ACTIVE")  // resets to page 1
 *   list.setPage(2)
 *   list.reload()
 *
 * `Extra` types additional fields the endpoint returns next to `items`
 * (for example `statusCounts` on orders/products).
 */
export function useAdminList<T, Extra extends object = object>(
  path: string,
  initialFilters: Record<string, string | number | undefined> = {},
  { limit = 20 }: { limit?: number } = {},
) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);
  const query = { ...filters, page, limit };

  const { data, error, isLoading, mutate } = useSWR(`${path}${toQueryString(query)}`, () => api.list<T, Extra>(path, query), {
    keepPreviousData: true,
  });

  return {
    items: data?.items,
    meta: data?.meta,
    extra: data?.extra,
    error,
    isLoading,
    page,
    filters,
    setPage,
    setFilter: (name: string, value: string | number | undefined) => {
      setFilters((f) => ({ ...f, [name]: value }));
      setPage(1);
    },
    reload: () => mutate(),
  };
}

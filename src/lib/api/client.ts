"use client";

import { API_PREFIX } from "@/config/site";
import type { ApiFailure, ApiSuccess, PaginationMeta } from "@/types";
import { toQueryString } from "@/lib/utils";

/**
 * Browser API client. Calls go to /api/v1/* on this origin and are proxied to
 * the backend by next.config.ts, so the httpOnly session cookie just works.
 *
 *   const product = await api.get<ProductDetail>("/products/slug");
 *   const { items, meta } = await api.paged<Order>("/admin/orders", { page: 2 });
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Field errors from a 422 response: { phone: ["Enter a valid …"] } */
  get fieldErrors(): Record<string, string[]> {
    return this.details && typeof this.details === "object" && !Array.isArray(this.details)
      ? (this.details as Record<string, string[]>)
      : {};
  }
}

type Query = Record<string, unknown>;

async function request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<ApiSuccess<T>> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(`${API_PREFIX}${path}${query ? toQueryString(query) : ""}`, {
    method,
    credentials: "include",
    headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });

  let json: ApiSuccess<T> | ApiFailure;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(res.ok ? "Unexpected response from server" : `Request failed (${res.status})`, res.status);
  }

  if (!res.ok || !json.success) {
    const err = (json as ApiFailure).error;
    throw new ApiError(err?.message ?? "Something went wrong", res.status, err?.details, err?.code);
  }
  return json;
}

export const api = {
  get: async <T>(path: string, query?: Query) => (await request<T>("GET", path, undefined, query)).data,
  post: async <T>(path: string, body?: unknown) => (await request<T>("POST", path, body ?? {})).data,
  put: async <T>(path: string, body?: unknown) => (await request<T>("PUT", path, body ?? {})).data,
  patch: async <T>(path: string, body?: unknown) => (await request<T>("PATCH", path, body ?? {})).data,
  delete: async <T>(path: string) => (await request<T>("DELETE", path)).data,
  upload: async <T>(path: string, form: FormData) => (await request<T>("POST", path, form)).data,

  /** For paginated list endpoints: returns the items plus pagination meta. */
  paged: async <T>(path: string, query?: Query): Promise<{ items: T[]; meta: PaginationMeta }> => {
    const res = await request<T[]>("GET", path, undefined, query);
    return { items: res.data, meta: res.meta! };
  },

  /**
   * Any list endpoint, whether it returns a bare array or `{ items, ...extra }`.
   * Always resolves to `{ items, meta, extra }`.
   */
  list: async <T, E extends object = object>(path: string, query?: Query) => {
    const res = await request<T[] | ({ items: T[] } & E)>("GET", path, undefined, query);
    if (Array.isArray(res.data)) return { items: res.data, meta: res.meta, extra: {} as E };
    const { items, ...extra } = res.data;
    return { items, meta: res.meta, extra: extra as unknown as E };
  },

  /** For endpoints that return { items, ...extra } plus meta (admin lists with counts). */
  pagedWith: async <T extends { items: unknown[] }>(path: string, query?: Query): Promise<T & { meta: PaginationMeta }> => {
    const res = await request<T>("GET", path, undefined, query);
    return { ...res.data, meta: res.meta! };
  },
};

/** SWR fetcher: useSWR("/admin/orders?page=1", fetcher) */
export const fetcher = <T>(path: string) => api.get<T>(path);

/** Human message for any thrown value. */
export function errorMessage(error: unknown, fallback = "Something went wrong") {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

import "server-only";
import { cookies } from "next/headers";
import { API_PREFIX, BACKEND_URL } from "@/config/site";
import type { ApiFailure, ApiSuccess, PaginationMeta } from "@/types";
import { toQueryString } from "@/lib/utils";

/**
 * Server-side API client for Server Components, route handlers and metadata.
 * Talks to the backend directly (no rewrite hop).
 *
 *   revalidate: seconds to cache public data (catalog pages)
 *   auth:       forward the visitor's cookies (account pages); never cached
 */
type Options = {
  query?: Record<string, unknown>;
  revalidate?: number;
  auth?: boolean;
  tags?: string[];
};

export class ServerApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

const RETRY_DELAY_MS = 500;

async function call<T>(path: string, opts: Options = {}): Promise<ApiSuccess<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.auth) headers.cookie = (await cookies()).toString();

  const url = `${BACKEND_URL}${API_PREFIX}${path}${opts.query ? toQueryString(opts.query) : ""}`;
  const init: RequestInit = {
    headers,
    ...(opts.auth || opts.revalidate === undefined
      ? { cache: "no-store" as const }
      : { next: { revalidate: opts.revalidate, tags: opts.tags } }),
  };

  // Retry once on a network error or 5xx: the database briefly runs out of
  // connections under load, and a second attempt usually gets one.
  let res: Response;
  try {
    res = await fetch(url, init);
    if (res.status >= 500) throw new Error(`API ${res.status}`);
  } catch {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    res = await fetch(url, init);
  }

  const json = (await res.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;
  if (!res.ok || !json || !json.success) {
    throw new ServerApiError((json as ApiFailure | null)?.error?.message ?? `API ${res.status}`, res.status);
  }
  return json;
}

export const serverApi = {
  async get<T>(path: string, opts?: Options): Promise<T> {
    return (await call<T>(path, opts)).data;
  },

  /** Returns null instead of throwing on 404 — use with notFound(). */
  async getOrNull<T>(path: string, opts?: Options): Promise<T | null> {
    try {
      return (await call<T>(path, opts)).data;
    } catch (error) {
      if (error instanceof ServerApiError && (error.status === 404 || error.status === 401)) return null;
      throw error;
    }
  },

  async paged<T>(path: string, opts?: Options): Promise<{ items: T[]; meta: PaginationMeta }> {
    const res = await call<T[]>(path, opts);
    return { items: res.data, meta: res.meta! };
  },
};

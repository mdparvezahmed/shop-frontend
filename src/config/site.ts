/** App-wide constants read from the environment. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100").replace(/\/$/, "");

/** Server-side only: where the API runs. The browser uses the /api rewrite instead. */
export const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/$/, "");

export const API_PREFIX = "/api/v1";

/** Seconds that catalog data may be cached on the server before it is refreshed. */
export const REVALIDATE = {
  layout: 60,
  catalog: 60,
  product: 60,
  content: 300,
} as const;

export const CURRENCY = "৳";

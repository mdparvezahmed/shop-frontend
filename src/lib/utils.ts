import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCY, SITE_URL } from "@/config/site";

/** Merge Tailwind classes, later ones win: cn("p-2", cond && "p-4") */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const numberFormat = new Intl.NumberFormat("en-IN");

/** 1250 → "৳1,250" */
export function formatPrice(amount: number | null | undefined) {
  return `${CURRENCY}${numberFormat.format(Math.round(amount ?? 0))}`;
}

export function formatNumber(n: number) {
  return numberFormat.format(n);
}

export function formatDate(value: string | Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", ...opts }).format(new Date(value));
}

export function formatDateTime(value: string | Date) {
  return formatDate(value, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/** "/products/x" → "https://site.com/products/x" (for canonical URLs, OG, JSON-LD) */
export function absoluteUrl(path = "/") {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function plainText(html: string | null | undefined, max = 160) {
  if (!html) return "";
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Builds "?a=1&b=2" from an object, skipping empty values. Arrays become repeated keys. */
export function toQueryString(params: Record<string, unknown>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) value.forEach((v) => search.append(key, String(v)));
    else search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

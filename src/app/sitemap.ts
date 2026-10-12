import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";
import { getSitemap } from "@/services/storefront.server";

/** /sitemap.xml — every product, collection and page, with last-modified dates. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getSitemap().catch(() => []);
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/shop"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/track-order"), changeFrequency: "yearly", priority: 0.3 },
    ...entries.map((e) => ({
      url: absoluteUrl(e.path),
      lastModified: new Date(e.updatedAt),
      changeFrequency: (e.path.startsWith("/products") ? "weekly" : "daily") as "weekly" | "daily",
      priority: e.path.startsWith("/collections") ? 0.8 : e.path.startsWith("/products") ? 0.7 : 0.4,
    })),
  ];
}

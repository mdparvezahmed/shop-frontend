import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/account", "/cart", "/checkout", "/wishlist", "/login", "/register", "/search"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

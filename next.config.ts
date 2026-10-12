import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Uploads are already resized + converted to WebP by the backend.
    unoptimized: true,
  },
  /**
   * The browser talks to one origin only. API calls and uploaded images are
   * proxied to the backend, so the session cookie is first-party and no CORS
   * setup is needed.
   */
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/uploads/:path*", destination: `${BACKEND_URL}/uploads/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The service worker must never be served stale, or clients get stuck on an
  // old SW and miss updates.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;

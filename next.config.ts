import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Fully static site → export to `out/` for Cloudflare Pages (no server runtime).
  output: "export",
  images: { unoptimized: true },
  // The rewrites below are only needed by the local dev server (`next dev`) to
  // serve /tools/<slug>/index.html at /tools/<slug>/. The static export and
  // Cloudflare Pages serve directory `index.html` natively, and rewrites aren't
  // compatible with `output: export` — so they're dev-only.
  ...(dev
    ? {
        async rewrites() {
          return [
            { source: "/tools/:slug", destination: "/tools/:slug/index.html" },
            { source: "/tools/:slug/", destination: "/tools/:slug/index.html" },
          ];
        },
      }
    : {}),
};

export default nextConfig;

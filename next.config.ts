import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Type-check every internal <Link href> against the routes that actually exist.
  typedRoutes: true,
};

export default nextConfig;

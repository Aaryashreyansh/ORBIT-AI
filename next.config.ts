import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ProductOS live preview (next dev) only; no effect on production builds.
  ...(process.env.NODE_ENV === "development"
    ? { allowedDevOrigins: ["*.preview.bl.run"], experimental: { serverActions: { allowedOrigins: ["*.preview.bl.run"] } }, images: { unoptimized: true } }
    : {}),
  poweredByHeader: false,
  reactStrictMode: true
};

export default nextConfig;

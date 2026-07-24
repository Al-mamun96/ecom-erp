import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build a self-contained server bundle for VPS deploy (node .next/standalone/server.js).
  output: "standalone",
};

export default nextConfig;

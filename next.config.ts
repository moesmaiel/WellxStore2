import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Both database drivers load native/WASM assets at runtime and must not be
  // put through the bundler.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@rumess/nepse-api"],
  // The package loads css.wasm and JSON data at runtime using paths relative
  // to its installed files; make sure Vercel includes those assets.
  outputFileTracingIncludes: {
    "/api/market": ["./node_modules/@rumess/nepse-api/dist/data/**/*"],
  },
};

export default nextConfig;

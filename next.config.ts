import type { NextConfig } from "next";
import type { webpack } from "next/dist/compiled/webpack/webpack";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/market": ["./.next/server/data/css.wasm"],
    "/api/stocks/[symbol]": ["./.next/server/data/css.wasm"],
  },
  webpack(config, { isServer }) {
    if (isServer) {
      config.plugins.push({
        apply(compiler: webpack.Compiler) {
          compiler.hooks.afterEmit.tap("CopyNepseWasm", () => {
            // @rumess/nepse-api resolves this asset relative to the emitted
            // shared server chunk at .next/server/chunks, so it must live in
            // .next/server/data for both the local server and Vercel function.
            const outputFile = join(process.cwd(), ".next/server/data/css.wasm");
            mkdirSync(dirname(outputFile), { recursive: true });
            copyFileSync(
              join(process.cwd(), "node_modules/@rumess/nepse-api/dist/data/css.wasm"),
              outputFile,
            );
          });
        },
      });
    }
    return config;
  },
};

export default nextConfig;

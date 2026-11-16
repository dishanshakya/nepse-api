import type { NextConfig } from "next";
import type { webpack } from "next/dist/compiled/webpack/webpack";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/market": ["./.next/server/app/api/data/css.wasm"],
  },
  webpack(config, { isServer }) {
    if (isServer) {
      config.plugins.push({
        apply(compiler: webpack.Compiler) {
          compiler.hooks.afterEmit.tap("CopyNepseWasm", () => {
            // When bundled, @rumess/nepse-api resolves this path relative to
            // the emitted route chunk. Copy the package asset to that location.
            const outputFile = join(process.cwd(), ".next/server/app/api/data/css.wasm");
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

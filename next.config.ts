import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The Slack approval card inlines this file at runtime; make sure it ships with the MCP route.
  outputFileTracingIncludes: {
    "/api/mcp": ["./node_modules/@modelcontextprotocol/ext-apps/dist/src/app-with-deps.js"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

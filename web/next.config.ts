import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Engine lives in ../src/core — allow the app to import outside web/
  outputFileTracingRoot: path.join(__dirname, ".."),
  turbopack: {
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;

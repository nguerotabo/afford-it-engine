import os from "os";
import path from "path";
import type { NextConfig } from "next";

/** Phone-on-LAN: Next 16 blocks /_next JS from any host that isn't localhost. */
function lanDevOrigins(): string[] {
  const origins = new Set<string>(["localhost", "127.0.0.1"]);
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.internal) continue;
      if (addr.family === "IPv4") {
        origins.add(addr.address);
      }
    }
  }
  return [...origins];
}

const nextConfig: NextConfig = {
  allowedDevOrigins: lanDevOrigins(),
  // Engine lives in ../src/core — allow the app to import outside web/
  outputFileTracingRoot: path.join(__dirname, ".."),
  turbopack: {
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;

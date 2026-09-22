import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root (a stray lockfile in a parent dir confuses detection).
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;

// Enables Cloudflare bindings (env vars, etc.) during `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();

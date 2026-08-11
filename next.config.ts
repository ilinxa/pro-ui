import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Virtual-browser (Docker stealth-browser MCP) reaches the dev server via
  // host.docker.internal — allow it so browser-based runtime verification can
  // drive local dev, not only production URLs.
  allowedDevOrigins: ["host.docker.internal"],
};

export default nextConfig;

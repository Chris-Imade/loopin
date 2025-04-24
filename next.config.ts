import type { NextConfig } from "next";
import { env } from "process";

const nextConfig: NextConfig = {
  allowedDevOrigins: env.REPLIT_DOMAINS
    ? [env.REPLIT_DOMAINS.split(",")[0]]
    : undefined,
};

module.exports = nextConfig;

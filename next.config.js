import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import withSerwistInit from "@serwist/next";

function getRevision() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" });
  const rev = result.stdout?.trim();
  if (result.status === 0 && rev) return rev;
  return crypto.randomUUID();
}

const revision = getRevision();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/offline", revision }],
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default withSerwist(nextConfig);

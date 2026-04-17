/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    // Windows + filesystem cache can occasionally corrupt .next chunks in dev.
    // Disable persistent caching in dev to keep the dev server stable.
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;


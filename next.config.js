// Lets `next dev` access Cloudflare bindings (D1, KV) via getCloudflareContext().
// Only affects local development; has no effect on the deployed Worker.
const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true }, // Cloudflare Images integration can replace this later if needed
};

module.exports = nextConfig;

import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-url";

// Reads the request's Host header, so this must run per-request rather
// than be baked in at build time.
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await resolveSiteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/admin" }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next";
import { getRecentPublicPosts } from "@/lib/public-posts";
import { resolveSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await resolveSiteUrl();
  const posts = await getRecentPublicPosts(200);

  const staticPages = ["", "/blog", "/about", "/contact", "/archive"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  const postPages = posts.map((p) => ({
    url: `${siteUrl}/blog/${p.slug}`,
    lastModified: new Date(p.published_at),
  }));

  return [...staticPages, ...postPages];
}

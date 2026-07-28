import { getRecentPublicPosts } from "@/lib/public-posts";
import { getSettings } from "@/lib/settings";
import { resolveSiteUrl } from "@/lib/site-url";

// Reads D1 (posts, settings) and the request's Host header, so this must
// run per-request in the Worker, never be evaluated during `next build`.
export const dynamic = "force-dynamic";

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

export async function GET() {
  const [settings, posts, siteUrl] = await Promise.all([
    getSettings(),
    getRecentPublicPosts(30),
    resolveSiteUrl(),
  ]);

  const items = posts
    .map(
      (p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${siteUrl}/blog/${p.slug}</link>
      <guid>${siteUrl}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
      <description>${escapeXml(p.excerpt ?? "")}</description>
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${escapeXml(settings.site_title)}</title>
  <link>${siteUrl}</link>
  <description>${escapeXml(settings.site_description)}</description>
  ${items}
</channel></rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}

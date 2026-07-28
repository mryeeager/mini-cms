import { headers } from "next/headers";
import { getEnvSafe, DEFAULT_SITE_URL } from "./db";

/**
 * Resolves the public site URL for use in robots.txt, sitemap.xml, and
 * rss.xml.
 *
 * Order of preference:
 * 1. The `SITE_URL` var in wrangler.jsonc, if you've set one (useful when
 *    running behind a custom domain/proxy where the Host header doesn't
 *    match the public URL).
 * 2. The incoming request's Host header — this is correct out of the box
 *    on `*.workers.dev` and on any custom domain, with zero configuration
 *    and no placeholder value to remember to replace.
 * 3. A generic fallback, only reachable if neither of the above is
 *    available (e.g. build time — callers using this should be marked
 *    `export const dynamic = "force-dynamic"` so that doesn't happen at
 *    request time).
 */
export async function resolveSiteUrl(): Promise<string> {
  const envUrl = getEnvSafe()?.SITE_URL;
  if (envUrl) return envUrl;

  try {
    const h = await headers();
    const host = h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? "https";
      return `${proto}://${host}`;
    }
  } catch {
    // headers() isn't available outside a request context (e.g. build time).
  }

  return DEFAULT_SITE_URL;
}

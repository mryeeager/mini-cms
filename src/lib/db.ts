import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface Env {
  DB: D1Database;
  MEDIA_KV: KVNamespace;
  SITE_URL: string;
  MAX_STORAGE_MB: string;
  SESSION_SECRET: string;
}

/** Used as a fallback whenever the real SITE_URL var isn't reachable (build time, etc). */
export const DEFAULT_SITE_URL = "https://your-site.workers.dev";

/**
 * Safely access Cloudflare bindings (D1, KV, vars, secrets).
 * Returns `null` instead of throwing when the Workers runtime isn't
 * available — e.g. during `next build` / static prerendering, where
 * `getCloudflareContext()` has nothing to attach to yet.
 *
 * Prefer this over `getEnv()` in any Server Component, layout, or
 * `generateMetadata` that Next.js might try to prerender at build time.
 */
export function getEnvSafe(): Env | null {
  try {
    const ctx = getCloudflareContext();
    return (ctx?.env as unknown as Env) ?? null;
  } catch {
    // No Cloudflare runtime available (build time, or plain `next start`).
    return null;
  }
}

/**
 * Access Cloudflare bindings (D1, KV, vars, secrets).
 * Throws if the Workers runtime isn't available.
 *
 * Only call this from code paths that exclusively run at request time
 * inside the Worker (Route Handlers, Server Actions). Never call it from
 * a Server Component, layout, or `generateMetadata` that Next.js could
 * try to statically render during `next build` — use `getEnvSafe()` there
 * instead.
 */
export function getEnv(): Env {
  const env = getEnvSafe();
  if (!env) {
    throw new Error(
      "Cloudflare env is not available. This usually means getEnv() was called during build/prerender " +
        "instead of at request time. Use getEnvSafe() (or a helper with a safe fallback) in code that " +
        "Next.js might statically render."
    );
  }
  return env;
}

/** Throws if D1 isn't available. Only call at request time (API routes, Server Actions). */
export function getDB(): D1Database {
  return getEnv().DB;
}

/** Returns D1 or `null` if the Workers runtime isn't available (e.g. build time). */
export function getDBSafe(): D1Database | null {
  return getEnvSafe()?.DB ?? null;
}

/** Site URL with a safe fallback for build time / missing runtime. */
export function getSiteUrl(): string {
  return getEnvSafe()?.SITE_URL || DEFAULT_SITE_URL;
}

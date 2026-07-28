import { getDB, getDBSafe } from "./db";

export const DEFAULT_SETTINGS = {
  site_title: "وبلاگ من",
  site_description: "یادداشت‌ها و نوشته‌های شخصی",
  about_content: "درباره‌ی من چیزی هنوز نوشته نشده — از پنل مدیریت ویرایش کن.",
  contact_email: "",
};

export type SiteSettings = typeof DEFAULT_SETTINGS;

/**
 * Safe to call from anywhere, including Server Components/layouts/
 * generateMetadata that Next.js might prerender at build time.
 * Falls back to DEFAULT_SETTINGS when D1 isn't reachable (build time)
 * or when the query itself fails for any reason.
 */
export async function getSettings(): Promise<SiteSettings> {
  const db = getDBSafe();
  if (!db) return DEFAULT_SETTINGS;

  try {
    const { results } = await db.prepare(`SELECT key, value FROM settings`).all<{
      key: string;
      value: string;
    }>();
    const map = Object.fromEntries(results.map((r) => [r.key, r.value]));
    return { ...DEFAULT_SETTINGS, ...map };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(partial: Partial<SiteSettings>) {
  const db = getDB();
  for (const [key, value] of Object.entries(partial)) {
    await db
      .prepare(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      )
      .bind(key, value)
      .run();
  }
}

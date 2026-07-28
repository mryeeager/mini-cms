import { getDB } from "./db";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

/** Throws if the key (ip or username) is currently locked out. */
export async function assertNotLocked(key: string) {
  const db = getDB();
  const row = await db
    .prepare(`SELECT attempts, locked_until FROM login_attempts WHERE key = ?`)
    .bind(key)
    .first<{ attempts: number; locked_until: string | null }>();

  if (row?.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
    throw new Error("LOCKED");
  }
}

export async function recordFailedAttempt(key: string) {
  const db = getDB();
  const row = await db
    .prepare(`SELECT attempts FROM login_attempts WHERE key = ?`)
    .bind(key)
    .first<{ attempts: number }>();

  const attempts = (row?.attempts ?? 0) + 1;
  const lockedUntil =
    attempts >= MAX_ATTEMPTS
      ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString()
      : null;

  await db
    .prepare(
      `INSERT INTO login_attempts (key, attempts, locked_until, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET attempts = ?, locked_until = ?, updated_at = datetime('now')`
    )
    .bind(key, attempts, lockedUntil, attempts, lockedUntil)
    .run();
}

export async function clearAttempts(key: string) {
  await getDB().prepare(`DELETE FROM login_attempts WHERE key = ?`).bind(key).run();
}

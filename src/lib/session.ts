import { cookies } from "next/headers";
import { getDB } from "./db";
import { randomToken } from "./crypto";
import { SESSION_COOKIE } from "./constants";

const SESSION_TTL_HOURS = 24 * 7; // 7 days

export interface SessionUser {
  id: number;
  username: string;
  display_name: string | null;
}

export async function createSession(userId: number, ip: string | null, userAgent: string | null) {
  const db = getDB();
  const id = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000).toISOString();

  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, ip, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, userId, ip, userAgent, expiresAt)
    .run();

  // Next.js 15: cookies() is async now.
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });

  return id;
}

/** Reads the session cookie, validates it against D1, and returns the logged-in admin (or null). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const db = getDB();
  const row = await db
    .prepare(
      `SELECT u.id, u.username, u.display_name, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`
    )
    .bind(sessionId)
    .first<{ id: number; username: string; display_name: string | null; expires_at: string }>();

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await db.prepare(`DELETE FROM sessions WHERE id = ?`).bind(sessionId).run();
    return null;
  }

  return { id: row.id, username: row.username, display_name: row.display_name };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await getDB().prepare(`DELETE FROM sessions WHERE id = ?`).bind(sessionId).run();
  }
  cookieStore.delete(SESSION_COOKIE);
}

import { getDB, getEnv } from "./db";
import { randomToken } from "./crypto";

const ALLOWED_MIME: Record<string, "image" | "video" | "file"> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "image",
  "application/pdf": "file",
  // Note: no video/* here on purpose. Workers KV caps a single value at 25MB,
  // which makes it a poor fit for video. Host videos on an external platform
  // (e.g. Aparat) and embed the link in the post instead — see CommentsSection
  // for the same "store the small thing, link the big thing" pattern.
};

// Workers KV limits (free tier, no payment method required):
//  - 1GB total stored data
//  - 25MB max size per single value
//  - 100,000 read + 1,000 write operations per day (free tier)
const MAX_UPLOAD_BYTES = 24 * 1024 * 1024; // stay under KV's 25MB per-value cap

export async function getStorageUsage() {
  const db = getDB();
  const row = await db
    .prepare(`SELECT COALESCE(SUM(size_bytes), 0) as total FROM media`)
    .first<{ total: number }>();
  const usedMB = (row?.total ?? 0) / (1024 * 1024);
  const limitMB = Number(getEnv().MAX_STORAGE_MB ?? "950");
  return { usedMB, limitMB, percentUsed: (usedMB / limitMB) * 100 };
}

export async function uploadMedia(file: File, uploadedBy: number) {
  const kind = ALLOWED_MIME[file.type];
  if (!kind) throw new Error("UNSUPPORTED_TYPE");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("TOO_LARGE");

  const { usedMB, limitMB } = await getStorageUsage();
  if (usedMB + file.size / (1024 * 1024) > limitMB) throw new Error("STORAGE_FULL");

  const ext = file.name.split(".").pop() || "bin";
  // r2_key column name kept as-is (from the earlier R2 design) to avoid a
  // migration — it now holds the Workers KV key instead of an R2 object key.
  const key = `${kind}/${new Date().toISOString().slice(0, 10)}/${randomToken(16)}.${ext}`;

  const env = getEnv();
  await env.MEDIA_KV.put(key, await file.arrayBuffer(), {
    metadata: { contentType: file.type, fileName: file.name },
  });

  const db = getDB();
  const result = await db
    .prepare(
      `INSERT INTO media (r2_key, file_name, mime_type, size_bytes, kind, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(key, file.name, file.type, file.size, kind, uploadedBy)
    .run();

  return { id: result.meta.last_row_id as number, key, kind, url: `/api/media/${key}` };
}

export async function listMedia(limit = 60, offset = 0) {
  const { results } = await getDB()
    .prepare(
      `SELECT id, r2_key, file_name, mime_type, size_bytes, kind, view_count, last_used_at,
              auto_delete_after_days, created_at
       FROM media ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .bind(limit, offset)
    .all<{ r2_key: string }>();
  // Attach the public serving URL for each item so the admin UI can show/copy it.
  return results.map((m) => ({ ...m, url: `/api/media/${m.r2_key}` }));
}

/** Deletion is always manual/explicit — per project rules, nothing auto-deletes without this call. */
export async function deleteMedia(id: number) {
  const db = getDB();
  const row = await db.prepare(`SELECT r2_key FROM media WHERE id = ?`).bind(id).first<{ r2_key: string }>();
  if (!row) return;
  await getEnv().MEDIA_KV.delete(row.r2_key);
  await db.prepare(`DELETE FROM media WHERE id = ?`).bind(id).run();
}

export async function setAutoDeleteRule(id: number, days: number | null) {
  await getDB()
    .prepare(`UPDATE media SET auto_delete_after_days = ? WHERE id = ?`)
    .bind(days, id)
    .run();
}

/**
 * Returns media past its auto-delete threshold for admin review.
 * By project rule this is surfaced as a suggestion — actual deletion still
 * requires the admin to confirm via deleteMedia(), never automatic.
 */
export async function findExpiredMedia() {
  const { results } = await getDB()
    .prepare(
      `SELECT id, file_name, last_used_at, auto_delete_after_days FROM media
       WHERE auto_delete_after_days IS NOT NULL
         AND datetime(COALESCE(last_used_at, created_at), '+' || auto_delete_after_days || ' days') <= datetime('now')`
    )
    .all();
  return results;
}

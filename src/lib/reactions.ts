import { getDB } from "./db";

/** Hashes IP+UA so we never store raw IP addresses just to dedupe reactions. */
export async function hashVisitor(ip: string | null, userAgent: string | null): Promise<string> {
  const data = new TextEncoder().encode(`${ip ?? ""}::${userAgent ?? ""}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type TargetType = "post" | "comment";

export async function addReaction(
  targetType: TargetType,
  targetId: number,
  reactionType: string,
  visitorHash: string
) {
  // UNIQUE(target_type, target_id, visitor_hash, reaction_type) makes this idempotent —
  // re-clicking the same reaction is a harmless no-op rather than a duplicate count.
  await getDB()
    .prepare(
      `INSERT OR IGNORE INTO reactions (target_type, target_id, reaction_type, visitor_hash)
       VALUES (?, ?, ?, ?)`
    )
    .bind(targetType, targetId, reactionType, visitorHash)
    .run();
}

export async function removeReaction(
  targetType: TargetType,
  targetId: number,
  reactionType: string,
  visitorHash: string
) {
  await getDB()
    .prepare(
      `DELETE FROM reactions WHERE target_type = ? AND target_id = ? AND reaction_type = ? AND visitor_hash = ?`
    )
    .bind(targetType, targetId, reactionType, visitorHash)
    .run();
}

export async function getReactionCounts(targetType: TargetType, targetId: number) {
  const { results } = await getDB()
    .prepare(
      `SELECT reaction_type, COUNT(*) as count FROM reactions
       WHERE target_type = ? AND target_id = ? GROUP BY reaction_type`
    )
    .bind(targetType, targetId)
    .all<{ reaction_type: string; count: number }>();
  return Object.fromEntries(results.map((r) => [r.reaction_type, r.count]));
}

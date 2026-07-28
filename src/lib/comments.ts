import { z } from "zod";
import { getDB } from "./db";

export const CommentInput = z.object({
  post_id: z.number().int(),
  parent_id: z.number().int().optional().nullable(),
  author_name: z.string().min(1).max(80),
  author_email: z.string().email().optional().or(z.literal("")),
  body: z.string().min(1).max(2000),
});
export type CommentInputT = z.infer<typeof CommentInput>;

export async function submitComment(input: CommentInputT, ip: string | null) {
  const db = getDB();
  await db
    .prepare(
      `INSERT INTO comments (post_id, parent_id, author_name, author_email, body, ip, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`
    )
    .bind(
      input.post_id,
      input.parent_id ?? null,
      input.author_name,
      input.author_email || null,
      input.body,
      ip
    )
    .run();
}

export type CommentRow = {
  id: number;
  post_id: number;
  parent_id: number | null;
  author_name: string;
  body: string;
  is_admin_reply: number;
  status: string;
  created_at: string;
};

/** Only approved comments, nested one level (parent -> replies) for public display. */
export async function listApprovedComments(postId: number) {
  const { results } = await getDB()
    .prepare(
      `SELECT id, parent_id, author_name, body, is_admin_reply, created_at
       FROM comments WHERE post_id = ? AND status = 'approved'
       ORDER BY created_at ASC`
    )
    .bind(postId)
    .all<CommentRow>();

  const topLevel = results.filter((c: CommentRow) => !c.parent_id);
  const replies = results.filter((c: CommentRow) => c.parent_id);
  return topLevel.map((c: CommentRow) => ({
    ...c,
    replies: replies.filter((r: CommentRow) => r.parent_id === c.id),
  }));
}

export async function listCommentsAdmin(status?: string) {
  const db = getDB();
  const query = status
    ? db.prepare(
        `SELECT c.*, p.title as post_title, p.slug as post_slug FROM comments c
         JOIN posts p ON p.id = c.post_id WHERE c.status = ? ORDER BY c.created_at DESC`
      ).bind(status)
    : db.prepare(
        `SELECT c.*, p.title as post_title, p.slug as post_slug FROM comments c
         JOIN posts p ON p.id = c.post_id ORDER BY c.created_at DESC`
      );
  const { results } = await query.all();
  return results;
}

export async function approveComment(id: number) {
  await getDB().prepare(`UPDATE comments SET status = 'approved' WHERE id = ?`).bind(id).run();
}

export async function rejectComment(id: number) {
  await getDB().prepare(`UPDATE comments SET status = 'rejected' WHERE id = ?`).bind(id).run();
}

export async function deleteComment(id: number) {
  await getDB().prepare(`DELETE FROM comments WHERE id = ?`).bind(id).run();
}

/** Admin replies are auto-approved (the admin is a trusted author, no self-moderation needed). */
export async function replyAsAdmin(postId: number, parentId: number, body: string, adminName: string) {
  await getDB()
    .prepare(
      `INSERT INTO comments (post_id, parent_id, author_name, body, is_admin_reply, status)
       VALUES (?, ?, ?, ?, 1, 'approved')`
    )
    .bind(postId, parentId, adminName, body)
    .run();
}

import { z } from "zod";
import { getDB } from "./db";
import { slugify, renderMarkdown } from "./markdown";

export const PostInput = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional(),
  content_md: z.string().min(1),
  category_id: z.number().int().optional().nullable(),
  cover_media_id: z.number().int().optional().nullable(),
  tag_ids: z.array(z.number().int()).optional().default([]),
  status: z.enum(["draft", "scheduled", "published"]).default("draft"),
  published_at: z.string().datetime().optional().nullable(), // required if status === 'scheduled'
  seo_title: z.string().max(200).optional(),
  seo_description: z.string().max(300).optional(),
});
export type PostInputT = z.infer<typeof PostInput>;

async function uniqueSlug(db: D1Database, base: string, excludeId?: number): Promise<string> {
  let slug = base || "post";
  let n = 1;
  // Small tables (personal blog scale) -> a loop here is fine, no need for a fancier scheme.
  while (true) {
    const row = await db
      .prepare(`SELECT id FROM posts WHERE slug = ? AND id != ?`)
      .bind(slug, excludeId ?? -1)
      .first();
    if (!row) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export async function createPost(authorId: number, input: PostInputT) {
  const db = getDB();
  const slug = await uniqueSlug(db, slugify(input.title));
  const html = renderMarkdown(input.content_md);

  const publishedAt =
    input.status === "published"
      ? new Date().toISOString()
      : input.status === "scheduled"
      ? input.published_at
      : null;

  const result = await db
    .prepare(
      `INSERT INTO posts
        (title, slug, excerpt, content_md, content_html, cover_media_id, category_id,
         author_id, status, published_at, seo_title, seo_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.title, slug, input.excerpt ?? null, input.content_md, html,
      input.cover_media_id ?? null, input.category_id ?? null, authorId,
      input.status, publishedAt, input.seo_title ?? null, input.seo_description ?? null
    )
    .run();

  const postId = result.meta.last_row_id as number;
  await syncTags(db, postId, input.tag_ids);
  return { id: postId, slug };
}

export async function updatePost(id: number, input: PostInputT) {
  const db = getDB();
  const existing = await db.prepare(`SELECT slug FROM posts WHERE id = ?`).bind(id).first<{ slug: string }>();
  if (!existing) throw new Error("NOT_FOUND");

  const html = renderMarkdown(input.content_md);
  const publishedAt =
    input.status === "published"
      ? new Date().toISOString()
      : input.status === "scheduled"
      ? input.published_at
      : null;

  await db
    .prepare(
      `UPDATE posts SET
        title = ?, excerpt = ?, content_md = ?, content_html = ?, cover_media_id = ?,
        category_id = ?, status = ?, published_at = ?, seo_title = ?, seo_description = ?,
        updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(
      input.title, input.excerpt ?? null, input.content_md, html, input.cover_media_id ?? null,
      input.category_id ?? null, input.status, publishedAt, input.seo_title ?? null,
      input.seo_description ?? null, id
    )
    .run();

  await syncTags(db, id, input.tag_ids);
}

async function syncTags(db: D1Database, postId: number, tagIds: number[]) {
  await db.prepare(`DELETE FROM post_tags WHERE post_id = ?`).bind(postId).run();
  for (const tagId of tagIds) {
    await db
      .prepare(`INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)`)
      .bind(postId, tagId)
      .run();
  }
}

export async function deletePost(id: number) {
  await getDB().prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run();
}

export async function listPostsAdmin(limit = 50, offset = 0) {
  const db = getDB();
  const { results } = await db
    .prepare(
      `SELECT p.id, p.title, p.slug, p.status, p.published_at, p.view_count, p.updated_at,
              c.name as category_name
       FROM posts p LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`
    )
    .bind(limit, offset)
    .all();
  return results;
}

/**
 * Publishes any 'scheduled' posts whose time has arrived. Call this at request-time
 * for public pages (Workers has no persistent cron unless a Cron Trigger is added —
 * see migrations/README for the optional wrangler cron alternative).
 */
export async function publishDuePosts() {
  await getDB()
    .prepare(
      `UPDATE posts SET status = 'published'
       WHERE status = 'scheduled' AND published_at <= datetime('now')`
    )
    .run();
}

import { getDB } from "./db";
import { publishDuePosts } from "./posts";

const PAGE_SIZE = 10;

export type PublicPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string;
  category_name: string | null;
  category_slug: string | null;
};

async function ensureDuePostsPublished() {
  // Cloudflare Pages has no background timer, so "scheduled" posts flip to
  // "published" lazily on the next public request. See README for the
  // optional Cron Trigger alternative if exact-time publishing matters.
  await publishDuePosts();
}

export async function listPublicPosts(opts: {
  page?: number;
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
} = {}) {
  await ensureDuePostsPublished();
  const db = getDB();
  const page = Math.max(1, opts.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;

  let where = `p.status = 'published'`;
  const binds: any[] = [];

  if (opts.categorySlug) {
    where += ` AND c.slug = ?`;
    binds.push(opts.categorySlug);
  }
  if (opts.tagSlug) {
    where += ` AND p.id IN (SELECT pt.post_id FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE t.slug = ?)`;
    binds.push(opts.tagSlug);
  }
  if (opts.search) {
    where += ` AND (p.title LIKE ? OR p.excerpt LIKE ? OR p.content_md LIKE ?)`;
    const like = `%${opts.search}%`;
    binds.push(like, like, like);
  }

  const { results } = await db
    .prepare(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.published_at,
              c.name as category_name, c.slug as category_slug
       FROM posts p LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${where}
       ORDER BY p.published_at DESC
       LIMIT ? OFFSET ?`
    )
    .bind(...binds, PAGE_SIZE, offset)
    .all<PublicPost>();

  const countRow = await db
    .prepare(
      `SELECT COUNT(*) as total FROM posts p LEFT JOIN categories c ON c.id = p.category_id WHERE ${where}`
    )
    .bind(...binds)
    .first<{ total: number }>();

  return { posts: results, total: countRow?.total ?? 0, page, pageSize: PAGE_SIZE };
}

export async function getPublicPostBySlug(slug: string) {
  await ensureDuePostsPublished();
  const db = getDB();

  const post = await db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM posts p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.status = 'published'`
    )
    .bind(slug)
    .first<any>();

  if (!post) return null;

  // Fire-and-forget-ish view tracking (kept simple: two small writes).
  await db.prepare(`UPDATE posts SET view_count = view_count + 1 WHERE id = ?`).bind(post.id).run();
  const today = new Date().toISOString().slice(0, 10);
  await db
    .prepare(
      `INSERT INTO analytics (path, post_id, day, views) VALUES (?, ?, ?, 1)
       ON CONFLICT(path, day) DO UPDATE SET views = views + 1`
    )
    .bind(`/blog/${slug}`, post.id, today)
    .run();

  const { results: tags } = await db
    .prepare(
      `SELECT t.name, t.slug FROM tags t
       JOIN post_tags pt ON pt.tag_id = t.id WHERE pt.post_id = ?`
    )
    .bind(post.id)
    .all();

  return { ...post, tags };
}

export async function listCategories() {
  const { results } = await getDB()
    .prepare(
      `SELECT c.id, c.name, c.slug, COUNT(p.id) as post_count
       FROM categories c LEFT JOIN posts p ON p.category_id = c.id AND p.status = 'published'
       GROUP BY c.id ORDER BY c.name`
    )
    .all();
  return results;
}

export async function listTags() {
  const { results } = await getDB()
    .prepare(
      `SELECT t.id, t.name, t.slug, COUNT(pt.post_id) as post_count
       FROM tags t LEFT JOIN post_tags pt ON pt.tag_id = t.id
       GROUP BY t.id ORDER BY t.name`
    )
    .all();
  return results;
}

/** Groups published posts by year-month for the /archive page. */
export async function listArchiveGroups() {
  const { results } = await getDB()
    .prepare(
      `SELECT strftime('%Y-%m', published_at) as ym, COUNT(*) as count
       FROM posts WHERE status = 'published'
       GROUP BY ym ORDER BY ym DESC`
    )
    .all();
  return results;
}

export async function getRecentPublicPosts(limit = 20) {
  const { results } = await getDB()
    .prepare(
      `SELECT title, slug, excerpt, published_at FROM posts
       WHERE status = 'published' ORDER BY published_at DESC LIMIT ?`
    )
    .bind(limit)
    .all<{ title: string; slug: string; excerpt: string | null; published_at: string }>();
  return results;
}

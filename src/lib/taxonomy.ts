import { getDB } from "./db";
import { slugify } from "./markdown";

export async function createCategory(name: string) {
  const db = getDB();
  const slug = slugify(name);
  await db.prepare(`INSERT INTO categories (name, slug) VALUES (?, ?)`).bind(name, slug).run();
}

export async function deleteCategory(id: number) {
  await getDB().prepare(`DELETE FROM categories WHERE id = ?`).bind(id).run();
}

export async function createTag(name: string) {
  const db = getDB();
  const slug = slugify(name);
  await db.prepare(`INSERT INTO tags (name, slug) VALUES (?, ?)`).bind(name, slug).run();
}

export async function deleteTag(id: number) {
  await getDB().prepare(`DELETE FROM tags WHERE id = ?`).bind(id).run();
}

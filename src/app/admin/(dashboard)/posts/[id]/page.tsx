import { getDB } from "@/lib/db";
import PostEditor from "@/components/PostEditor";
import { notFound } from "next/navigation";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDB();
  const post = await db.prepare(`SELECT * FROM posts WHERE id = ?`).bind(Number(id)).first<any>();
  if (!post) notFound();

  const { results: tagRows } = await db
    .prepare(`SELECT tag_id FROM post_tags WHERE post_id = ?`)
    .bind(post.id)
    .all<{ tag_id: number }>();

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">ویرایش مقاله</h1>
      <PostEditor
        postId={post.id}
        initial={{
          title: post.title,
          excerpt: post.excerpt ?? "",
          content_md: post.content_md,
          status: post.status,
          published_at: post.published_at,
          seo_title: post.seo_title ?? "",
          seo_description: post.seo_description ?? "",
          category_id: post.category_id,
          tag_ids: tagRows.map((t) => t.tag_id),
        }}
      />
    </div>
  );
}

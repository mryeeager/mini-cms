import Link from "next/link";

export default function PostCard({
  post,
}: {
  post: { title: string; slug: string; excerpt?: string | null; published_at: string; category_name?: string | null };
}) {
  return (
    <article className="py-5 border-b border-black/5 dark:border-white/5">
      {post.category_name && (
        <span className="text-xs text-brand font-medium">{post.category_name}</span>
      )}
      <h2 className="text-lg font-bold mt-1">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>
      {post.excerpt && <p className="text-sm opacity-70 mt-1">{post.excerpt}</p>}
      <time className="text-xs opacity-50 mt-2 block">
        {new Date(post.published_at).toLocaleDateString("fa-IR")}
      </time>
    </article>
  );
}

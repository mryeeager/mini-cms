import { getPublicPostBySlug } from "@/lib/public-posts";
import { listApprovedComments } from "@/lib/comments";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import Link from "next/link";
import type { Metadata } from "next";
import ReactionButtons from "@/components/ReactionButtons";
import CommentsSection from "@/components/CommentsSection";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = await getPublicPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
  };
}

export default async function PostPage({ params }: Params) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = await getPublicPostBySlug(slug);
  if (!post) notFound();
  const comments = await listApprovedComments(post.id);

  return (
    <article className="py-8 max-w-2xl mx-auto">
      {post.category_name && (
        <Link href={`/category/${post.category_slug}`} className="text-xs text-brand font-medium">
          {post.category_name}
        </Link>
      )}
      <h1 className="text-2xl font-bold mt-2 mb-3">{post.title}</h1>
      <time className="text-xs opacity-50">
        {new Date(post.published_at).toLocaleDateString("fa-IR")} · {post.view_count} بازدید
      </time>

      <div
        className="prose dark:prose-invert max-w-none mt-6"
        dangerouslySetInnerHTML={{ __html: post.content_html }}
      />

      <div className="mt-6">
        <ReactionButtons targetType="post" targetId={post.id} />
      </div>

      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8">
          {post.tags.map((t: any) => (
            <Link
              key={t.slug}
              href={`/tag/${t.slug}`}
              className="px-2 py-1 text-xs rounded-full border border-black/10 dark:border-white/10"
            >
              #{t.name}
            </Link>
          ))}
        </div>
      )}

      <CommentsSection postId={post.id} initialComments={comments as any} />
    </article>
  );
}

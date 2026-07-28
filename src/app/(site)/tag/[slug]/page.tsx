import { listPublicPosts } from "@/lib/public-posts";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page } = await searchParams;
  const { posts } = await listPublicPosts({
    tagSlug: slug,
    page: Number(page ?? 1),
  });

  return (
    <div className="py-8">
      <h1 className="text-xl font-bold mb-4">برچسب: #{slug}</h1>
      {posts.length === 0 ? (
        <p className="opacity-60 text-sm">مطلبی با این برچسب پیدا نشد.</p>
      ) : (
        posts.map((p) => <PostCard key={p.slug} post={p} />)
      )}
    </div>
  );
}

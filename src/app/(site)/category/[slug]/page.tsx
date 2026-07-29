import { listPublicPosts } from "@/lib/public-posts";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const { page } = await searchParams;
  const { posts } = await listPublicPosts({
    categorySlug: slug,
    page: Number(page ?? 1),
  });

  return (
    <div className="py-8">
      <h1 className="text-xl font-bold mb-4">دسته‌بندی: {slug}</h1>
      {posts.length === 0 ? (
        <p className="opacity-60 text-sm">مطلبی در این دسته پیدا نشد.</p>
      ) : (
        posts.map((p) => <PostCard key={p.slug} post={p} />)
      )}
    </div>
  );
}

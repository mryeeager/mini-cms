import { listPublicPosts } from "@/lib/public-posts";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: qParam } = await searchParams;
  const q = qParam?.trim() ?? "";
  const { posts } = q ? await listPublicPosts({ search: q }) : { posts: [] };

  return (
    <div className="py-8">
      <h1 className="text-xl font-bold mb-4">جستجو: {q}</h1>
      {!q ? (
        <p className="opacity-60 text-sm">عبارتی برای جستجو وارد کن.</p>
      ) : posts.length === 0 ? (
        <p className="opacity-60 text-sm">نتیجه‌ای پیدا نشد.</p>
      ) : (
        posts.map((p) => <PostCard key={p.slug} post={p} />)
      )}
    </div>
  );
}

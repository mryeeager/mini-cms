import { listPublicPosts, listCategories, listTags } from "@/lib/public-posts";
import PostCard from "@/components/PostCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? 1);
  const [{ posts, total, pageSize }, categories, tags] = await Promise.all([
    listPublicPosts({ page }),
    listCategories(),
    listTags(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="grid md:grid-cols-3 gap-8 py-8">
      <div className="md:col-span-2">
        <h1 className="text-xl font-bold mb-4">مقالات</h1>
        {posts.length === 0 ? (
          <p className="opacity-60 text-sm">مطلبی پیدا نشد.</p>
        ) : (
          posts.map((p) => <PostCard key={p.slug} post={p} />)
        )}

        {totalPages > 1 && (
          <div className="flex gap-2 mt-6 text-sm">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={`/blog?page=${n}`}
                className={n === page ? "font-bold text-brand" : "opacity-60"}
              >
                {n}
              </Link>
            ))}
          </div>
        )}
      </div>

      <aside className="text-sm space-y-6">
        <div>
          <h3 className="font-bold mb-2">دسته‌بندی‌ها</h3>
          <ul className="space-y-1">
            {categories.map((c: any) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`}>
                  {c.name} <span className="opacity-50">({c.post_count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-2">برچسب‌ها</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((t: any) => (
              <Link
                key={t.slug}
                href={`/tag/${t.slug}`}
                className="px-2 py-1 rounded-full border border-black/10 dark:border-white/10"
              >
                #{t.name}
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

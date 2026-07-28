import { listPublicPosts } from "@/lib/public-posts";
import { getSettings } from "@/lib/settings";
import PostCard from "@/components/PostCard";

// Posts/settings live in D1 and change from the admin panel, so this page
// is rendered per-request rather than statically at build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, { posts }] = await Promise.all([getSettings(), listPublicPosts({ page: 1 })]);

  return (
    <div>
      <section className="py-12 text-center">
        <h1 className="text-3xl font-bold mb-2">{settings.site_title}</h1>
        <p className="opacity-70">{settings.site_description}</p>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-2">آخرین مطالب</h2>
        {posts.length === 0 ? (
          <p className="opacity-60 text-sm py-8">هنوز مطلبی منتشر نشده.</p>
        ) : (
          posts.map((p) => <PostCard key={p.slug} post={p} />)
        )}
      </section>
    </div>
  );
}

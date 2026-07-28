"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Post = {
  id: number;
  title: string;
  slug: string;
  status: string;
  published_at: string | null;
  view_count: number;
  category_name: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "پیش‌نویس",
  scheduled: "زمان‌بندی‌شده",
  published: "منتشرشده",
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/posts");
    const data = (await res.json()) as any;
    setPosts(data.posts ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("مطمئنی می‌خوای این مقاله حذف بشه؟")) return;
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">مقالات</h1>
        <Link href="/admin/posts/new" className="px-4 py-2 rounded-md bg-brand text-white text-sm">
          + مقاله جدید
        </Link>
      </div>

      {loading ? (
        <p className="opacity-60 text-sm">در حال بارگذاری...</p>
      ) : posts.length === 0 ? (
        <p className="opacity-60 text-sm">هنوز مقاله‌ای ثبت نشده.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-right border-b border-black/10 dark:border-white/10">
              <th className="py-2">عنوان</th>
              <th>دسته</th>
              <th>وضعیت</th>
              <th>بازدید</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2">{p.title}</td>
                <td>{p.category_name ?? "—"}</td>
                <td>{STATUS_LABEL[p.status] ?? p.status}</td>
                <td>{p.view_count}</td>
                <td className="flex gap-3 py-2">
                  <Link href={`/admin/posts/${p.id}`} className="text-brand">ویرایش</Link>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

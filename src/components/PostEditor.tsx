"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  postId?: number;
  initial?: {
    title: string;
    excerpt: string;
    content_md: string;
    status: "draft" | "scheduled" | "published";
    published_at: string | null;
    seo_title: string;
    seo_description: string;
    category_id?: number | null;
    tag_ids?: number[];
  };
};

const EMPTY = {
  title: "",
  excerpt: "",
  content_md: "",
  status: "draft" as const,
  published_at: null as string | null,
  seo_title: "",
  seo_description: "",
  category_id: null as number | null,
  tag_ids: [] as number[],
};

export default function PostEditor({ postId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: number; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/categories").then((r) => r.json() as Promise<any>).then((d) => setCategories(d.categories ?? []));
    fetch("/api/admin/tags").then((r) => r.json() as Promise<any>).then((d) => setTags(d.tags ?? []));
  }, []);

  function toggleTag(id: number) {
    setForm((f) => ({
      ...f,
      tag_ids: f.tag_ids.includes(id) ? f.tag_ids.filter((t) => t !== id) : [...f.tag_ids, id],
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const payload = { ...form };
    const res = await fetch(postId ? `/api/admin/posts/${postId}` : "/api/admin/posts", {
      method: postId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/admin/posts");
      router.refresh();
    } else {
      const data = (await res.json().catch(() => ({}))) as any;
      setError(typeof data.error === "string" ? data.error : "خطا در ذخیره‌سازی");
    }
    setSaving(false);
  }

  return (
    <div className="max-w-3xl">
      <input
        className="w-full text-xl font-bold mb-3 px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
        placeholder="عنوان مقاله"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <textarea
        className="w-full mb-3 px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
        placeholder="خلاصه کوتاه (اختیاری)"
        rows={2}
        value={form.excerpt}
        onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
      />

      <textarea
        className="w-full mb-3 px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent font-mono text-sm"
        placeholder="متن مقاله (Markdown)..."
        rows={16}
        value={form.content_md}
        onChange={(e) => setForm({ ...form, content_md: e.target.value })}
      />

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <select
          className="px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as any })}
        >
          <option value="draft">پیش‌نویس</option>
          <option value="scheduled">زمان‌بندی انتشار</option>
          <option value="published">انتشار فوری</option>
        </select>

        {form.status === "scheduled" && (
          <input
            type="datetime-local"
            className="px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
            onChange={(e) =>
              setForm({ ...form, published_at: new Date(e.target.value).toISOString() })
            }
          />
        )}

        <select
          className="px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
          value={form.category_id ?? ""}
          onChange={(e) => setForm({ ...form, category_id: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">بدون دسته‌بندی</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTag(t.id)}
              className={`text-xs px-2 py-1 rounded-full border ${
                form.tag_ids.includes(t.id)
                  ? "bg-brand text-white border-brand"
                  : "border-black/10 dark:border-white/10"
              }`}
            >
              #{t.name}
            </button>
          ))}
        </div>
      )}

      <details className="mb-4">
        <summary className="cursor-pointer text-sm opacity-70">تنظیمات سئو (اختیاری)</summary>
        <div className="mt-2 space-y-2">
          <input
            className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
            placeholder="عنوان سئو"
            value={form.seo_title}
            onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
          />
          <textarea
            className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
            placeholder="توضیحات سئو"
            rows={2}
            value={form.seo_description}
            onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
          />
        </div>
      </details>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || !form.title || !form.content_md}
        className="px-5 py-2 rounded-md bg-brand text-white disabled:opacity-50"
      >
        {saving ? "در حال ذخیره..." : "ذخیره"}
      </button>
    </div>
  );
}

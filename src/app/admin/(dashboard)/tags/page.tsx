"use client";

import { useEffect, useState } from "react";

type Tag = { id: number; name: string; slug: string };

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/tags");
    const data = (await res.json()) as any;
    setTags(data.tags ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    const res = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setName("");
      load();
    } else {
      const data = (await res.json().catch(() => ({}))) as any;
      setError(data.error ?? "خطا در ثبت برچسب");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("این برچسب حذف بشه؟")) return;
    setError(null);
    const res = await fetch(`/api/admin/tags?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      load();
    } else {
      const data = (await res.json().catch(() => ({}))) as any;
      setError(data.error ?? "حذف انجام نشد");
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold mb-4">برچسب‌ها</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-2">
        <input
          className="flex-1 px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
          placeholder="نام برچسب جدید"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="px-4 py-2 rounded-md bg-brand text-white text-sm">افزودن</button>
      </form>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t.id}
            className="flex items-center gap-2 text-sm px-3 py-1 rounded-full border border-black/10 dark:border-white/10"
          >
            #{t.name}
            <button onClick={() => handleDelete(t.id)} className="text-red-500 text-xs">✕</button>
          </span>
        ))}
      </div>
    </div>
  );
}

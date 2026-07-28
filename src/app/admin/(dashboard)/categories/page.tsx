"use client";

import { useEffect, useState } from "react";

type Category = { id: number; name: string; slug: string };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/categories");
    const data = (await res.json()) as any;
    setCategories(data.categories ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setName("");
      load();
    } else {
      const data = (await res.json().catch(() => ({}))) as any;
      setError(data.error ?? "خطا در ثبت دسته‌بندی");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("این دسته‌بندی حذف بشه؟")) return;
    setError(null);
    const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      load();
    } else {
      const data = (await res.json().catch(() => ({}))) as any;
      setError(data.error ?? "حذف انجام نشد");
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold mb-4">دسته‌بندی‌ها</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-2">
        <input
          className="flex-1 px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
          placeholder="نام دسته‌بندی جدید"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="px-4 py-2 rounded-md bg-brand text-white text-sm">افزودن</button>
      </form>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <ul className="space-y-2">
        {categories.map((c) => (
          <li key={c.id} className="flex justify-between text-sm p-2 rounded-md border border-black/10 dark:border-white/10">
            <span>{c.name}</span>
            <button onClick={() => handleDelete(c.id)} className="text-red-500">حذف</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

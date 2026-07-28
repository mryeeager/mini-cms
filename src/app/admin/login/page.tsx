"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = (await res.json().catch(() => ({}))) as any;
      setError(data.error ?? "خطایی رخ داد");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-6 rounded-xl border border-black/10 dark:border-white/10 shadow-sm"
      >
        <h1 className="text-lg font-bold mb-4">ورود مدیر</h1>

        <label className="block text-sm mb-1">نام کاربری</label>
        <input
          className="w-full mb-3 px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />

        <label className="block text-sm mb-1">رمز عبور</label>
        <input
          type="password"
          className="w-full mb-4 px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-md bg-brand text-white hover:bg-brand-dark transition"
        >
          {loading ? "در حال ورود..." : "ورود"}
        </button>
      </form>
    </div>
  );
}

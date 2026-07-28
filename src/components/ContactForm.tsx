"use client";

import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", body: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/public/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setStatus(res.ok ? "sent" : "error");
    if (res.ok) setForm({ name: "", email: "", body: "" });
  }

  if (status === "sent") {
    return <p className="text-green-600">پیامت با موفقیت ارسال شد ✅</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
      <input
        placeholder="نام شما"
        className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <input
        placeholder="ایمیل (اختیاری)"
        type="email"
        className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <textarea
        placeholder="پیام شما"
        rows={5}
        className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        required
      />
      {status === "error" && <p className="text-red-500 text-sm">ارسال نشد، دوباره امتحان کن.</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="px-5 py-2 rounded-md bg-brand text-white text-sm"
      >
        {status === "sending" ? "در حال ارسال..." : "ارسال پیام"}
      </button>
    </form>
  );
}

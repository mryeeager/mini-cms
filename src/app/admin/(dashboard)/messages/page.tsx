"use client";

import { useEffect, useState } from "react";

type Message = {
  id: number;
  name: string;
  email: string | null;
  body: string;
  status: string;
  created_at: string;
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);

  async function load() {
    const res = await fetch("/api/admin/messages");
    const data = (await res.json()) as any;
    setMessages(data.messages ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: number) {
    await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "read" }),
    });
    load();
  }

  async function remove(id: number) {
    if (!confirm("این پیام حذف بشه؟")) return;
    await fetch(`/api/admin/messages?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">پیام‌ها</h1>
      {messages.length === 0 ? (
        <p className="opacity-60 text-sm">پیامی نیست.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-lg border text-sm ${
                m.status === "unread"
                  ? "border-brand/50 bg-brand/5"
                  : "border-black/10 dark:border-white/10"
              }`}
            >
              <div className="flex justify-between mb-1">
                <span className="font-medium">
                  {m.name} {m.email && <span className="opacity-50">({m.email})</span>}
                </span>
                <span className="opacity-50 text-xs">{new Date(m.created_at).toLocaleDateString("fa-IR")}</span>
              </div>
              <p className="opacity-90 mb-3">{m.body}</p>
              <div className="flex gap-3 text-xs">
                {m.status === "unread" && (
                  <button onClick={() => markRead(m.id)} className="text-brand">
                    علامت به‌عنوان خوانده‌شده
                  </button>
                )}
                <button onClick={() => remove(m.id)} className="text-red-500">حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

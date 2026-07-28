"use client";

import { useEffect, useState } from "react";

type Comment = {
  id: number;
  post_id: number;
  post_title: string;
  post_slug: string;
  parent_id: number | null;
  author_name: string;
  author_email: string | null;
  body: string;
  is_admin_reply: number;
  status: string;
  created_at: string;
};

const TABS = [
  { key: "pending", label: "در انتظار تأیید" },
  { key: "approved", label: "تأییدشده" },
  { key: "rejected", label: "ردشده" },
];

export default function AdminCommentsPage() {
  const [tab, setTab] = useState("pending");
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyOpenId, setReplyOpenId] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/comments?status=${tab}`);
    const data = (await res.json()) as any;
    setComments(data.comments ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [tab]);

  async function act(action: string, id: number, extra: Record<string, any> = {}) {
    await fetch("/api/admin/comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id, ...extra }),
    });
    setReplyOpenId(null);
    setReplyBody("");
    load();
  }

  async function remove(id: number) {
    if (!confirm("این نظر برای همیشه حذف بشه؟")) return;
    await fetch(`/api/admin/comments?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">نظرات</h1>

      <div className="flex gap-4 mb-4 text-sm border-b border-black/10 dark:border-white/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2 ${tab === t.key ? "border-b-2 border-brand font-bold" : "opacity-60"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="opacity-60 text-sm">در حال بارگذاری...</p>
      ) : comments.length === 0 ? (
        <p className="opacity-60 text-sm">چیزی برای نمایش نیست.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="p-4 rounded-lg border border-black/10 dark:border-white/10 text-sm">
              <div className="flex justify-between mb-1">
                <span className="font-medium">
                  {c.author_name} {c.author_email && <span className="opacity-50">({c.author_email})</span>}
                </span>
                <a href={`/blog/${c.post_slug}`} target="_blank" className="text-brand text-xs">
                  {c.post_title}
                </a>
              </div>
              <p className="opacity-90 mb-3">{c.body}</p>

              <div className="flex gap-3 text-xs">
                {tab === "pending" && (
                  <>
                    <button onClick={() => act("approve", c.id)} className="text-green-600">تأیید</button>
                    <button onClick={() => act("reject", c.id)} className="text-orange-500">رد</button>
                  </>
                )}
                <button onClick={() => setReplyOpenId(replyOpenId === c.id ? null : c.id)} className="text-brand">
                  پاسخ
                </button>
                <button onClick={() => remove(c.id)} className="text-red-500">حذف</button>
              </div>

              {replyOpenId === c.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    className="flex-1 px-2 py-1 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-xs"
                    placeholder="متن پاسخ ادمین..."
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                  />
                  <button
                    onClick={() => act("reply", c.id, { post_id: c.post_id, reply_body: replyBody })}
                    className="px-3 py-1 rounded-md bg-brand text-white text-xs"
                  >
                    ارسال
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

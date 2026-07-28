"use client";

import { useState } from "react";
import ReactionButtons from "./ReactionButtons";

type Comment = {
  id: number;
  author_name: string;
  body: string;
  is_admin_reply: number;
  created_at: string;
  replies: Comment[];
};

export default function CommentsSection({
  postId,
  initialComments,
}: {
  postId: number;
  initialComments: Comment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [form, setForm] = useState({ author_name: "", author_email: "", body: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/public/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, ...form }),
    });
    setStatus(res.ok ? "sent" : "error");
    if (res.ok) setForm({ author_name: "", author_email: "", body: "" });
  }

  return (
    <section className="mt-12 max-w-2xl mx-auto">
      <h2 className="text-lg font-bold mb-4">نظرات ({comments.length})</h2>

      <div className="space-y-6 mb-8">
        {comments.length === 0 && <p className="text-sm opacity-60">هنوز نظری ثبت نشده — اولین نفر باش.</p>}
        {comments.map((c) => (
          <div key={c.id} className="border-b border-black/5 dark:border-white/5 pb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-sm">{c.author_name}</span>
              <span className="text-xs opacity-50">{new Date(c.created_at).toLocaleDateString("fa-IR")}</span>
            </div>
            <p className="text-sm opacity-90">{c.body}</p>
            <div className="mt-2">
              <ReactionButtons targetType="comment" targetId={c.id} />
            </div>

            {c.replies?.length > 0 && (
              <div className="mr-6 mt-3 space-y-3 border-r-2 border-brand/30 pr-3">
                {c.replies.map((r) => (
                  <div key={r.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{r.author_name}</span>
                      {!!r.is_admin_reply && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand text-white">ادمین</span>
                      )}
                    </div>
                    <p className="text-sm opacity-90">{r.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {status === "sent" ? (
        <p className="text-green-600 text-sm">نظرت ثبت شد و بعد از تأیید نمایش داده میشه ✅</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            placeholder="نام"
            className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
            value={form.author_name}
            onChange={(e) => setForm({ ...form, author_name: e.target.value })}
            required
          />
          <input
            placeholder="ایمیل (اختیاری)"
            type="email"
            className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
            value={form.author_email}
            onChange={(e) => setForm({ ...form, author_email: e.target.value })}
          />
          <textarea
            placeholder="نظرت رو بنویس..."
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent text-sm"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            required
          />
          {status === "error" && <p className="text-red-500 text-xs">ثبت نشد، دوباره امتحان کن.</p>}
          <button disabled={status === "sending"} className="px-4 py-2 rounded-md bg-brand text-white text-sm">
            {status === "sending" ? "در حال ارسال..." : "ثبت نظر"}
          </button>
        </form>
      )}
    </section>
  );
}

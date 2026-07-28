"use client";

import { useEffect, useRef, useState } from "react";

type MediaItem = {
  id: number;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  kind: string;
  auto_delete_after_days: number | null;
  created_at: string;
  url: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [usage, setUsage] = useState({ usedMB: 0, limitMB: 0, percentUsed: 0 });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/admin/media");
    const data = (await res.json()) as any;
    setMedia(data.media ?? []);
    setUsage(data.usage ?? { usedMB: 0, limitMB: 0, percentUsed: 0 });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body: formData });

    if (res.ok) {
      await load();
    } else {
      const data = (await res.json().catch(() => ({}))) as any;
      setError(data.error ?? "خطا در آپلود");
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function handleDelete(id: number) {
    if (!confirm("این فایل برای همیشه حذف بشه؟")) return;
    await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    load();
  }

  async function handleCopy(m: MediaItem) {
    const fullUrl = `${window.location.origin}${m.url}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const isWarning = usage.percentUsed >= 80;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">مدیریت فایل‌ها</h1>

      <div className="mb-4 p-4 rounded-lg border border-black/10 dark:border-white/10">
        <div className="flex justify-between text-sm mb-2">
          <span>فضای مصرف‌شده</span>
          <span className={isWarning ? "text-red-500 font-bold" : ""}>
            {usage.usedMB.toFixed(0)} MB / {usage.limitMB.toFixed(0)} MB
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full ${isWarning ? "bg-red-500" : "bg-brand"}`}
            style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
          />
        </div>
        {isWarning && (
          <p className="text-red-500 text-xs mt-2">
            ⚠️ فضای ذخیره‌سازی داره پر میشه. فایل‌های استفاده‌نشده رو بررسی و حذف کن.
          </p>
        )}
      </div>

      <label className="inline-block mb-1 px-4 py-2 rounded-md bg-brand text-white text-sm cursor-pointer">
        {uploading ? "در حال آپلود..." : "+ آپلود فایل"}
        <input ref={fileInput} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
      <p className="text-xs opacity-50 mb-4">عکس‌ها و PDF تا ۲۴ مگابایت — برای ویدیو از آپارات لینک بگیر و توی مقاله embed کن.</p>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {media.map((m) => (
          <div key={m.id} className="p-3 rounded-lg border border-black/10 dark:border-white/10 text-xs">
            {m.kind === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt={m.file_name} className="w-full h-20 object-cover rounded mb-2" />
            )}
            <div className="truncate font-medium mb-1">{m.file_name}</div>
            <div className="opacity-60 mb-2">
              {m.kind} · {formatSize(m.size_bytes)}
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleCopy(m)} className="text-brand">
                {copiedId === m.id ? "کپی شد ✓" : "کپی لینک"}
              </button>
              <button onClick={() => handleDelete(m.id)} className="text-red-500">
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

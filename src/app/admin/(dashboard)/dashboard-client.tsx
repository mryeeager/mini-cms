"use client";

import { useEffect, useState } from "react";

type Stats = {
  postCount: number;
  totalViews: number;
  pendingComments: number;
  unreadMessages: number;
  storage: { usedMB: number; limitMB: number; percentUsed: number };
};

function StatCard({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="p-4 rounded-lg border border-black/10 dark:border-white/10">
      <div className="text-2xl font-bold">{value}</div>
      <div className={`text-xs mt-1 ${warn ? "text-red-500" : "opacity-60"}`}>{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json() as Promise<any>)
      .then(setStats);
  }, []);

  if (!stats) return <p className="opacity-60 text-sm">در حال بارگذاری...</p>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">داشبورد</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="تعداد مقالات" value={stats.postCount} />
        <StatCard label="مجموع بازدید" value={stats.totalViews} />
        <StatCard label="نظرات در انتظار" value={stats.pendingComments} warn={stats.pendingComments > 0} />
        <StatCard label="پیام‌های خوانده‌نشده" value={stats.unreadMessages} warn={stats.unreadMessages > 0} />
      </div>

      <div className="p-4 rounded-lg border border-black/10 dark:border-white/10">
        <div className="flex justify-between text-sm mb-2">
          <span>فضای ذخیره‌سازی KV</span>
          <span className={stats.storage.percentUsed >= 80 ? "text-red-500 font-bold" : ""}>
            {stats.storage.usedMB.toFixed(0)} / {stats.storage.limitMB.toFixed(0)} MB
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full ${stats.storage.percentUsed >= 80 ? "bg-red-500" : "bg-brand"}`}
            style={{ width: `${Math.min(stats.storage.percentUsed, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

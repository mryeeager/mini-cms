"use client";

import { useEffect, useState } from "react";

type Settings = {
  site_title: string;
  site_description: string;
  about_content: string;
  contact_email: string;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [savingSite, setSavingSite] = useState(false);
  const [siteMsg, setSiteMsg] = useState<string | null>(null);

  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json() as Promise<any>)
      .then((d) => setSettings(d.settings));
  }, []);

  async function handleSaveSite(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSavingSite(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSavingSite(false);
    setSiteMsg("ذخیره شد ✅");
    setTimeout(() => setSiteMsg(null), 2000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwSaving(true);
    setPwMsg(null);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pwForm),
    });
    const data = (await res.json()) as any;
    setPwSaving(false);
    if (res.ok) {
      setPwMsg({ text: "رمز با موفقیت تغییر کرد ✅", ok: true });
      setPwForm({ current_password: "", new_password: "" });
    } else {
      setPwMsg({ text: data.error ?? "خطا", ok: false });
    }
  }

  if (!settings) return <p className="opacity-60 text-sm">در حال بارگذاری...</p>;

  return (
    <div className="max-w-xl space-y-10">
      <div>
        <h1 className="text-xl font-bold mb-4">تنظیمات سایت</h1>
        <form onSubmit={handleSaveSite} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">عنوان سایت</label>
            <input
              className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
              value={settings.site_title}
              onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">توضیح کوتاه سایت</label>
            <input
              className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
              value={settings.site_description}
              onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">متن صفحه «درباره من»</label>
            <textarea
              rows={6}
              className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
              value={settings.about_content}
              onChange={(e) => setSettings({ ...settings, about_content: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">ایمیل تماس (نمایش داخلی، اختیاری)</label>
            <input
              className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
              value={settings.contact_email}
              onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
            />
          </div>
          {siteMsg && <p className="text-green-600 text-sm">{siteMsg}</p>}
          <button disabled={savingSite} className="px-5 py-2 rounded-md bg-brand text-white text-sm">
            {savingSite ? "در حال ذخیره..." : "ذخیره تنظیمات"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4">تغییر رمز مدیر</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password"
            placeholder="رمز فعلی"
            className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
            value={pwForm.current_password}
            onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="رمز جدید (حداقل ۱۰ کاراکتر)"
            className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-transparent"
            value={pwForm.new_password}
            onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
            required
          />
          {pwMsg && <p className={`text-sm ${pwMsg.ok ? "text-green-600" : "text-red-500"}`}>{pwMsg.text}</p>}
          <button disabled={pwSaving} className="px-5 py-2 rounded-md bg-brand text-white text-sm">
            {pwSaving ? "در حال تغییر..." : "تغییر رمز"}
          </button>
        </form>
      </div>
    </div>
  );
}

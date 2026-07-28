import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The middleware already blocks requests with no cookie. This second check
  // guards against a forged/expired cookie value slipping past that quick check.
  // /admin/login lives outside this (dashboard) route group, so it never hits this code.
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 border-l border-black/10 dark:border-white/10 p-4">
        <h2 className="font-bold mb-4">پنل مدیریت</h2>
        <nav className="flex flex-col gap-2 text-sm">
          <a href="/admin">داشبورد</a>
          <a href="/admin/posts">مقالات</a>
          <a href="/admin/media">فایل‌ها</a>
          <a href="/admin/categories">دسته‌بندی‌ها</a>
          <a href="/admin/tags">برچسب‌ها</a>
          <a href="/admin/comments">نظرات</a>
          <a href="/admin/messages">پیام‌ها</a>
          <a href="/admin/settings">تنظیمات</a>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm opacity-70">خوش آمدی، {user.display_name ?? user.username}</span>
          <LogoutButton />
        </div>
        {children}
      </main>
    </div>
  );
}

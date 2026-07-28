import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header({ siteTitle }: { siteTitle: string }) {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-lg">
          {siteTitle}
        </Link>

        <nav className="hidden md:flex gap-5 text-sm">
          <Link href="/blog">مقالات</Link>
          <Link href="/archive">آرشیو</Link>
          <Link href="/about">درباره من</Link>
          <Link href="/contact">تماس</Link>
        </nav>

        <div className="flex items-center gap-3">
          <form action="/search" method="get" className="hidden sm:block">
            <input
              name="q"
              placeholder="جستجو..."
              className="px-3 py-1.5 text-sm rounded-full border border-black/10 dark:border-white/10 bg-transparent"
            />
          </form>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

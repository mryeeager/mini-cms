export default function Footer() {
  return (
    <footer className="border-t border-black/10 dark:border-white/10 mt-16">
      <div className="max-w-4xl mx-auto px-4 py-8 text-sm opacity-60 flex justify-between">
        <span>© {new Date().getFullYear()} — همه‌ی حقوق محفوظ است</span>
        <a href="/rss.xml">RSS</a>
      </div>
    </footer>
  );
}

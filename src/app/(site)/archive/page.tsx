import { listArchiveGroups } from "@/lib/public-posts";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const groups = await listArchiveGroups();

  return (
    <div className="py-8">
      <h1 className="text-xl font-bold mb-4">آرشیو مطالب</h1>
      <ul className="space-y-2 text-sm">
        {(groups as any[]).map((g) => (
          <li key={g.ym} className="flex justify-between border-b border-black/5 dark:border-white/5 py-2">
            <span>{g.ym}</span>
            <span className="opacity-60">{g.count} مطلب</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

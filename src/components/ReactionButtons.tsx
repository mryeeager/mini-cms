"use client";

import { useEffect, useState } from "react";

const REACTIONS: { type: string; emoji: string }[] = [
  { type: "like", emoji: "👍" },
  { type: "love", emoji: "❤️" },
  { type: "clap", emoji: "👏" },
  { type: "laugh", emoji: "😄" },
];

export default function ReactionButtons({
  targetType,
  targetId,
}: {
  targetType: "post" | "comment";
  targetId: number;
}) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch(`/api/public/reactions?target_type=${targetType}&target_id=${targetId}`)
      .then((r) => r.json() as Promise<any>)
      .then((d) => setCounts(d.counts ?? {}));
  }, [targetType, targetId]);

  async function handleClick(reactionType: string) {
    const res = await fetch("/api/public/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_type: targetType, target_id: targetId, reaction_type: reactionType }),
    });
    const data = (await res.json()) as any;
    setCounts(data.counts ?? {});
  }

  return (
    <div className="flex gap-2">
      {REACTIONS.map((r) => (
        <button
          key={r.type}
          onClick={() => handleClick(r.type)}
          className="text-xs px-2 py-1 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
        >
          {r.emoji} {counts[r.type] ?? 0}
        </button>
      ))}
    </div>
  );
}

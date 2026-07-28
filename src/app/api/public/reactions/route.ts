import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addReaction, removeReaction, getReactionCounts, hashVisitor } from "@/lib/reactions";

const ReactionInput = z.object({
  target_type: z.enum(["post", "comment"]),
  target_id: z.number().int(),
  reaction_type: z.enum(["like", "love", "clap", "laugh"]),
  action: z.enum(["add", "remove"]).default("add"),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("cf-connecting-ip");
  const ua = req.headers.get("user-agent");
  const body = await req.json().catch(() => null);
  const parsed = ReactionInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });

  const visitorHash = await hashVisitor(ip, ua);
  const { target_type, target_id, reaction_type, action } = parsed.data;

  if (action === "add") await addReaction(target_type, target_id, reaction_type, visitorHash);
  else await removeReaction(target_type, target_id, reaction_type, visitorHash);

  const counts = await getReactionCounts(target_type, target_id);
  return NextResponse.json({ ok: true, counts });
}

export async function GET(req: NextRequest) {
  const targetType = req.nextUrl.searchParams.get("target_type") as "post" | "comment" | null;
  const targetId = Number(req.nextUrl.searchParams.get("target_id"));
  if (!targetType || !targetId) return NextResponse.json({ error: "پارامتر ناقص" }, { status: 400 });

  const counts = await getReactionCounts(targetType, targetId);
  return NextResponse.json({ counts });
}

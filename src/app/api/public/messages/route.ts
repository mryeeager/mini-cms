import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDB } from "@/lib/db";

const MessageInput = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  body: z.string().min(1).max(3000),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = MessageInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "لطفاً فرم رو کامل پر کن" }, { status: 400 });
  }

  await getDB()
    .prepare(`INSERT INTO messages (name, email, body) VALUES (?, ?, ?)`)
    .bind(parsed.data.name, parsed.data.email || null, parsed.data.body)
    .run();

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { CommentInput, submitComment } from "@/lib/comments";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("cf-connecting-ip");
  const body = await req.json().catch(() => null);
  const parsed = CommentInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "لطفاً فرم رو کامل و درست پر کن" }, { status: 400 });
  }

  await submitComment(parsed.data, ip);
  // Per project rule: every comment needs admin approval before it's shown publicly.
  return NextResponse.json({ ok: true, message: "نظر شما ثبت شد و بعد از تأیید نمایش داده میشه" });
}

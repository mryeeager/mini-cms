import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { PostInput, createPost, listPostsAdmin } from "@/lib/posts";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 50);
  const offset = Number(req.nextUrl.searchParams.get("offset") ?? 0);
  const posts = await listPostsAdmin(limit, offset);
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = PostInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.status === "scheduled" && !parsed.data.published_at) {
    return NextResponse.json({ error: "برای زمان‌بندی، تاریخ انتشار لازم است" }, { status: 400 });
  }

  const created = await createPost(user.id, parsed.data);
  return NextResponse.json({ ok: true, ...created }, { status: 201 });
}

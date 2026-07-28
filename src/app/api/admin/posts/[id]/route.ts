import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getDB } from "@/lib/db";
import { PostInput, updatePost, deletePost } from "@/lib/posts";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const { id } = await params;
  const post = await getDB()
    .prepare(`SELECT * FROM posts WHERE id = ?`)
    .bind(Number(id))
    .first();
  if (!post) return NextResponse.json({ error: "پیدا نشد" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PUT(req: NextRequest, { params }: Params) {
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

  const { id } = await params;
  try {
    await updatePost(Number(id), parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "پیدا نشد" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const { id } = await params;
  await deletePost(Number(id));
  return NextResponse.json({ ok: true });
}

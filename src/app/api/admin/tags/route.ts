import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getDB } from "@/lib/db";
import { createTag, deleteTag } from "@/lib/taxonomy";

export async function GET() {
  const { results } = await getDB().prepare(`SELECT * FROM tags ORDER BY name`).all();
  return NextResponse.json({ tags: results });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const { name } = (await req.json().catch(() => ({}))) as any;
  if (!name?.trim()) return NextResponse.json({ error: "نام لازم است" }, { status: 400 });

  try {
    await createTag(name.trim());
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (String(e?.message ?? e).includes("UNIQUE")) {
      return NextResponse.json({ error: "این برچسب قبلاً ثبت شده" }, { status: 409 });
    }
    return NextResponse.json({ error: "خطا در ثبت برچسب" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const id = Number(req.nextUrl.searchParams.get("id"));
  await deleteTag(id);
  return NextResponse.json({ ok: true });
}

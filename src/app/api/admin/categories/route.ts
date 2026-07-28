import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getDB } from "@/lib/db";
import { createCategory, deleteCategory } from "@/lib/taxonomy";

export async function GET() {
  const { results } = await getDB().prepare(`SELECT * FROM categories ORDER BY name`).all();
  return NextResponse.json({ categories: results });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const { name } = (await req.json().catch(() => ({}))) as any;
  if (!name?.trim()) return NextResponse.json({ error: "نام لازم است" }, { status: 400 });

  try {
    await createCategory(name.trim());
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (String(e?.message ?? e).includes("UNIQUE")) {
      return NextResponse.json({ error: "این دسته‌بندی قبلاً ثبت شده" }, { status: 409 });
    }
    return NextResponse.json({ error: "خطا در ثبت دسته‌بندی" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const id = Number(req.nextUrl.searchParams.get("id"));
  try {
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Shouldn't happen now that posts.category_id is ON DELETE SET NULL, but
    // stay defensive in case the DB has an older schema without that cascade.
    return NextResponse.json({ error: "حذف این دسته‌بندی ممکن نشد" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getDB } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const { results } = await getDB()
    .prepare(`SELECT * FROM messages ORDER BY created_at DESC`)
    .all();
  return NextResponse.json({ messages: results });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const { id, status } = (await req.json().catch(() => ({}))) as any;
  await getDB().prepare(`UPDATE messages SET status = ? WHERE id = ?`).bind(status, Number(id)).run();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const id = Number(req.nextUrl.searchParams.get("id"));
  await getDB().prepare(`DELETE FROM messages WHERE id = ?`).bind(id).run();
  return NextResponse.json({ ok: true });
}

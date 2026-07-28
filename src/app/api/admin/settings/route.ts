import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getSettings, updateSettings } from "@/lib/settings";
import { getDB } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/crypto";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as any;
  await updateSettings(body);
  return NextResponse.json({ ok: true });
}

/** Admin password change — separate endpoint since it needs the current password re-checked. */
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const { current_password, new_password } = (await req.json().catch(() => ({}))) as any;
  if (!current_password || !new_password || new_password.length < 10) {
    return NextResponse.json({ error: "رمز جدید باید حداقل ۱۰ کاراکتر باشه" }, { status: 400 });
  }

  const db = getDB();
  const row = await db
    .prepare(`SELECT password_hash FROM users WHERE id = ?`)
    .bind(user.id)
    .first<{ password_hash: string }>();

  const ok = row && (await verifyPassword(current_password, row.password_hash));
  if (!ok) return NextResponse.json({ error: "رمز فعلی اشتباه است" }, { status: 401 });

  const newHash = await hashPassword(new_password);
  await db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).bind(newHash, user.id).run();
  return NextResponse.json({ ok: true });
}

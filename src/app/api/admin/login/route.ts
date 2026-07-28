import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDB } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";
import { createSession } from "@/lib/session";
import { assertNotLocked, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";

const LoginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  const userAgent = req.headers.get("user-agent");

  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ورودی نامعتبر است" }, { status: 400 });
  }
  const { username, password } = parsed.data;
  const rateKey = `ip:${ip}`;

  try {
    await assertNotLocked(rateKey);
  } catch {
    return NextResponse.json(
      { error: "به دلیل تلاش‌های ناموفق زیاد، چند دقیقه صبر کن." },
      { status: 429 }
    );
  }

  const db = getDB();
  const user = await db
    .prepare(`SELECT id, username, password_hash FROM users WHERE username = ?`)
    .bind(username)
    .first<{ id: number; username: string; password_hash: string }>();

  const ok = user ? await verifyPassword(password, user.password_hash) : false;

  if (!user || !ok) {
    await recordFailedAttempt(rateKey);
    // Same generic message whether username or password was wrong (no user enumeration).
    return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
  }

  await clearAttempts(rateKey);
  await createSession(user.id, ip, userAgent);

  return NextResponse.json({ ok: true });
}

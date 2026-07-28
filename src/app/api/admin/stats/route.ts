import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getDB } from "@/lib/db";
import { getStorageUsage } from "@/lib/media";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const db = getDB();
  const [posts, views, pendingComments, unreadMessages, usage] = await Promise.all([
    db.prepare(`SELECT COUNT(*) as n FROM posts`).first<{ n: number }>(),
    db.prepare(`SELECT COALESCE(SUM(view_count), 0) as n FROM posts`).first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) as n FROM comments WHERE status = 'pending'`).first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) as n FROM messages WHERE status = 'unread'`).first<{ n: number }>(),
    getStorageUsage(),
  ]);

  return NextResponse.json({
    postCount: posts?.n ?? 0,
    totalViews: views?.n ?? 0,
    pendingComments: pendingComments?.n ?? 0,
    unreadMessages: unreadMessages?.n ?? 0,
    storage: usage,
  });
}

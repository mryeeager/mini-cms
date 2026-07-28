import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  listCommentsAdmin,
  approveComment,
  rejectComment,
  deleteComment,
  replyAsAdmin,
} from "@/lib/comments";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const comments = await listCommentsAdmin(status);
  return NextResponse.json({ comments });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as any;

  if (body.action === "approve") {
    await approveComment(Number(body.id));
  } else if (body.action === "reject") {
    await rejectComment(Number(body.id));
  } else if (body.action === "reply") {
    await replyAsAdmin(
      Number(body.post_id),
      Number(body.id),
      String(body.reply_body ?? ""),
      user.display_name ?? user.username
    );
  } else {
    return NextResponse.json({ error: "عملیات نامعتبر" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const id = Number(req.nextUrl.searchParams.get("id"));
  await deleteComment(id);
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { deleteMedia, setAutoDeleteRule } from "@/lib/media";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const { id } = await params;
  await deleteMedia(Number(id));
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as any;
  const days = body?.auto_delete_after_days === null ? null : Number(body.auto_delete_after_days);
  const { id } = await params;
  await setAutoDeleteRule(Number(id), Number.isFinite(days) ? days : null);
  return NextResponse.json({ ok: true });
}

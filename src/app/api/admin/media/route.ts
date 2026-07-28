import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { uploadMedia, listMedia, getStorageUsage } from "@/lib/media";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 60);
  const offset = Number(req.nextUrl.searchParams.get("offset") ?? 0);
  const [media, usage] = await Promise.all([listMedia(limit, offset), getStorageUsage()]);
  return NextResponse.json({ media, usage });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "لطفاً وارد شو" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "فایلی ارسال نشد" }, { status: 400 });
  }

  try {
    const result = await uploadMedia(file, user.id);
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (e: any) {
    const messages: Record<string, string> = {
      UNSUPPORTED_TYPE: "این نوع فایل پشتیبانی نمیشه",
      TOO_LARGE: "حجم فایل بیشتر از حد مجازه",
      STORAGE_FULL: "فضای ذخیره‌سازی پر شده — فایل قدیمی حذف کن یا هشدار رو بررسی کن",
    };
    return NextResponse.json({ error: messages[e.message] ?? "خطا در آپلود" }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: keyParts } = await params;
  const key = keyParts.join("/");
  const env = getEnv();

  const result = await env.MEDIA_KV.getWithMetadata(key, { type: "arrayBuffer" });
  if (!result.value) {
    return NextResponse.json({ error: "پیدا نشد" }, { status: 404 });
  }

  const metadata = result.metadata as { contentType?: string } | null;
  const contentType = metadata?.contentType ?? "application/octet-stream";

  return new NextResponse(result.value, {
    headers: {
      "Content-Type": contentType,
      // Fingerprinted key (random token in the path) -> safe to cache hard.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

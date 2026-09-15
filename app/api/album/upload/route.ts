export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file     = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Validate type and size
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WEBP, GIF allowed" }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 25 MB)" }, { status: 400 });
  }

  const ext = file.type === "image/webp" ? "webp"
    : file.type === "image/png" ? "png"
    : file.type === "image/gif" ? "gif"
    : "jpg";
  // UUID-based filename to avoid collisions
  const uuid    = crypto.randomUUID();
  const r2Key   = `album/${uuid}.${ext}`;
  let   imageUrl: string;

  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    const ctx    = getRequestContext();
    const bucket = (ctx.env as Record<string, unknown>).PHOTOS_BUCKET as {
      put(key: string, body: ArrayBuffer, opts?: { httpMetadata?: { contentType?: string } }): Promise<void>;
    } | undefined;

    if (bucket) {
      await bucket.put(r2Key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
      });
      imageUrl = `https://pub-29a3cf472efd4751affcf08e955f23bf.r2.dev/${r2Key}`;
    } else {
      // Local dev placeholder
      imageUrl = `https://picsum.photos/seed/${uuid}/600/800`;
    }
  } catch {
    imageUrl = `https://picsum.photos/seed/${uuid}/600/800`;
  }

  return NextResponse.json({ image_url: imageUrl, r2_key: r2Key, id: uuid });
}

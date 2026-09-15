import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db-adapter";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const formData   = await request.formData();
  const file       = formData.get("file")         as File | null;
  const entryId    = formData.get("entry_id")     as string | null;
  const label      = formData.get("label")        as string | null;
  const existingUrl = formData.get("existing_url") as string | null;

  // If we already have a URL (photo was pre-uploaded), just link it to entry
if (existingUrl && entryId) {
    const db = await getDb();
    let photoId: number | undefined;
    if (db) {
      await db.execute(
        "INSERT INTO photos (entry_id, url, label) VALUES (?,?,?)",
        [parseInt(entryId), existingUrl, label ?? null]
      );
      const row = await db.queryFirst<{ id: number }>(
        "SELECT id FROM photos ORDER BY id DESC LIMIT 1"
      );
      photoId = row?.id;
    }
    return NextResponse.json({ url: existingUrl, id: photoId });
  }

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowedTypes: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png":  "png",
    "image/webp": "webp",
    "image/gif":  "gif",
  };
  const ext = allowedTypes[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Only JPG, PNG, WEBP, GIF allowed" }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 25 MB)" }, { status: 400 });
  }

  let url: string;

  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    const ctx    = getRequestContext();
    const bucket = (ctx.env as Record<string, unknown>).PHOTOS_BUCKET as {
      put(key: string, body: ArrayBuffer, opts?: { httpMetadata?: { contentType?: string } }): Promise<void>;
    } | undefined;

    if (bucket) {
      const key = `photos/${entryId ?? "misc"}/${Date.now()}.${ext}`;
      await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
      url = `https://pub-29a3cf472efd4751affcf08e955f23bf.r2.dev/${key}`;
    } else {
      url = `https://picsum.photos/seed/${Date.now()}/400/600`;
    }
  } catch {
    url = `https://picsum.photos/seed/${Date.now()}/400/600`;
  }

let photoId: number | undefined;

  if (entryId) {
    const db = await getDb();
    if (db) {
      await db.execute(
        "INSERT INTO photos (entry_id, url, label) VALUES (?,?,?)",
        [parseInt(entryId), url, label ?? null]
      );
      const row = await db.queryFirst<{ id: number }>(
        "SELECT id FROM photos ORDER BY id DESC LIMIT 1"
      );
      photoId = row?.id;
    }
  }

  return NextResponse.json({ url, id: photoId });
}
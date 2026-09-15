export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db-adapter";
import { sendPush } from "@/lib/push";

const CreateSchema = z.object({
  id:         z.string().min(1),
  image_url:  z.string().min(1),
  r2_key:     z.string().min(1),
  caption:    z.string().optional(),
  taken_date: z.string().optional(),
  favorite:   z.number().min(0).max(1).optional(),
  added_by:   z.enum(["1", "2"]).default("1"),
});

export async function GET(request: NextRequest) {
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const search    = searchParams.get("search")    ?? "";
  const sort      = searchParams.get("sort")      ?? "newest";
  const favorites = searchParams.get("favorites") === "1";
  const page      = parseInt(searchParams.get("page")  ?? "1");
  const limit     = parseInt(searchParams.get("limit") ?? "24");
  const offset    = (page - 1) * limit;

  const conditions: string[] = ["1=1"];
  const params: unknown[]    = [];

  if (search)    { conditions.push("caption LIKE ?"); params.push(`%${search}%`); }
  if (favorites) { conditions.push("favorite = 1"); }

  const where = conditions.join(" AND ");

  const orderMap: Record<string, string> = {
    newest:    "created_at DESC",
    oldest:    "created_at ASC",
    favorites: "favorite DESC, created_at DESC",
    random:    "RANDOM()",
  };
  const order = orderMap[sort] ?? orderMap.newest;

  const [photos, countRow] = await Promise.all([
    db.query(
      `SELECT * FROM album_photos WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ),
    db.queryFirst<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM album_photos WHERE ${where}`,
      params
    ),
  ]);

  return NextResponse.json({
    items: photos,
    total: Number(countRow?.cnt ?? 0),
    page,
    pageSize: limit,
  });
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 422 });
  }

  const d = parsed.data;
  await db.execute(
    `INSERT INTO album_photos (id, image_url, r2_key, caption, taken_date, favorite, added_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [d.id, d.image_url, d.r2_key, d.caption ?? null, d.taken_date ?? null, d.favorite ?? 0, d.added_by]
  );

  const photo = await db.queryFirst("SELECT * FROM album_photos WHERE id = ?", [d.id]);

  await sendPush(d.added_by, {
    title: "New memory added 📸",
    body:  d.caption ? d.caption : "A new photo was added to The Album.",
    url:   "/album",
  }).catch(() => {});

  return NextResponse.json({ data: photo }, { status: 201 });
}

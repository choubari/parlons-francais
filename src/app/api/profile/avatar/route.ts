import { NextRequest, NextResponse } from "next/server";
import { getDb, getEnv } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/user";
import { randomToken } from "@/lib/auth/crypto";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const OK_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const env = await getEnv();
  if (!env.AVATARS) {
    return NextResponse.json(
      { error: "Avatar storage isn't configured (R2 bucket 'AVATARS' missing)." },
      { status: 501 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!OK_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Use a PNG, JPEG, WebP or GIF image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 2 MB." }, { status: 400 });
  }

  const ext = file.type.split("/")[1] ?? "png";
  const key = `${user.id}/${randomToken(6)}.${ext}`;
  const buf = await file.arrayBuffer();
  await env.AVATARS.put(key, buf, { httpMetadata: { contentType: file.type } });

  const db = await getDb();
  await db.prepare("UPDATE users SET avatar_key = ? WHERE id = ?").bind(key, user.id).run();

  return NextResponse.json({ ok: true, avatarKey: key });
}

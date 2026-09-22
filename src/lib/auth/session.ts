import "server-only";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db/client";
import { randomToken } from "./crypto";

const COOKIE = "cct_session";
const SESSION_DAYS = 30;
const isProd = process.env.NODE_ENV === "production";

export async function createSession(userId: string): Promise<void> {
  const db = await getDb();
  const id = randomToken(32);
  const now = Date.now();
  const expires = now + SESSION_DAYS * 86_400_000;
  await db
    .prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(id, userId, expires, now)
    .run();
  const jar = await cookies();
  jar.set(COOKIE, id, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (id) {
    const db = await getDb();
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
  }
  jar.delete(COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  const db = await getDb();
  const row = await db
    .prepare("SELECT user_id, expires_at FROM sessions WHERE id = ?")
    .bind(id)
    .first<{ user_id: string; expires_at: number }>();
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
    return null;
  }
  return row.user_id;
}

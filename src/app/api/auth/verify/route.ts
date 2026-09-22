import { NextRequest, NextResponse } from "next/server";
import { getDb, getEnv } from "@/lib/db/client";
import { sha256, randomToken } from "@/lib/auth/crypto";
import { ensureSeeded } from "@/lib/db/seed";
import { createSession } from "@/lib/auth/session";

// Light per-IP limiter so verify can't be brute-forced.
const verifyHits = new Map<string, number[]>();
function verifyLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (verifyHits.get(ip) ?? []).filter((t) => now - t < 60_000);
  arr.push(now);
  verifyHits.set(ip, arr);
  return arr.length > 20;
}

export async function GET(req: NextRequest) {
  const db = await getDb();
  await ensureSeeded(db);
  const env = await getEnv();
  // In dev, redirect back to the real request origin (localhost) — wrangler.toml
  // [vars] APP_URL would otherwise send us to the prod domain. Prefer APP_URL in
  // production for canonical callbacks.
  const reqOrigin = new URL(req.url).origin;
  const isProd = process.env.NODE_ENV === "production";
  const base = (isProd ? env.APP_URL || reqOrigin : reqOrigin).replace(/\/$/, "");

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local";
  if (verifyLimited(ip)) {
    return NextResponse.redirect(`${base}/login?error=link`);
  }

  const raw = new URL(req.url).searchParams.get("token") ?? "";
  const fail = () => NextResponse.redirect(`${base}/login?error=link`);
  if (!raw) return fail();

  const hash = await sha256(raw);
  const row = await db
    .prepare("SELECT email, expires_at, used FROM magic_tokens WHERE token_hash = ?")
    .bind(hash)
    .first<{ email: string; expires_at: number; used: number }>();
  if (!row || row.used === 1 || row.expires_at < Date.now()) return fail();

  await db.prepare("UPDATE magic_tokens SET used = 1 WHERE token_hash = ?").bind(hash).run();

  const email = row.email.toLowerCase();
  // Find or create the user. Admin email keeps the seeded 'admin' row.
  let user = await db
    .prepare("SELECT id, first_name, last_name FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: string; first_name: string | null; last_name: string | null }>();

  if (!user) {
    const id = `u_${randomToken(8)}`;
    const isAdmin = (env.ADMIN_EMAIL || "").toLowerCase() === email;
    await db
      .prepare(
        "INSERT INTO users (id, email, role, created_at) VALUES (?, ?, ?, ?)"
      )
      .bind(id, email, isAdmin ? "admin" : "user", Date.now())
      .run();
    user = { id, first_name: null, last_name: null };
  }

  await createSession(user.id);

  const needsOnboarding = !user.first_name?.trim() || !user.last_name?.trim();
  return NextResponse.redirect(`${base}${needsOnboarding ? "/onboarding" : "/"}`);
}

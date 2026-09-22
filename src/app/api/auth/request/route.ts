import { NextRequest, NextResponse } from "next/server";
import { getDb, getEnv } from "@/lib/db/client";
import { randomToken, sha256 } from "@/lib/auth/crypto";
import { sendMagicLink } from "@/lib/auth/email";

const TOKEN_TTL_MS = 15 * 60_000;

// Small in-memory limiters to protect the email quota / an inbox:
//  - per IP: 5 requests / minute
//  - per email: 3 links / 10 minutes
const ipHits = new Map<string, number[]>();
const emailHits = new Map<string, number[]>();
function limited(map: Map<string, number[]>, key: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  const arr = (map.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  map.set(key, arr);
  return arr.length > max;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local";
  if (limited(ipHits, ip, 60_000, 5)) {
    return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 });
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (limited(emailHits, email, 10 * 60_000, 3)) {
    return NextResponse.json(
      { error: "Too many links requested for this email. Try again shortly." },
      { status: 429 }
    );
  }

  const db = await getDb();
  const env = await getEnv();
  const raw = randomToken(32);
  const hash = await sha256(raw);
  const now = Date.now();

  await db
    .prepare(
      "INSERT INTO magic_tokens (token_hash, email, expires_at, created_at) VALUES (?, ?, ?, ?)"
    )
    .bind(hash, email, now + TOKEN_TTL_MS, now)
    .run();

  // In dev, use the real request origin (localhost) — `env.APP_URL` comes from
  // wrangler.toml [vars] and would otherwise inject the prod URL. In prod,
  // prefer APP_URL so callbacks resolve to the canonical domain.
  const reqOrigin = new URL(req.url).origin;
  const isProd = process.env.NODE_ENV === "production";
  const base = (isProd ? env.APP_URL || reqOrigin : reqOrigin).replace(/\/$/, "");
  const url = `${base}/api/auth/verify?token=${raw}`;

  try {
    await sendMagicLink(email, url);
  } catch (e) {
    console.error("[auth] email send failed", e);
    return NextResponse.json({ error: "Could not send the email right now." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

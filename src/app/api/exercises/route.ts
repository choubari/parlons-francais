import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { ensureSeeded } from "@/lib/db/seed";
import { listCards, createExercise } from "@/lib/db/exercises";
import { getCurrentUser } from "@/lib/auth/user";
import { PUBLIC_THEME_LIST } from "@/lib/exercises/themes";
import type { Localized } from "@/lib/exercises/types";

export async function GET() {
  const db = await getDb();
  await ensureSeeded(db);
  const user = await getCurrentUser();
  const cards = await listCards(db, user?.id ?? null);
  const present = new Set(cards.map((c) => c.theme));
  const themes = PUBLIC_THEME_LIST.filter((t) => present.has(t.id));
  return NextResponse.json({ cards, themes });
}

function loc(v: unknown): Localized {
  const o = (v ?? {}) as { en?: string; fr?: string };
  const en = (o.en ?? "").toString().slice(0, 2000);
  const fr = (o.fr ?? en).toString().slice(0, 2000);
  return { en, fr };
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const title = loc(b.title);
  if (!title.en.trim()) {
    return NextResponse.json({ error: "A title is required." }, { status: 400 });
  }
  const difficulty = ["easy", "medium", "hard"].includes(String(b.difficulty))
    ? (b.difficulty as string)
    : "medium";
  const gender = b.gender === "male" ? "male" : "female";
  const visibility = b.visibility === "public" ? "public" : "private";

  const db = await getDb();
  const id = await createExercise(db, user.id, {
    theme: (b.theme as string) || "custom",
    difficulty,
    gender,
    title,
    product: loc(b.product),
    prospectProfile: loc(b.prospectProfile),
    researchBrief: loc(b.researchBrief),
    goal: loc(b.goal),
    prospectPersona: (b.prospectPersona as string)?.slice(0, 4000) || "a realistic, moderately skeptical prospect",
    visibility,
  });

  return NextResponse.json({ id });
}

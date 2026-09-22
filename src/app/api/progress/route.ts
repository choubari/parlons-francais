import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { listUserScores } from "@/lib/db/scores";
import { getCurrentUser } from "@/lib/auth/user";
import { computeStats } from "@/lib/ui/stats";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const db = await getDb();
  const scores = await listUserScores(db, user.id);
  const stats = computeStats(scores);
  const entries = scores.map((s) => ({
    id: s.id,
    exerciseTitle: s.exerciseTitle,
    total: Math.round(s.total),
    band: s.band,
    at: s.at,
  }));
  return NextResponse.json({ stats, entries });
}

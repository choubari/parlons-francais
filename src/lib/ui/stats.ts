import type { ScoreCard } from "@/lib/judge";
import { CORRECTION_TYPES } from "@/lib/judge";

/** Minimal shape needed to compute stats — satisfied by DB session rows. */
export type StatInput = { total: number; band: string; at: number; scoreCard: ScoreCard };

export type ProgressStats = {
  totalCalls: number;
  avgScore: number;
  bestScore: number;
  streak: number;
  /** Count of corrections per error type, across all sessions (most frequent first). */
  skills: { key: string; score: number }[];
  /** Kept for compatibility; unused (no competitive badges). */
  badges: string[];
};

/** Consecutive-day streak ending today (or yesterday), from call timestamps. */
function computeStreak(entries: StatInput[]): number {
  if (entries.length === 0) return 0;
  const days = new Set(
    entries.map((e) => new Date(e.at).toISOString().slice(0, 10))
  );
  const DAY = 86_400_000;
  let cursor = new Date();
  // Allow the streak to count if the most recent call was today or yesterday.
  const today = cursor.toISOString().slice(0, 10);
  const yesterday = new Date(cursor.getTime() - DAY).toISOString().slice(0, 10);
  if (!days.has(today) && !days.has(yesterday)) return 0;
  if (!days.has(today)) cursor = new Date(cursor.getTime() - DAY);

  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor = new Date(cursor.getTime() - DAY);
  }
  return streak;
}

export function computeStats(entries: StatInput[]): ProgressStats {
  const totalCalls = entries.length;
  const avgScore =
    totalCalls > 0
      ? Math.round(entries.reduce((s, e) => s + e.total, 0) / totalCalls)
      : 0;
  const bestScore = entries.reduce((m, e) => Math.max(m, Math.round(e.total)), 0);

  // Count corrections by error type across all sessions (most frequent first).
  const counts = new Map<string, number>(CORRECTION_TYPES.map((k) => [k, 0]));
  for (const e of entries) {
    for (const c of e.scoreCard.corrections ?? []) {
      counts.set(c.type, (counts.get(c.type) ?? 0) + 1);
    }
  }
  const skills = Array.from(counts, ([key, score]) => ({ key, score }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return {
    totalCalls,
    avgScore,
    bestScore,
    streak: computeStreak(entries),
    skills,
    badges: [],
  };
}

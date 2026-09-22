import "server-only";
import type { D1Database } from "./client";
import type { ScoreCard } from "@/lib/judge";
import { randomToken } from "@/lib/auth/crypto";
import { displayName } from "@/lib/auth/user";

export type ScoreEntry = {
  id: string;
  exerciseId: string | null;
  exerciseTitle: string;
  theme: string | null;
  total: number;
  band: string;
  booked: boolean;
  scoreCard: ScoreCard;
  at: number;
};

type ScoreRow = {
  id: string;
  exercise_id: string | null;
  exercise_title: string;
  theme: string | null;
  total: number;
  band: string;
  booked: number;
  scorecard: string;
  created_at: number;
};

function mapRow(r: ScoreRow): ScoreEntry {
  return {
    id: r.id,
    exerciseId: r.exercise_id,
    exerciseTitle: r.exercise_title,
    theme: r.theme,
    total: r.total,
    band: r.band,
    booked: r.booked === 1,
    scoreCard: JSON.parse(r.scorecard) as ScoreCard,
    at: r.created_at,
  };
}

export async function saveScore(
  db: D1Database,
  userId: string,
  data: {
    exerciseId: string | null;
    exerciseTitle: string;
    theme: string | null;
    scoreCard: ScoreCard;
  }
): Promise<string> {
  const id = `sc_${randomToken(8)}`;
  await db
    .prepare(
      `INSERT INTO scores (id, user_id, exercise_id, exercise_title, theme, total, band, booked, scorecard, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      userId,
      data.exerciseId,
      data.exerciseTitle,
      data.theme,
      Math.round(data.scoreCard.total),
      data.scoreCard.band,
      data.scoreCard.bookedNextStep ? 1 : 0,
      JSON.stringify(data.scoreCard),
      Date.now()
    )
    .run();
  return id;
}

/** A single saved score for its owner (used by the shareable result URL). */
export async function getScore(
  db: D1Database,
  id: string,
  userId: string
): Promise<ScoreEntry | null> {
  const row = await db
    .prepare("SELECT * FROM scores WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .first<ScoreRow>();
  return row ? mapRow(row) : null;
}

export async function listUserScores(db: D1Database, userId: string): Promise<ScoreEntry[]> {
  const { results } = await db
    .prepare("SELECT * FROM scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 200")
    .bind(userId)
    .all<ScoreRow>();
  return results.map(mapRow);
}

export type LeaderboardRow = {
  name: string;
  avatarKey: string | null;
  best: number;
  calls: number;
  streak: number;
};

/** Best score per user, with call count and consecutive-day streak. */
export async function globalLeaderboard(db: D1Database, limit = 30): Promise<LeaderboardRow[]> {
  const { results } = await db
    .prepare(
      `SELECT s.user_id, s.total, s.created_at,
              u.first_name, u.last_name, u.email, u.avatar_key
       FROM scores s JOIN users u ON u.id = s.user_id`
    )
    .all<{
      user_id: string;
      total: number;
      created_at: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      avatar_key: string | null;
    }>();

  const byUser = new Map<
    string,
    { name: string; avatarKey: string | null; best: number; calls: number; days: Set<string> }
  >();
  for (const r of results) {
    let u = byUser.get(r.user_id);
    if (!u) {
      u = {
        name: displayName({ firstName: r.first_name, lastName: r.last_name, email: r.email }),
        avatarKey: r.avatar_key,
        best: 0,
        calls: 0,
        days: new Set(),
      };
      byUser.set(r.user_id, u);
    }
    u.best = Math.max(u.best, r.total);
    u.calls += 1;
    u.days.add(new Date(r.created_at).toISOString().slice(0, 10));
  }

  const rows: LeaderboardRow[] = Array.from(byUser.values()).map((u) => ({
    name: u.name,
    avatarKey: u.avatarKey,
    best: u.best,
    calls: u.calls,
    streak: streakFromDays(u.days),
  }));
  rows.sort((a, b) => b.best - a.best || b.calls - a.calls);
  return rows.slice(0, limit);
}

function streakFromDays(days: Set<string>): number {
  if (days.size === 0) return 0;
  const DAY = 86_400_000;
  let cursor = new Date();
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

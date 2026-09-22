import "server-only";
import type { D1Database } from "./client";
import type { Localized } from "@/lib/exercises/types";
import { randomToken } from "@/lib/auth/crypto";

export interface ExerciseRow {
  id: string;
  theme: string;
  difficulty: string;
  gender: string;
  title_en: string; title_fr: string;
  product_en: string; product_fr: string;
  prospect_profile_en: string; prospect_profile_fr: string;
  research_brief_en: string; research_brief_fr: string;
  goal_en: string; goal_fr: string;
  prospect_persona: string;
  created_by: string;
  visibility: string;
  is_builtin: number;
  created_at: number;
  creator_first?: string | null;
  creator_last?: string | null;
}

/** Client-safe exercise card — never carries the raw persona prompt. */
export type ExerciseCardDTO = {
  id: string;
  theme: string;
  difficulty: string;
  title: Localized;
  product: Localized;
  prospectProfile: Localized;
  researchBrief: Localized;
  goal: Localized;
  creator: string;
  isBuiltin: boolean;
  visibility: string;
  ownedByMe: boolean;
};

function creatorName(row: ExerciseRow): string {
  const name = [row.creator_first, row.creator_last].filter(Boolean).join(" ").trim();
  return name || "Parlons";
}

export function toCardDTO(row: ExerciseRow, viewerId: string | null): ExerciseCardDTO {
  return {
    id: row.id,
    theme: row.theme,
    difficulty: row.difficulty,
    title: { en: row.title_en, fr: row.title_fr },
    product: { en: row.product_en, fr: row.product_fr },
    prospectProfile: { en: row.prospect_profile_en, fr: row.prospect_profile_fr },
    researchBrief: { en: row.research_brief_en, fr: row.research_brief_fr },
    goal: { en: row.goal_en, fr: row.goal_fr },
    creator: creatorName(row),
    isBuiltin: row.is_builtin === 1,
    visibility: row.visibility,
    ownedByMe: viewerId != null && row.created_by === viewerId,
  };
}

const SELECT = `
  SELECT e.*, u.first_name AS creator_first, u.last_name AS creator_last
  FROM exercises e JOIN users u ON u.id = e.created_by`;

/** Public exercises plus the viewer's own private ones. */
export async function listCards(db: D1Database, viewerId: string | null): Promise<ExerciseCardDTO[]> {
  const { results } = await db
    .prepare(
      `${SELECT}
       WHERE e.visibility = 'public' OR e.created_by = ?
       ORDER BY e.is_builtin DESC, e.created_at DESC`
    )
    .bind(viewerId ?? "")
    .all<ExerciseRow>();
  return results.map((r) => toCardDTO(r, viewerId));
}

/** Full row (incl. persona) for a single exercise the viewer may run. */
export async function getRunnable(
  db: D1Database,
  id: string,
  viewerId: string | null
): Promise<ExerciseRow | null> {
  const row = await db.prepare(`${SELECT} WHERE e.id = ?`).bind(id).first<ExerciseRow>();
  if (!row) return null;
  if (row.visibility !== "public" && row.created_by !== viewerId) return null;
  return row;
}

export async function createExercise(
  db: D1Database,
  userId: string,
  data: {
    theme: string;
    difficulty: string;
    gender: string;
    title: Localized;
    product: Localized;
    prospectProfile: Localized;
    researchBrief: Localized;
    goal: Localized;
    prospectPersona: string;
    visibility: "public" | "private";
  }
): Promise<string> {
  const id = `ex_${randomToken(8)}`;
  await db
    .prepare(
      `INSERT INTO exercises (
         id, theme, difficulty, gender,
         title_en, title_fr, product_en, product_fr,
         prospect_profile_en, prospect_profile_fr,
         research_brief_en, research_brief_fr, goal_en, goal_fr,
         prospect_persona, created_by, visibility, is_builtin, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
    )
    .bind(
      id, data.theme, data.difficulty, data.gender,
      data.title.en, data.title.fr, data.product.en, data.product.fr,
      data.prospectProfile.en, data.prospectProfile.fr,
      data.researchBrief.en, data.researchBrief.fr, data.goal.en, data.goal.fr,
      data.prospectPersona, userId, data.visibility, Date.now()
    )
    .run();
  return id;
}

export async function deleteExercise(db: D1Database, userId: string, id: string): Promise<void> {
  await db
    .prepare("DELETE FROM exercises WHERE id = ? AND created_by = ? AND is_builtin = 0")
    .bind(id, userId)
    .run();
}

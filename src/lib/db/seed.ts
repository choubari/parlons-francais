import "server-only";
import type { D1Database } from "./client";
import { getEnv } from "./client";
import { BUILTIN_EXERCISES } from "@/lib/exercises/builtins";

export const ADMIN_ID = "admin";

/**
 * Idempotently ensure the admin user and built-in exercises exist. Runs once
 * (guarded by a `meta` flag); safe to call at the top of DB-backed handlers.
 */
export async function ensureSeeded(db: D1Database): Promise<void> {
  const flag = await db
    .prepare("SELECT value FROM meta WHERE key = 'seeded'")
    .first<{ value: string }>();
  if (flag?.value === "1") return;

  const env = await getEnv();
  const adminEmail = (env.ADMIN_EMAIL || "admin@parlons.local").toLowerCase();
  const now = Date.now();

  // Admin user (owns the built-in situations). Displayed as "Équipe Parlons".
  await db
    .prepare(
      `INSERT INTO users (id, email, first_name, last_name, role, created_at)
       VALUES (?, ?, 'Équipe', 'Parlons', 'admin', ?)
       ON CONFLICT(id) DO UPDATE SET email = excluded.email, role = 'admin'`
    )
    .bind(ADMIN_ID, adminEmail, now)
    .run();

  for (const ex of BUILTIN_EXERCISES) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO exercises (
           id, theme, difficulty, gender,
           title_en, title_fr, product_en, product_fr,
           prospect_profile_en, prospect_profile_fr,
           research_brief_en, research_brief_fr, goal_en, goal_fr,
           prospect_persona, created_by, visibility, is_builtin, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'public', 1, ?)`
      )
      .bind(
        ex.id, ex.theme, ex.difficulty, ex.gender,
        ex.title.en, ex.title.fr, ex.product.en, ex.product.fr,
        ex.prospectProfile.en, ex.prospectProfile.fr,
        ex.researchBrief.en, ex.researchBrief.fr, ex.goal.en, ex.goal.fr,
        ex.prospectPersona, ADMIN_ID, now
      )
      .run();
  }

  await db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('seeded', '1')").run();
}

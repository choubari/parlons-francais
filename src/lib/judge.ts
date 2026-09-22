import { z } from "zod";

// French correction report. Produced at the end of a session by the judge model.
// Kept under the name "ScoreCard" so the DB layer (scores.ts) is unchanged; the
// meaning is a language report, not a competitive score.

export const CORRECTION_TYPES = [
  "orthographe",
  "conjugaison",
  "grammaire",
  "vocabulaire",
  "syntaxe",
] as const;

export const correctionSchema = z.object({
  /** What the learner said (their phrase, verbatim or lightly trimmed). */
  original: z.string(),
  /** The corrected French. */
  corrected: z.string(),
  /** Error category. */
  type: z.enum(CORRECTION_TYPES),
  /** Short, kind explanation in French of the rule. */
  explanation: z.string(),
});
export type Correction = z.infer<typeof correctionSchema>;

export const scoreCardSchema = z.object({
  /** All corrections found across the learner's turns. */
  corrections: z.array(correctionSchema),
  /** Overall spoken-French quality this session, 0–100 (personal, not ranked). */
  total: z.number().min(0).max(100),
  /** Estimated level. */
  band: z.enum(["Débutant", "Intermédiaire", "Avancé", "Courant"]),
  /** 1–3 things the learner did well, in French. */
  strengths: z.array(z.string()),
  /** Reserved (unused here — no competitive step). */
  bookedNextStep: z.boolean(),
  /** 2–3 sentences of encouragement + the single thing to work on next. */
  verdict: z.string(),
});
export type ScoreCard = z.infer<typeof scoreCardSchema>;

/** JSON schema handed to Gemini for structured output. */
export const responseJsonSchema = {
  type: "object",
  properties: {
    corrections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          corrected: { type: "string" },
          type: { type: "string", enum: [...CORRECTION_TYPES] },
          explanation: { type: "string" },
        },
        required: ["original", "corrected", "type", "explanation"],
      },
    },
    total: { type: "number" },
    band: {
      type: "string",
      enum: ["Débutant", "Intermédiaire", "Avancé", "Courant"],
    },
    strengths: { type: "array", items: { type: "string" } },
    bookedNextStep: { type: "boolean" },
    verdict: { type: "string" },
  },
  required: ["corrections", "total", "band", "strengths", "bookedNextStep", "verdict"],
} as const;

export function buildJudgePrompt(args: {
  product: string;
  goal: string;
  transcript: string;
  locale?: "en" | "fr";
}): string {
  return `
Tu es un professeur de français bienveillant et précis. Tu analyses la transcription d'une conversation orale où une personne (le RÔLE "A") s'exerçait à parler français avec un interlocuteur (le RÔLE "P").

Contexte de la scène : ${args.product}
Objectif de la personne : ${args.goal}

Ta tâche : analyser UNIQUEMENT les répliques du rôle "A" (l'apprenant), pas celles de "P". Repère les fautes d'orthographe/de forme, de conjugaison, de grammaire (accords, genre, prépositions…), de vocabulaire et de syntaxe.

Consignes :
- "corrections" : une entrée par vraie faute. Pour chaque : "original" = la phrase fautive de l'apprenant, "corrected" = la version correcte, "type" = la catégorie, "explanation" = une explication courte, claire et gentille de la règle (en français).
- Attention : la transcription vient de la reconnaissance vocale, elle n'a pas de ponctuation ni de majuscules fiables. N'invente PAS de fautes d'orthographe ou de ponctuation dues à la transcription ; concentre-toi sur les vraies erreurs de français (conjugaison, accords, grammaire, vocabulaire, tournures).
- "total" : une note personnelle 0–100 de la qualité globale du français oral (fluidité, correction, richesse). Ce n'est pas un classement.
- "band" : Débutant / Intermédiaire / Avancé / Courant.
- "strengths" : 1 à 3 points positifs concrets (en français).
- "verdict" : 2–3 phrases d'encouragement + LE point principal à travailler ensuite.
- bookedNextStep : renvoie toujours false.
- Écris tout le texte libre en FRANÇAIS. Réponds UNIQUEMENT avec le JSON structuré demandé.

Transcription (A = apprenant, P = interlocuteur) :
${args.transcript}
`.trim();
}

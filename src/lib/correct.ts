import { z } from "zod";
import { CORRECTION_TYPES } from "./judge";

// Lightweight, low-latency check of a SINGLE spoken sentence, used for the
// "live" per-turn hint that appears while the conversation continues.

export const liveCorrectionSchema = z.object({
  /** true if the sentence is already correct French. */
  ok: z.boolean(),
  /** The corrected sentence (equal to the input when ok = true). */
  corrected: z.string(),
  /** Error category, when ok = false. */
  type: z.enum(CORRECTION_TYPES).nullable(),
  /** A very short French hint (a few words), when ok = false. */
  hint: z.string(),
});
export type LiveCorrection = z.infer<typeof liveCorrectionSchema>;

export const liveResponseJsonSchema = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    corrected: { type: "string" },
    type: { type: "string", enum: [...CORRECTION_TYPES], nullable: true },
    hint: { type: "string" },
  },
  required: ["ok", "corrected", "type", "hint"],
} as const;

export function buildLivePrompt(sentence: string): string {
  return `
Tu es un correcteur de français rapide. On te donne UNE phrase dite à l'oral par un apprenant (issue d'une reconnaissance vocale, donc sans ponctuation ni majuscules fiables).

Corrige uniquement les vraies fautes de français : conjugaison, accords, genre, grammaire, prépositions, vocabulaire, tournures. N'invente PAS de fautes d'orthographe ou de ponctuation liées à la transcription.

Réponds en JSON :
- "ok" : true si la phrase est correcte (ignore ponctuation/majuscules).
- "corrected" : la phrase corrigée (identique si ok = true).
- "type" : la catégorie de la faute principale, ou null si ok = true.
- "hint" : une explication TRÈS courte en français (quelques mots), ou "" si ok = true.

Phrase : «${sentence}»
`.trim();
}

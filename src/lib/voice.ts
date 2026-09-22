import type { Gender } from "./exercises/types";

// Gemini Live prebuilt voices, grouped by perceived gender so different
// prospects don't all sound the same.
const FEMALE_VOICES = ["Kore", "Aoede", "Leda", "Zephyr"];
const MALE_VOICES = ["Puck", "Charon", "Fenrir", "Orus"];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic voice per prospect (stable for a given seed), varied across prospects. */
export function pickVoice(gender: Gender | undefined, seed: string): string {
  const g: Gender = gender ?? (hash(seed) % 2 === 0 ? "male" : "female");
  const pool = g === "male" ? MALE_VOICES : FEMALE_VOICES;
  return pool[hash(seed) % pool.length];
}

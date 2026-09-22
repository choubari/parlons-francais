import "server-only";
import type { GoogleGenAI } from "@google/genai";

function statusOf(err: unknown): number | undefined {
  const e = err as { status?: number; error?: { code?: number } };
  return e?.status ?? e?.error?.code;
}

/** Retry on transient (5xx / 429) errors; a 4xx like 404 is permanent, so we
 *  stop retrying that model and let the caller fall back to the next one. */
function isTransient(err: unknown): boolean {
  const s = statusOf(err);
  return s === undefined || s === 429 || (s >= 500 && s <= 599);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Generate content across a list of models with per-model retries + backoff.
 * Falls back to the next model on a permanent error (e.g. 404 retired model)
 * or once a model's retries are exhausted. Returns the raw response text.
 */
export async function generateWithRetry(
  ai: GoogleGenAI,
  opts: {
    models: string[];
    contents: string;
    config: Record<string, unknown>;
    label: string;
    retriesPerModel?: number;
    baseDelayMs?: number;
  }
): Promise<string> {
  const { models, contents, config, label } = opts;
  const retries = opts.retriesPerModel ?? 3;
  const base = opts.baseDelayMs ?? 700;
  let lastErr: unknown;

  for (const model of models) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await ai.models.generateContent({ model, contents, config });
        if (res.text) return res.text;
        lastErr = new Error("empty response");
      } catch (e) {
        lastErr = e;
        console.error(`[${label}] ${model} attempt ${attempt}/${retries} failed`, e);
        if (!isTransient(e)) break; // permanent error → try the next model now
      }
      if (attempt < retries) await sleep(base * attempt); // linear backoff
    }
  }
  throw lastErr ?? new Error("generation failed");
}

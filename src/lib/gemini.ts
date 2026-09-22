import "server-only";
import type { GoogleGenAI } from "@google/genai";

export function statusOf(err: unknown): number | undefined {
  const e = err as { status?: number; error?: { code?: number } };
  return e?.status ?? e?.error?.code;
}

/** Only overload/unknown (5xx) errors are worth retrying the SAME model for.
 *  A 429 is a rate/quota limit (won't clear in-request) and a 4xx like 404 is
 *  permanent — both should fall through to the next model immediately. */
function worthRetryingSameModel(err: unknown): boolean {
  const s = statusOf(err);
  return s === undefined || (s >= 500 && s <= 599 && s !== 501);
}

/** Parse the RetryInfo.retryDelay (e.g. "33s") the API returns on a 429. */
function retryAfterMs(err: unknown): number | undefined {
  const details = (err as { error?: { details?: Array<Record<string, unknown>> } })?.error
    ?.details;
  if (!Array.isArray(details)) return undefined;
  for (const d of details) {
    const delay = (d as { retryDelay?: string }).retryDelay;
    if (typeof delay === "string") {
      const m = delay.match(/([\d.]+)s/);
      if (m) return Math.round(parseFloat(m[1]) * 1000);
    }
  }
  return undefined;
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
    /** For one-shot calls (end report): wait out a per-minute 429 once. */
    honorRetryAfter?: boolean;
    maxRetryAfterMs?: number;
  }
): Promise<string> {
  const { models, contents, config, label } = opts;
  const retries = opts.retriesPerModel ?? 3;
  const base = opts.baseDelayMs ?? 700;
  const maxWait = opts.maxRetryAfterMs ?? 25_000;
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
        // A per-minute 429 clears if we wait the suggested delay — do that once
        // for one-shot callers rather than giving up on the whole request.
        if (statusOf(e) === 429 && opts.honorRetryAfter && attempt < retries) {
          const wait = retryAfterMs(e);
          if (wait !== undefined && wait <= maxWait) {
            await sleep(wait + 300);
            continue;
          }
        }
        // 429 (quota/rate) and 4xx won't clear by retrying this model — move on.
        if (!worthRetryingSameModel(e)) break;
      }
      if (attempt < retries) await sleep(base * attempt); // linear backoff
    }
  }
  throw lastErr ?? new Error("generation failed");
}

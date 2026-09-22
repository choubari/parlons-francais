import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/* Minimal structural types for the Cloudflare bindings we use, so we don't
   need the full @cloudflare/workers-types package as a dependency. */
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<{ success: boolean }>;
  all<T = unknown>(): Promise<{ results: T[] }>;
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown>;
  exec(query: string): Promise<unknown>;
}
export interface R2Object {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
}
export interface R2Bucket {
  put(key: string, value: ArrayBuffer | ReadableStream | Uint8Array, opts?: unknown): Promise<unknown>;
  get(key: string): Promise<R2Object | null>;
  delete(key: string): Promise<void>;
}
export interface CloudflareEnv {
  DB?: D1Database;
  AVATARS?: R2Bucket;
  GEMINI_API_KEY?: string;
  GEMINI_LIVE_MODEL?: string;
  GEMINI_JUDGE_MODEL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  APP_URL?: string;
  ADMIN_EMAIL?: string;
  AUTH_SECRET?: string;
}

/** Cloudflare bindings + env, merged with process.env for `next dev`. */
export async function getEnv(): Promise<CloudflareEnv> {
  let cf: Partial<CloudflareEnv> = {};
  try {
    const ctx = await getCloudflareContext({ async: true });
    cf = (ctx?.env ?? {}) as Partial<CloudflareEnv>;
  } catch {
    /* not in a Cloudflare context (e.g. plain node) — fall back to process.env */
  }
  const pick = (k: keyof CloudflareEnv) =>
    (cf[k] as string | undefined) ?? (process.env[k as string] as string | undefined);

  return {
    DB: cf.DB,
    AVATARS: cf.AVATARS,
    GEMINI_API_KEY: pick("GEMINI_API_KEY"),
    GEMINI_LIVE_MODEL: pick("GEMINI_LIVE_MODEL"),
    GEMINI_JUDGE_MODEL: pick("GEMINI_JUDGE_MODEL"),
    RESEND_API_KEY: pick("RESEND_API_KEY"),
    RESEND_FROM: pick("RESEND_FROM"),
    APP_URL: pick("APP_URL"),
    ADMIN_EMAIL: pick("ADMIN_EMAIL"),
    AUTH_SECRET: pick("AUTH_SECRET"),
  };
}

export async function getDb(): Promise<D1Database> {
  const env = await getEnv();
  if (!env.DB) {
    throw new Error(
      "D1 binding 'DB' is missing. Run `wrangler d1 create` and set database_id in wrangler.toml, then `wrangler d1 migrations apply`."
    );
  }
  return env.DB;
}

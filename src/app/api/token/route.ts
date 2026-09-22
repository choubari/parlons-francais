import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";
import { getDb, getEnv } from "@/lib/db/client";
import { ensureSeeded } from "@/lib/db/seed";
import { getRunnable } from "@/lib/db/exercises";
import { getCurrentUser } from "@/lib/auth/user";
import {
  buildSystemInstruction,
  buildCustomSystemInstruction,
  type CustomScenario,
} from "@/lib/persona";
import { pickVoice } from "@/lib/voice";
import type { Exercise, Gender } from "@/lib/exercises/types";
import type { Locale } from "@/lib/i18n/messages";

// Very small per-IP limiter so a public deploy can't drain the free tier.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  const env = await getEnv();
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server not configured (missing GEMINI_API_KEY)." },
      { status: 500 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to start a call." }, { status: 401 });
  }

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many calls, slow down a moment." }, { status: 429 });
  }

  let body: { exerciseId?: string; custom?: CustomScenario; locale?: Locale };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // This app is French-only: the avatar always speaks French.
  const locale: Locale = "fr";

  // Build the prospect persona SERVER-SIDE. It is locked into the token and
  // never sent to the browser.
  let systemInstruction: string;
  let gender: Gender | undefined;
  let voiceSeed: string;

  if (body.custom) {
    systemInstruction = buildCustomSystemInstruction(body.custom, locale);
    gender = body.custom.gender;
    voiceSeed = (body.custom.prospectPersona ?? "custom").slice(0, 40);
  } else if (body.exerciseId) {
    const db = await getDb();
    await ensureSeeded(db);
    const row = await getRunnable(db, body.exerciseId, user.id);
    if (!row) {
      return NextResponse.json({ error: "Unknown exercise." }, { status: 404 });
    }
    const ex: Exercise = {
      id: row.id,
      theme: row.theme,
      difficulty: row.difficulty as Exercise["difficulty"],
      gender: row.gender as Gender,
      title: { en: row.title_en, fr: row.title_fr },
      product: { en: row.product_en, fr: row.product_fr },
      prospectProfile: { en: row.prospect_profile_en, fr: row.prospect_profile_fr },
      researchBrief: { en: row.research_brief_en, fr: row.research_brief_fr },
      goal: { en: row.goal_en, fr: row.goal_fr },
      prospectPersona: row.prospect_persona,
    };
    systemInstruction = buildSystemInstruction(ex, locale);
    gender = ex.gender;
    voiceSeed = ex.id;
  } else {
    return NextResponse.json(
      { error: "Provide exerciseId or custom scenario." },
      { status: 400 }
    );
  }

  // Live voice model. Availability varies by key — list yours with:
  //   curl "https://generativelanguage.googleapis.com/v1alpha/models?key=$KEY"
  // and pick one whose supportedGenerationMethods includes bidiGenerateContent.
  // The `*-flash-live-*` family streams audio reliably; native-audio models can
  // fall back to text/thoughts. Override with GEMINI_LIVE_MODEL.
  const liveModel = env.GEMINI_LIVE_MODEL || "gemini-3.1-flash-live-preview";
  const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });
  const voiceName = pickVoice(gender, voiceSeed);

  const now = Date.now();
  try {
    const token = await ai.authTokens.create({
      config: {
        // Must outlast the whole call (3 min) — the session is bound to this
        // token's expiry, so a short expireTime kills the call mid-way.
        expireTime: new Date(now + 30 * 60_000).toISOString(),
        newSessionExpireTime: new Date(now + 3 * 60_000).toISOString(),
        uses: 1,
        liveConnectConstraints: {
          model: liveModel,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName } },
              languageCode: locale === "fr" ? "fr-FR" : "en-US",
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            tools: [],
          },
        },
        httpOptions: { apiVersion: "v1alpha" },
      },
    });

    return NextResponse.json({ token: token.name, model: liveModel });
  } catch (err) {
    console.error("token mint failed", err);
    return NextResponse.json(
      { error: "Could not start a session right now." },
      { status: 502 }
    );
  }
}

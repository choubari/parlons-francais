import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getEnv } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/user";
import { buildLivePrompt, liveResponseJsonSchema, liveCorrectionSchema } from "@/lib/correct";

// Per-turn live correction of a single spoken sentence. Kept fast and cheap so
// it can run after each of the learner's turns without stalling the chat.
export async function POST(req: NextRequest) {
  const env = await getEnv();
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  let body: { sentence?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const sentence = (body.sentence ?? "").trim();
  if (!sentence) {
    return NextResponse.json({ error: "No sentence." }, { status: 400 });
  }
  if (sentence.length > 600) {
    return NextResponse.json({ error: "Sentence too long." }, { status: 400 });
  }

  const model = env.GEMINI_JUDGE_MODEL || "gemini-2.5-flash";
  const ai = new GoogleGenAI({ apiKey });

  try {
    const res = await ai.models.generateContent({
      model,
      contents: buildLivePrompt(sentence),
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: liveResponseJsonSchema,
        temperature: 0.2,
      },
    });
    const raw = res.text;
    if (!raw) throw new Error("empty response");
    const parsed = liveCorrectionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return NextResponse.json({ error: "Bad format." }, { status: 502 });
    }
    return NextResponse.json({ correction: parsed.data });
  } catch (err) {
    console.error("[correct] failed", err);
    return NextResponse.json({ error: "Correction failed." }, { status: 502 });
  }
}

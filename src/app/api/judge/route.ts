import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getEnv, getDb } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/user";
import { saveScore } from "@/lib/db/scores";
import { buildJudgePrompt, responseJsonSchema, scoreCardSchema } from "@/lib/judge";

type Turn = { role: "caller" | "prospect"; text: string };

export async function POST(req: NextRequest) {
  const env = await getEnv();
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server not configured (missing GEMINI_API_KEY)." },
      { status: 500 }
    );
  }

  let body: {
    transcript?: Turn[];
    exerciseId?: string;
    exerciseTitle?: string;
    theme?: string;
    product?: string;
    goal?: string;
    locale?: "en" | "fr";
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const locale: "en" | "fr" = body.locale === "fr" ? "fr" : "en";
  const turns = body.transcript ?? [];
  if (turns.length === 0) {
    return NextResponse.json({ error: "No transcript to score." }, { status: 400 });
  }

  const product = body.product ?? "une conversation du quotidien";
  const goal = body.goal ?? "avoir une conversation fluide";
  const transcriptText = turns
    .map((t) => `${t.role === "prospect" ? "P" : "A"}: ${t.text}`)
    .join("\n");

  const judgeModel = env.GEMINI_JUDGE_MODEL || "gemini-flash-latest";
  const ai = new GoogleGenAI({ apiKey });

  try {
    let raw: string | undefined;
    let lastErr: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model: judgeModel,
          contents: buildJudgePrompt({ product, goal, transcript: transcriptText, locale }),
          config: { responseMimeType: "application/json", responseJsonSchema, temperature: 0.4 },
        });
        raw = res.text;
        if (raw) break;
        lastErr = new Error("empty judge response");
      } catch (e) {
        lastErr = e;
        console.error(`[judge] Gemini attempt ${attempt} failed`, e);
      }
      if (attempt < 3) await new Promise((r) => setTimeout(r, 500 * attempt));
    }
    if (!raw) throw lastErr ?? new Error("empty judge response");
    const parsed = scoreCardSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.error("judge schema mismatch", parsed.error);
      return NextResponse.json(
        { error: "Judge returned an unexpected format." },
        { status: 502 }
      );
    }

    // Persist the score for the signed-in user (drives progress + leaderboard).
    let scoreId: string | null = null;
    const user = await getCurrentUser();
    if (user) {
      try {
        const db = await getDb();
        scoreId = await saveScore(db, user.id, {
          exerciseId: body.exerciseId ?? null,
          exerciseTitle: body.exerciseTitle?.slice(0, 200) || "Practice call",
          theme: body.theme ?? null,
          scoreCard: parsed.data,
        });
      } catch (e) {
        console.error("[judge] could not save score", e);
      }
    }

    return NextResponse.json({ scoreCard: parsed.data, scoreId });
  } catch (err) {
    console.error("judge failed", err);
    return NextResponse.json(
      { error: "Could not score the call right now." },
      { status: 502 }
    );
  }
}

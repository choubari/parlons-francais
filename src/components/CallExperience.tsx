"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LiveCall, TranscriptTurn } from "@/lib/live-client";
import { setResult, type ChosenScenario } from "@/lib/session";
import { Card, Kicker, Button, DifficultyBadge, PersonaAvatar } from "@/components/ui";
import { useI18n, getStoredLocale } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { splitProfile } from "@/lib/ui/avatar";
import type { LiveCorrection } from "@/lib/correct";

const CALL_SECONDS = 300;
type Phase = "briefing" | "connecting" | "live" | "error";

function withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ]);
}

export function CallExperience({ scenario }: { scenario: ChosenScenario }) {
  const router = useRouter();
  const { t, L } = useI18n();
  const { user, loading } = useAuth();
  const [phase, setPhase] = useState<Phase>("briefing");
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(CALL_SECONDS);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  // Live per-turn corrections, keyed by the transcript index of a "caller" turn.
  const [corrections, setCorrections] = useState<Record<number, LiveCorrection>>({});
  const checkedRef = useRef<Set<number>>(new Set());
  const callRef = useRef<LiveCall | null>(null);
  const endedRef = useRef(false);
  const liveRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Keep the transcript pinned to the latest line as it streams in.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [transcript, corrections]);

  const endCall = useCallback(() => {
    if (endedRef.current) return; // guard: stop() triggers onClose → endCall again
    endedRef.current = true;
    const call = callRef.current;
    const turns = call?.getTranscript() ?? [];
    call?.stop();
    setResult({ scenario, transcript: turns });
    router.push("/result");
  }, [router, scenario]);

  useEffect(() => {
    if (phase !== "live") return;
    if (secondsLeft <= 0) {
      endCall();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, secondsLeft, endCall]);

  useEffect(() => () => callRef.current?.stop(), []);

  // As soon as one of the learner's turns is finalized (a later turn exists),
  // send it for a quick correction and surface an inline hint. The immersive
  // conversation itself never corrects — this is the "live" layer on top.
  useEffect(() => {
    if (phase !== "live") return;
    transcript.forEach((turn, i) => {
      if (turn.role !== "caller") return;
      if (checkedRef.current.has(i)) return;
      const finalized = i < transcript.length - 1; // a reply came after it
      if (!finalized) return;
      checkedRef.current.add(i);
      const words = turn.text.trim().split(/\s+/).filter(Boolean);
      if (words.length < 3) return; // too short to correct meaningfully
      fetch("/api/correct", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sentence: turn.text }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.correction && !d.correction.ok) {
            setCorrections((prev) => ({ ...prev, [i]: d.correction }));
          }
        })
        .catch(() => {
          /* best-effort; the end-of-session report is the source of truth */
        });
    });
  }, [transcript, phase]);

  async function start() {
    setPhase("connecting");
    try {
      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          exerciseId: scenario.exerciseId,
          custom: scenario.custom,
          locale: getStoredLocale(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de démarrer.");

      const { LiveCall } = await import("@/lib/live-client");
      const call = new LiveCall({
        onTranscript: setTranscript,
        onProspectSpeaking: setSpeaking,
        onError: (m) => {
          setError(m);
          setPhase("error");
        },
        // Socket dropped (token/session expiry, network). If the user didn't
        // hang up, end the call and score what we have.
        onClose: () => {
          if (liveRef.current && !endedRef.current) endCall();
        },
      });
      callRef.current = call;
      await withTimeout(
        call.start(data.token, data.model),
        20_000,
        "Connexion trop longue. Vérifiez l'autorisation du micro et la clé API, puis réessayez."
      );
      liveRef.current = true;
      setPhase("live");
    } catch (e) {
      console.error("[call] start failed:", e);
      callRef.current?.stop();
      setError(e instanceof Error ? e.message : "Impossible de démarrer la conversation.");
      setPhase("error");
    }
  }

  function toggleMute() {
    const m = !muted;
    setMuted(m);
    callRef.current?.setMuted(m);
  }

  const { name: personaName, role: personaRole } = splitProfile(L(scenario.prospectProfile));
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const low = secondsLeft <= 30;

  // Calls require an account (scores are attributed to the user).
  if (!loading && !user) {
    return (
      <Card className="mt-6 flex flex-col items-start gap-3 p-8">
        <p className="text-[15px] text-ink-soft">{t.auth.signInRequired}</p>
        <Link href="/login">
          <Button>{t.nav.signIn}</Button>
        </Link>
      </Card>
    );
  }

  return (
    <>
      {phase === "briefing" && (
        <div className="mx-auto w-full max-w-[720px]">
          <button
            onClick={() => router.push("/")}
            className="mb-4 text-[14px] font-semibold text-muted hover:text-ink"
          >
            ← {t.nav.back}
          </button>
          <Card className="p-8">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-[family-name:var(--font-display)] text-[26px] font-bold leading-[1.25]">
                {L(scenario.title)}
              </h1>
              <DifficultyBadge level={scenario.difficulty} />
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-[14px] bg-cream p-3.5">
              <PersonaAvatar name={personaName} size={46} difficulty={scenario.difficulty} />
              <div>
                <div className="text-[15.5px] font-bold">{personaName}</div>
                {personaRole && <div className="text-[13px] text-muted">{personaRole}</div>}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-5">
              <BriefBlock label={t.call.selling} value={L(scenario.product)} />
              {L(scenario.researchBrief) && (
                <BriefBlock label={t.call.brief} value={L(scenario.researchBrief)} soft />
              )}
              <BriefBlock label={t.call.goal} value={L(scenario.goal)} />
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3.5 border-t border-line-soft pt-6">
              <Button size="lg" onClick={start}>
                📞 {t.call.start}
              </Button>
              <span className="text-[13px] text-muted">{t.call.minutesNote}</span>
            </div>
          </Card>
        </div>
      )}

      {phase === "connecting" && (
        <div className="mt-16 text-center text-muted">{t.call.connecting}</div>
      )}

      {phase === "error" && (
        <Card className="mt-6 flex flex-col gap-3 p-6">
          <p className="text-danger">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => setPhase("briefing")}>
            {t.nav.back}
          </Button>
        </Card>
      )}

      {phase === "live" && (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* LEFT — context (sticky on wide screens) */}
          <aside className="flex flex-col gap-4 self-start lg:sticky lg:top-24">
            <Card style={{ padding: 20 }}>
              <div className="mb-5 flex flex-col gap-4">
                <div>
                  <Kicker className="mb-1 text-muted">{t.call.whoCalling}</Kicker>
                  <div className="text-[14px] leading-[1.5]">{L(scenario.prospectProfile)}</div>
                </div>
                <div>
                  <Kicker className="mb-1 text-muted">{t.call.selling}</Kicker>
                  <div className="text-[14px] leading-[1.5] text-ink-soft">{L(scenario.product)}</div>
                </div>
                {L(scenario.researchBrief) && (
                  <div>
                    <Kicker className="mb-1 text-muted">{t.call.brief}</Kicker>
                    <div className="text-[14px] leading-[1.5] text-ink-soft">
                      {L(scenario.researchBrief)}
                    </div>
                  </div>
                )}
                <div>
                  <Kicker className="mb-1 text-muted">{t.call.goal}</Kicker>
                  <div className="text-[14px] leading-[1.5]">{L(scenario.goal)}</div>
                </div>
              </div>
            </Card>
          </aside>

          {/* RIGHT — avatar status + big scrolling transcript */}
          <div className="flex min-h-[70vh] flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`relative ${speaking ? "speaking" : ""}`}>
                  <PersonaAvatar name={personaName} size={64} difficulty={scenario.difficulty} />
                </div>
                <div>
                  <div className="font-[family-name:var(--font-display)] text-[18px] font-bold leading-tight">
                    {personaName}
                  </div>
                  {personaRole && <div className="text-[12.5px] text-muted">{personaRole}</div>}
                  <div className="mt-1 flex items-center gap-2 text-[13px] font-medium text-muted">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${speaking ? "bg-flame" : "bg-moss"}`}
                      style={speaking ? { animation: "pulse-dot 1.2s infinite" } : undefined}
                    />
                    {speaking ? t.call.isSpeaking : t.call.yourTurn}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`font-[family-name:var(--font-display)] text-[30px] font-bold tabular-nums ${
                    low ? "text-danger" : "text-ink"
                  }`}
                >
                  {mm}:{ss}
                </span>
                <Button variant="secondary" pill size="sm" onClick={toggleMute} aria-label="mute">
                  {muted ? `🔇` : `🎙️`}
                </Button>
                <Button variant="danger" pill size="sm" onClick={endCall}>
                  {t.call.hangUp}
                </Button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex flex-1 flex-col gap-5 overflow-y-auto rounded-[var(--radius-card)] border border-line bg-paper"
              style={{ padding: 26, maxHeight: "66vh" }}
            >
              {transcript.length === 0 && (
                <p className="text-[16px] text-muted">{t.call.transcriptPlaceholder}</p>
              )}
              {transcript.map((turn, i) => (
                <div key={i}>
                  <div
                    className="mb-1 text-[12px] font-bold uppercase tracking-[0.06em]"
                    style={{ color: turn.role === "prospect" ? "var(--color-grape)" : "var(--color-muted)" }}
                  >
                    {turn.role === "prospect" ? personaName : t.call.you}
                  </div>
                  {turn.role === "caller" && corrections[i] ? (
                    // Recap style: struck-through original in red, corrected in
                    // green. The rule/type is saved for the end-of-session report.
                    <div>
                      <p className="text-[18px] leading-[1.5] text-danger line-through decoration-danger/40">
                        {turn.text}
                      </p>
                      <p className="mt-1 text-[19px] font-bold leading-[1.5] text-moss">
                        → {corrections[i].corrected}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[19px] leading-[1.5] text-ink">{turn.text}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BriefBlock({ label, value, soft = false }: { label: string; value: string; soft?: boolean }) {
  return (
    <div>
      <Kicker className="mb-1.5">{label}</Kicker>
      <div className={`text-[15.5px] leading-[1.6] ${soft ? "text-ink-soft" : ""}`}>{value}</div>
    </div>
  );
}

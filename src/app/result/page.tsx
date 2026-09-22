"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getResult } from "@/lib/session";
import type { ScoreCard } from "@/lib/judge";
import { Card, Button } from "@/components/ui";
import { ScoreCardView } from "@/components/ScoreCardView";
import { useI18n, getStoredLocale } from "@/lib/i18n/context";

type State = "scoring" | "done" | "error";

// Fresh scoring flow: score the just-finished call, persist it, then jump to the
// stable /result/[id] URL so a reload keeps the result.
export default function ResultPage() {
  const router = useRouter();
  const { t, L } = useI18n();
  const [state, setState] = useState<State>("scoring");
  const [card, setCard] = useState<ScoreCard | null>(null);
  const [error, setError] = useState("");
  const [retryHref, setRetryHref] = useState("/");

  const score = useCallback(async () => {
    const result = getResult();
    if (!result) {
      router.replace("/");
      return;
    }
    setRetryHref(result.scenario.exerciseId ? `/exercise/${result.scenario.exerciseId}` : "/private");
    setState("scoring");
    setError("");
    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          transcript: result.transcript,
          exerciseId: result.scenario.exerciseId,
          exerciseTitle: L(result.scenario.title),
          theme: result.scenario.theme,
          // Context for the corrector — send the French strings.
          product: result.scenario.product.fr,
          goal: result.scenario.goal.fr,
          locale: getStoredLocale(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.result.failed);
      if (data.scoreId) {
        // Persisted — go to the reload-safe, shareable URL.
        router.replace(`/result/${data.scoreId}`);
        return;
      }
      setCard(data.scoreCard as ScoreCard);
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.result.failed);
      setState("error");
    }
  }, [router, t, L]);

  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void score();
  }, [score]);

  const shareLink =
    typeof window !== "undefined" ? window.location.origin : "https://parlons.choubari.com";

  return (
    <main className="animate-rise mx-auto w-full max-w-[760px] flex-1 px-5 pb-20 pt-10 sm:px-10">
      {state === "scoring" && (
        <div className="mt-20 flex flex-col items-center gap-3 text-center text-muted">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-line border-t-grape" />
          {t.result.scoring}
        </div>
      )}
      {state === "error" && (
        <Card className="mt-6 flex flex-col gap-4 p-6">
          <p className="text-danger">{error}</p>
          <div className="flex gap-3">
            <Button size="sm" onClick={() => void score()}>
              {t.result.tryAgain}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.replace("/")}>
              {t.nav.back}
            </Button>
          </div>
        </Card>
      )}
      {state === "done" && card && (
        <ScoreCardView card={card} retryHref={retryHref} shareLink={shareLink} />
      )}
    </main>
  );
}

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
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
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const result = getResult();
    if (!result) {
      router.replace("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRetryHref(result.scenario.exerciseId ? `/exercise/${result.scenario.exerciseId}` : "/private");

    (async () => {
      try {
        const res = await fetch("/api/judge", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            transcript: result.transcript,
            exerciseId: result.scenario.exerciseId,
            exerciseTitle: L(result.scenario.title),
            theme: result.scenario.theme,
            product: result.scenario.product.en,
            goal: result.scenario.goal.en,
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
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const shareLink = typeof window !== "undefined" ? window.location.origin : "https://french.choubari.com";

  return (
    <main className="animate-rise mx-auto w-full max-w-[760px] flex-1 px-5 pb-20 pt-10 sm:px-10">
      {state === "scoring" && <div className="mt-20 text-center text-muted">{t.result.scoring}</div>}
      {state === "error" && (
        <Card className="mt-6 flex flex-col gap-3 p-6">
          <p className="text-danger">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => router.replace("/")}>
            {t.nav.back}
          </Button>
        </Card>
      )}
      {state === "done" && card && (
        <ScoreCardView card={card} retryHref={retryHref} shareLink={shareLink} />
      )}
    </main>
  );
}

"use client";

export const dynamic = "force-dynamic";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { ScoreCard } from "@/lib/judge";
import { Card, Button } from "@/components/ui";
import { ScoreCardView } from "@/components/ScoreCardView";
import { useI18n } from "@/lib/i18n/context";

type Score = {
  id: string;
  exerciseId: string | null;
  exerciseTitle: string;
  scoreCard: ScoreCard;
};

export default function SavedResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useI18n();
  const [score, setScore] = useState<Score | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "notfound">("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/scores/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const { score } = await res.json();
        if (alive) {
          setScore(score);
          setState("ready");
        }
      } catch {
        if (alive) setState("notfound");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const shareLink = typeof window !== "undefined" ? window.location.href : "https://parlons.choubari.com";
  const retryHref = score?.exerciseId ? `/exercise/${score.exerciseId}` : "/private";

  return (
    <main className="animate-rise mx-auto w-full max-w-[1000px] flex-1 px-5 pb-20 pt-10 sm:px-10">
      {state === "loading" && <div className="mt-20 text-center text-muted">…</div>}
      {state === "notfound" && (
        <Card className="mt-6 flex flex-col items-start gap-3 p-8">
          <p className="text-ink-soft">{t.result.failed}</p>
          <Link href="/progress">
            <Button variant="secondary" size="sm">
              {t.nav.progress}
            </Button>
          </Link>
        </Card>
      )}
      {state === "ready" && score && (
        <>
          <h1 className="mb-4 font-[family-name:var(--font-display)] text-[22px] font-bold">
            {score.exerciseTitle}
          </h1>
          <ScoreCardView card={score.scoreCard} retryHref={retryHref} shareLink={shareLink} />
        </>
      )}
    </main>
  );
}

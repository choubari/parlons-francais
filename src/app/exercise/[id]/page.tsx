"use client";

export const dynamic = "force-dynamic";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { ChosenScenario } from "@/lib/session";
import type { ExerciseCardDTO } from "@/lib/db/exercises";
import { CallExperience } from "@/components/CallExperience";
import { Card, Button } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";

export default function ExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useI18n();
  const [scenario, setScenario] = useState<ChosenScenario | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "notfound">("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/exercises/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const { card } = (await res.json()) as { card: ExerciseCardDTO };
        if (!alive) return;
        setScenario({
          exerciseId: card.id,
          title: card.title,
          theme: card.theme,
          product: card.product,
          prospectProfile: card.prospectProfile,
          goal: card.goal,
          researchBrief: card.researchBrief,
          difficulty: card.difficulty,
        });
        setState("ready");
      } catch {
        if (alive) setState("notfound");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <main className="animate-rise mx-auto w-full max-w-[1080px] flex-1 px-5 pb-16 pt-10 sm:px-10">
      {state === "loading" && <div className="mt-16 text-center text-muted">…</div>}
      {state === "notfound" && (
        <Card className="mt-6 flex flex-col items-start gap-3 p-8">
          <p className="text-ink-soft">{t.league.empty}</p>
          <Link href="/">
            <Button variant="secondary" size="sm">
              {t.nav.back}
            </Button>
          </Link>
        </Card>
      )}
      {state === "ready" && scenario && <CallExperience scenario={scenario} />}
    </main>
  );
}

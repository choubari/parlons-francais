"use client";

import Link from "next/link";
import type { ScoreCard, Correction } from "@/lib/judge";
import { Card, Button, Kicker, ProgressBar } from "@/components/ui";

const TYPE_LABEL: Record<Correction["type"], string> = {
  orthographe: "Orthographe",
  conjugaison: "Conjugaison",
  grammaire: "Grammaire",
  vocabulaire: "Vocabulaire",
  syntaxe: "Syntaxe",
};

export function ScoreCardView({
  card,
  retryHref,
}: {
  card: ScoreCard;
  retryHref: string;
  /** kept for call-site compatibility; sessions are private, no share. */
  shareLink?: string;
}) {
  const corrections = card.corrections ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT — level, teacher's note, strengths */}
        <div className="flex flex-col gap-5">
          <Card className="flex flex-wrap items-center gap-6 p-7">
            <div className="font-[family-name:var(--font-display)] text-[52px] font-bold leading-none">
              {Math.round(card.total)}
              <span className="text-[19px] font-semibold text-muted">/100</span>
            </div>
            <div className="min-w-[160px] flex-1">
              <Kicker className="mb-1">Niveau estimé</Kicker>
              <div className="mb-2 font-[family-name:var(--font-display)] text-[22px] font-bold text-grape">
                {card.band}
              </div>
              <ProgressBar value={card.total} height={8} />
            </div>
          </Card>

          <Card className="p-6">
            <Kicker className="mb-2">Le mot du prof</Kicker>
            <p className="text-[15px] leading-[1.65] text-ink-soft">{card.verdict}</p>
          </Card>

          {card.strengths?.length > 0 && (
            <Card className="p-6">
              <Kicker className="mb-3">Points forts</Kicker>
              <ul className="flex flex-col gap-2">
                {card.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14.5px] text-ink-soft">
                    <span className="mt-0.5 text-moss">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* RIGHT — corrections */}
        <div className="flex flex-col">
          <div className="mb-3 flex items-baseline justify-between">
            <Kicker>Corrections</Kicker>
            {corrections.length > 0 && (
              <span className="text-[13px] font-semibold text-muted">
                {corrections.length} correction{corrections.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {corrections.length === 0 ? (
            <Card className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
              <span className="text-[34px]">🎉</span>
              <p className="text-[16px] font-bold">Aucune faute repérée</p>
              <p className="text-[14px] text-muted">
                Bravo ! Votre français était impeccable sur cette session.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3.5">
              {corrections.map((c, i) => (
                <Card key={i} className="p-5">
                  <span className="mb-2 inline-flex items-center rounded-full bg-grape-soft px-3 py-1 text-[11.5px] font-bold text-grape">
                    {TYPE_LABEL[c.type] ?? c.type}
                  </span>
                  <div className="mb-1 text-[15px]">
                    <span className="text-danger line-through decoration-danger/40">{c.original}</span>
                  </div>
                  <div className="mb-2 text-[15px] font-semibold text-moss">→ {c.corrected}</div>
                  <p className="text-[13.5px] leading-[1.55] text-muted">{c.explanation}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3.5">
        <Link href={retryHref}>
          <Button>Recommencer</Button>
        </Link>
        <Link href="/">
          <Button variant="secondary">Toutes les situations</Button>
        </Link>
      </div>
    </div>
  );
}

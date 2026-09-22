"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, PersonaAvatar, ProgressBar } from "@/components/ui";
import { UserAvatar } from "@/components/UserAvatar";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { splitProfile } from "@/lib/ui/avatar";
import type { ProgressStats } from "@/lib/ui/stats";

type Entry = { id: string; exerciseTitle: string; total: number; band: string; at: number };

export default function ProgressPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/progress", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setEntries(data.entries ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user]);

  if (!authLoading && !user) {
    return (
      <main className="animate-rise mx-auto w-full max-w-[560px] flex-1 px-5 py-16">
        <Card className="flex flex-col items-start gap-3 p-8">
          <p className="text-[15px] text-ink-soft">{t.auth.signInRequired}</p>
          <Link href="/login">
            <Button>{t.nav.signIn}</Button>
          </Link>
        </Card>
      </main>
    );
  }

  if (loading || !stats) {
    return <main className="flex-1 px-5 py-16 text-center text-muted">…</main>;
  }

  return (
    <main className="animate-rise mx-auto w-full max-w-[960px] flex-1 px-5 pb-20 pt-10 sm:px-10">
      <div className="mb-7 flex items-center gap-4">
        <UserAvatar name={user?.name ?? "You"} avatarKey={user?.avatarKey} size={64} />
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-[26px] font-bold">
            {user?.name ?? t.progress.title}
          </h1>
          <p className="text-[13.5px] text-muted">{t.progress.since(stats.totalCalls)}</p>
        </div>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Stat value={stats.totalCalls} label={t.progress.callsCompleted} />
        <Stat value={stats.avgScore} label={t.progress.avgScore} />
        <Stat value={stats.bestScore} label={t.progress.bestScore} accent />
        <Stat value={stats.streak} label={t.progress.dayStreak} dark />
      </div>

      <Card className="mb-6 p-6">
        <h2 className="mb-1 font-[family-name:var(--font-display)] text-[16px] font-bold">
          {t.progress.skillTrends}
        </h2>
        {stats.totalCalls === 0 ? (
          <p className="text-[14px] text-muted">{t.progress.noSkills}</p>
        ) : (
          <>
            <p className="mb-4 text-[12.5px] text-muted">{t.progress.skillTrendsHint}</p>
            <div className="flex flex-col gap-3.5">
              {stats.skills.map((sk) => (
                <div key={sk.key}>
                  <div className="mb-1.5 flex justify-between text-[14px]">
                    <span className="font-semibold">
                      {t.criteria[sk.key as keyof typeof t.criteria] ?? sk.key}
                    </span>
                    <span className="font-bold tabular-nums">{sk.score}</span>
                  </div>
                  <ProgressBar value={sk.score} />
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card className="mb-6 p-6">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-[16px] font-bold">
          {t.progress.badges}
        </h2>
        {stats.badges.length === 0 ? (
          <p className="text-[14px] text-muted">{t.progress.noBadges}</p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {stats.badges.map((b) => (
              <span key={b} className="rounded-full bg-grape-soft px-4 py-2 text-[13px] font-bold text-grape">
                🏅 {b}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-[16px] font-bold">
          {t.progress.callHistory}
        </h2>
        {entries.length === 0 ? (
          <p className="text-[14px] text-muted">
            {t.progress.empty}{" "}
            <Link href="/" className="font-semibold text-grape hover:underline">
              {t.progress.firstOne}
            </Link>
          </p>
        ) : (
          <div className="flex flex-col">
            {entries.map((e) => {
              const { name } = splitProfile(e.exerciseTitle);
              return (
                <Link
                  key={e.id}
                  href={`/result/${e.id}`}
                  className="-mx-2 flex items-center gap-3.5 rounded-[12px] border-b border-line-soft px-2 py-3 transition last:border-0 hover:bg-sand"
                >
                  <PersonaAvatar name={name} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold">{e.exerciseTitle}</div>
                    <div className="text-[12px] text-muted">
                      {new Date(e.at).toLocaleDateString()} · {t.bands[e.band as keyof typeof t.bands] ?? e.band}
                    </div>
                  </div>
                  <div className="font-[family-name:var(--font-display)] text-[16px] font-bold tabular-nums">
                    {e.total}
                  </div>
                  <span className="text-muted">›</span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </main>
  );
}

function Stat({ value, label, dark = false, accent = false }: { value: number; label: string; dark?: boolean; accent?: boolean }) {
  return (
    <div className={`rounded-[16px] border p-5 ${dark ? "border-espresso bg-espresso" : "border-line bg-paper"}`}>
      <div
        className="font-[family-name:var(--font-display)] text-[28px] font-bold tabular-nums"
        style={{ color: dark ? "#FF9C82" : accent ? "var(--color-grape)" : "var(--color-ink)" }}
      >
        {value}
      </div>
      <div className={`mt-1 text-[12.5px] ${dark ? "text-[#C9C0B4]" : "text-muted"}`}>{label}</div>
    </div>
  );
}

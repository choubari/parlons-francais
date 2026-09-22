"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExerciseCardDTO } from "@/lib/db/exercises";
import type { ThemeMeta } from "@/lib/exercises/themes";
import { Card, DifficultyBadge, PersonaAvatar, Chip, Tag } from "@/components/ui";
import { ShareDialog } from "@/components/ShareDialog";
import { useI18n } from "@/lib/i18n/context";
import { splitProfile } from "@/lib/ui/avatar";

export default function HomeClient() {
  const router = useRouter();
  const { t, L } = useI18n();
  const [cards, setCards] = useState<ExerciseCardDTO[]>([]);
  const [themes, setThemes] = useState<ThemeMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [share, setShare] = useState<{ title: string; id: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/exercises", { cache: "no-store" });
        const data = await res.json();
        setCards(data.cards ?? []);
        setThemes(data.themes ?? []);
      } catch {
        /* leave empty */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      if (theme !== "all" && c.theme !== theme) return false;
      if (!q) return true;
      const hay = [L(c.title), L(c.prospectProfile), c.creator, t.themes[c.theme] ?? c.theme]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [cards, theme, query, L, t.themes]);

  function open(id: string) {
    router.push(`/exercise/${id}`);
  }
  function shuffle() {
    if (filtered.length === 0) return;
    open(filtered[Math.floor(Math.random() * filtered.length)].id);
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://french.choubari.com";

  return (
    <main className="animate-rise mx-auto w-full max-w-[1280px] flex-1 px-5 pb-20 pt-10 sm:px-10 sm:pt-12">
      <div className="mb-9 flex flex-wrap items-start justify-between gap-10">
        <div className="max-w-[640px]">
          <h1 className="font-[family-name:var(--font-display)] text-[38px] font-bold leading-[1.08] sm:text-[44px]">
            {t.league.heroTitle}
          </h1>
          <p className="mt-3.5 text-[16.5px] leading-[1.6] text-muted">{t.league.heroSubtitle}</p>
        </div>
        <div className="relative hidden h-[140px] w-[200px] flex-none sm:block">
          <div className="absolute right-5 top-0 h-[120px] w-[120px] rounded-full bg-flame-soft" />
          <div className="absolute bottom-0 right-[70px] h-[70px] w-[70px] rotate-[18deg] rounded-[20px] bg-grape" />
          <div className="absolute bottom-2.5 right-0 h-[46px] w-[46px] rounded-full bg-lime" />
        </div>
      </div>

      <div className="mb-5 flex gap-2.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.league.search}
          className="w-full max-w-[420px] rounded-[12px] border border-line bg-paper py-3 text-[14.5px]"
          style={{ paddingLeft: 18, paddingRight: 18 }}
        />
        <button
          onClick={shuffle}
          className="flex items-center gap-2 whitespace-nowrap rounded-[12px] bg-espresso px-5 py-3 text-[14.5px] font-bold text-white transition hover:bg-espresso-2"
        >
          {t.league.shuffle} <span>→</span>
        </button>
      </div>

      <div className="mb-7 flex flex-wrap items-center gap-2.5">
        <Chip active={theme === "all"} onClick={() => setTheme("all")}>
          {t.league.all}
        </Chip>
        {themes.map((th) => (
          <Chip key={th.id} active={theme === th.id} onClick={() => setTheme(th.id)}>
            {th.emoji} {t.themes[th.id] ?? th.label}
          </Chip>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted">…</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted">{t.league.empty}</Card>
      ) : (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]" style={{ gap: 18 }}>
          {filtered.map((c) => {
            const { name } = splitProfile(L(c.prospectProfile));
            return (
              <Card key={c.id} className="flex flex-col gap-3.5" style={{ padding: 22 }}>
                <button onClick={() => open(c.id)} className="flex items-start justify-between gap-2.5 text-left">
                  <h3 className="font-[family-name:var(--font-display)] text-[18px] font-bold leading-[1.3]">
                    {L(c.title)}
                  </h3>
                  <DifficultyBadge level={c.difficulty} />
                </button>

                <button onClick={() => open(c.id)} className="flex items-center gap-2.5 text-left">
                  <PersonaAvatar name={name} difficulty={c.difficulty} />
                  <span className="text-[14px] font-medium text-muted">
                    {name} · {t.themes[c.theme] ?? c.theme}
                  </span>
                </button>

                <div className="mt-auto flex items-center justify-between border-t border-line-soft pt-3">
                  <span className="flex items-center gap-1.5 text-[12px] text-muted">
                    {t.league.by} <span className="font-semibold text-ink-soft">{c.creator}</span>
                    {c.ownedByMe && c.visibility === "private" && <Tag tone="grape">{t.league.privateTag}</Tag>}
                  </span>
                  <button
                    onClick={() => setShare({ title: L(c.title), id: c.id })}
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-sand text-grape transition hover:brightness-95"
                    aria-label={t.result.share}
                  >
                    ↗
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ShareDialog
        open={!!share}
        onClose={() => setShare(null)}
        title={share?.title}
        link={share ? `${origin}/exercise/${share.id}` : origin}
      />
    </main>
  );
}

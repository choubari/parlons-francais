"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setScenario, type ChosenScenario } from "@/lib/session";
import type { ExerciseCardDTO } from "@/lib/db/exercises";
import { Card, Kicker, Button, PersonaAvatar, DifficultyBadge } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { hue, initials, splitProfile } from "@/lib/ui/avatar";

const PERSONAS = [
  {
    name: "Camille Laurent",
    role: { en: "warm, patient interlocutor", fr: "interlocutrice chaleureuse et patiente" },
    trait: { en: "Friendly and encouraging; gives you time and rephrases gently.", fr: "Aimable et encourageante ; vous laisse le temps et reformule gentiment." },
    gender: "female" as const,
  },
  {
    name: "Thomas Bernard",
    role: { en: "direct, busy professional", fr: "professionnel direct et pressé" },
    trait: { en: "Polite but to the point; asks for precise answers.", fr: "Poli mais direct ; demande des réponses précises." },
    gender: "male" as const,
  },
  {
    name: "Nathalie Petit",
    role: { en: "by-the-book official", fr: "agente procédurière" },
    trait: { en: "Formal and procedural; uses administrative vocabulary.", fr: "Formelle et procédurière ; emploie un vocabulaire administratif." },
    gender: "female" as const,
  },
  {
    name: "Karim Haddad",
    role: { en: "friendly local shopkeeper", fr: "commerçant de quartier sympathique" },
    trait: { en: "Chatty and easy-going; makes small talk.", fr: "Bavard et détendu ; fait volontiers la conversation." },
    gender: "male" as const,
  },
  {
    name: "Sophie Moreau",
    role: { en: "calm, attentive professional", fr: "professionnelle calme et à l'écoute" },
    trait: { en: "Reassuring and methodical; asks clear questions.", fr: "Rassurante et méthodique ; pose des questions claires." },
    gender: "female" as const,
  },
  {
    name: "Julien Girard",
    role: { en: "strict but fair manager", fr: "responsable exigeant mais juste" },
    trait: { en: "Demanding; pushes for concrete examples.", fr: "Exigeant ; réclame des exemples concrets." },
    gender: "male" as const,
  },
];

type Tab = "description" | "script";
const DIFFS = ["easy", "medium", "hard"] as const;

export default function PrivatePage() {
  const router = useRouter();
  const { t, L } = useI18n();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [tab, setTab] = useState<Tab>("description");
  const [description, setDescription] = useState("");
  const [script, setScript] = useState("");
  const [who, setWho] = useState("");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [goal, setGoal] = useState("");
  const [title, setTitle] = useState("");
  const [seed, setSeed] = useState(0);
  const [mine, setMine] = useState<ExerciseCardDTO[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const persona = PERSONAS[seed % PERSONAS.length];

  const loadMine = useCallback(async () => {
    try {
      const res = await fetch("/api/exercises", { cache: "no-store" });
      const data = await res.json();
      setMine((data.cards as ExerciseCardDTO[]).filter((c) => c.ownedByMe && !c.isBuiltin));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) void loadMine();
  }, [user, loadMine]);

  const material = useMemo(() => {
    if (tab === "script") return script.trim();
    return description.trim();
  }, [tab, description, script]);

  // Needs a described situation; the partner always gets a name/face from the pool.
  const hasContext = material.length > 0;

  function build() {
    const productText = material || "une conversation en français";
    // The optional Script tab carries prepared lines as extra scene context.
    const briefText =
      tab === "script" && script.trim() ? `Notes / phrases préparées :\n${script.trim()}` : "";
    const both = (s: string) => ({ en: s, fr: s });
    // The partner is always a named persona from the pool; the optional notes
    // refine their character rather than replacing their identity.
    const character = who.trim()
      ? `${persona.trait.fr} Précisions sur l'interlocuteur : ${who.trim()}`
      : persona.trait.fr;
    const profile = {
      en: `${persona.name} — ${persona.role.en}`,
      fr: `${persona.name} — ${persona.role.fr}`,
    };

    const scenario: ChosenScenario = {
      custom: {
        product: productText,
        prospectPersona: character,
        researchBrief: briefText,
        goal: goal.trim(),
        difficulty,
        gender: persona.gender,
      },
      theme: "custom",
      difficulty,
      title: both(title.trim() || t.private.title),
      product: both(productText),
      prospectProfile: profile,
      goal: both(goal.trim() || t.private.goalPlaceholder),
      researchBrief: both(briefText),
    };
    const payload = {
      theme: "custom",
      difficulty,
      gender: persona.gender,
      title: scenario.title,
      product: scenario.product,
      prospectProfile: scenario.prospectProfile,
      researchBrief: scenario.researchBrief,
      goal: scenario.goal,
      prospectPersona: character,
      visibility: "private" as const,
    };
    return { scenario, payload };
  }

  function startNow() {
    if (!hasContext) return;
    setScenario(build().scenario);
    router.push("/call");
  }

  async function save() {
    if (!hasContext || savingRef.current) return; // ref guard blocks double-click
    savingRef.current = true;
    setSaving(true);
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(build().payload),
      });
      if (res.ok) {
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1800);
        await loadMine();
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function removeMine(id: string) {
    if (!window.confirm(t.private.confirmDelete)) return;
    const res = await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    if (res.ok) await loadMine();
  }

  const inputCls = "w-full rounded-[12px] border border-line bg-paper px-4 py-3 text-[14.5px]";

  const prospectCard = (editable: boolean) => (
    <div className="rounded-[20px] bg-espresso p-6 text-white">
      <div className="mb-4 font-[family-name:var(--font-display)] text-[13px] font-bold uppercase tracking-[0.08em] text-flame-soft">
        {t.private.cast}
      </div>
      <div className="flex items-center gap-3 rounded-[12px] bg-white/5 p-3">
        <PersonaAvatar name={persona.name} size={44} difficulty={difficulty} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold">{persona.name}</div>
          <div className="truncate text-[12px] text-[#C9C0B4]">{L(persona.role)}</div>
        </div>
        <DifficultyBadge level={difficulty} size="sm" />
      </div>
      {editable && (
        <button
          onClick={() => setSeed((s) => s + 1)}
          className="mt-3 w-full rounded-[12px] bg-espresso-2 px-5 py-2.5 text-[13.5px] font-semibold"
        >
          ↻ {t.private.changeProspect}
        </button>
      )}
    </div>
  );

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

  return (
    <main className="animate-rise mx-auto w-full max-w-[820px] flex-1 px-5 pb-20 pt-10 sm:px-10">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-[32px] font-bold">
        {t.private.title}
      </h1>
      <p className="mb-7 text-[15.5px] text-muted">{t.private.subtitle}</p>

      {/* Stepper (clickable) */}
      <div className="mb-6 flex items-center gap-3">
        {t.private.steps.map((label, i) => {
          const n = i + 1;
          const reachable = n === 1 || hasContext;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="flex flex-1 items-center gap-3">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && setStep(n)}
                className={`flex items-center gap-2.5 ${reachable ? "" : "opacity-40"}`}
              >
                <span
                  className={`flex h-7 w-7 flex-none items-center justify-center rounded-full font-[family-name:var(--font-display)] text-[13px] font-bold ${
                    active || done ? "bg-espresso text-white" : "border border-line bg-paper text-muted"
                  }`}
                >
                  {done ? "✓" : n}
                </span>
                <span className={`hidden whitespace-nowrap text-[14px] font-bold sm:inline ${active ? "" : "text-muted"}`}>
                  {label}
                </span>
              </button>
              {i < t.private.steps.length - 1 && <span className="h-0.5 flex-1 bg-line" />}
            </div>
          );
        })}
      </div>

      {/* Step 1 — Material */}
      {step === 1 && (
        <Card className="p-6">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-[16px] font-bold">
            {t.private.whatSelling}
          </h2>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {(["description", "script"] as Tab[]).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-[10px] px-4 py-2 text-[13.5px] font-semibold transition ${
                  tab === key ? "bg-espresso text-white" : "bg-sand text-ink-soft"
                }`}
              >
                {t.private.tabs[key]}
              </button>
            ))}
          </div>
          {tab === "description" && (
            <textarea
              className={`${inputCls} min-h-[140px] resize-y`}
              placeholder={t.private.descPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
          {tab === "script" && (
            <textarea
              className={`${inputCls} min-h-[140px] resize-y`}
              placeholder={t.private.scriptPlaceholder}
              value={script}
              onChange={(e) => setScript(e.target.value)}
            />
          )}
        </Card>
      )}

      {/* Step 2 — Session plan + prospect */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <Card className="p-6">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-[16px] font-bold">
              {t.private.sessionPlan}
            </h2>
            <Kicker className="mb-1.5 text-muted">{t.private.difficulty}</Kicker>
            <div className="mb-4 flex gap-2">
              {DIFFS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`rounded-full border px-4 py-2 text-[13px] font-semibold capitalize transition ${
                    difficulty === d ? "border-espresso bg-espresso text-white" : "border-line bg-paper text-ink-soft"
                  }`}
                >
                  {t.difficulty[d]}
                </button>
              ))}
            </div>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Kicker className="mb-1.5 text-muted">{t.private.title2}</Kicker>
                <input className={inputCls} placeholder={t.private.titlePlaceholder} value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Kicker className="mb-1.5 text-muted">{t.private.goal}</Kicker>
                <input className={inputCls} placeholder={t.private.goalPlaceholder} value={goal} onChange={(e) => setGoal(e.target.value)} />
              </div>
            </div>
            <Kicker className="mb-1.5 text-muted">{t.private.whoCalling}</Kicker>
            <textarea
              className={`${inputCls} min-h-[72px] resize-y`}
              placeholder={t.private.whoCallingPlaceholder}
              value={who}
              onChange={(e) => setWho(e.target.value)}
            />
          </Card>
          {prospectCard(true)}
        </div>
      )}

      {/* Step 3 — Review & go */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          {prospectCard(false)}
          <Card className="p-6">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-[16px] font-bold">
              {t.private.review}
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <Kicker className="mb-1 text-muted">{t.private.whatSelling}</Kicker>
                <div className="text-[14.5px]">{material || "—"}</div>
              </div>
              <div>
                <Kicker className="mb-1 text-muted">{t.private.goal}</Kicker>
                <div className="text-[14.5px]">{goal.trim() || t.private.goalPlaceholder}</div>
              </div>
              <div>
                <Kicker className="mb-1 text-muted">{t.private.difficulty}</Kicker>
                <div className="text-[14.5px] capitalize">{t.difficulty[difficulty as "easy" | "medium" | "hard"]}</div>
              </div>
            </div>
            <p className="mt-5 text-[13px] text-muted">{t.private.reviewHint}</p>
          </Card>
        </div>
      )}

      {/* Wizard nav */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {step > 1 ? (
          <Button variant="secondary" onClick={() => setStep(step - 1)}>
            ← {t.private.back}
          </Button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)} disabled={step === 1 && !hasContext}>
            {step === 1 ? t.private.next : t.private.review} →
          </Button>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={save} disabled={saving}>
              {justSaved ? t.private.saved : t.private.saveLocal}
            </Button>
            <Button onClick={startNow} disabled={!hasContext}>
              📞 {t.private.startSession}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-10" />

      <Card className="p-6">
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-[18px] font-bold">
          {t.private.yourExercises}
        </h2>
        {mine.length === 0 ? (
          <p className="text-[14px] text-muted">{t.private.noExercises}</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {mine.map((e) => {
              const name = splitProfile(L(e.prospectProfile)).name;
              return (
                <div key={e.id} className="flex flex-wrap items-center gap-3.5 rounded-[14px] border border-line p-3.5">
                  <span
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[12px] font-bold text-white"
                    style={{ background: hue(name) }}
                  >
                    {initials(name)}
                  </span>
                  <span className="min-w-[160px] flex-1 text-[14.5px] font-bold">{L(e.title)}</span>
                  <DifficultyBadge level={e.difficulty} size="sm" />
                  <Link href={`/exercise/${e.id}`}>
                    <Button size="sm">📞 {t.private.startSession}</Button>
                  </Link>
                  <button
                    onClick={() => removeMine(e.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-sand text-muted hover:text-danger"
                    aria-label="delete"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </main>
  );
}

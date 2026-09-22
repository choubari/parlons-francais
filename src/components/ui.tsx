"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useI18n } from "@/lib/i18n/context";
import { LOCALES } from "@/lib/i18n/messages";
import { initials, hue, DIFF_TONE } from "@/lib/ui/avatar";

/* ── Card ─────────────────────────────────────────────────────────────── */

export function Card({
  children,
  className = "",
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={`rounded-[var(--radius-card)] border border-line bg-paper ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ── Kicker (small uppercase label) ───────────────────────────────────── */

export function Kicker({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`text-[11.5px] font-bold tracking-[0.06em] uppercase text-flame ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Button ───────────────────────────────────────────────────────────── */

type Variant = "primary" | "dark" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-flame text-white hover:brightness-105",
  dark: "bg-espresso text-white hover:bg-espresso-2",
  secondary: "bg-paper text-ink-soft border border-line hover:bg-sand",
  danger: "bg-danger text-white hover:brightness-105",
  ghost: "text-ink-soft hover:bg-sand",
};
const SIZE: Record<Size, string> = {
  sm: "px-4 py-2 text-[13.5px]",
  md: "px-5 py-2.5 text-[14.5px]",
  lg: "px-7 py-3.5 text-[15.5px]",
};

export function Button({
  variant = "primary",
  size = "md",
  pill = false,
  className = "",
  children,
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  pill?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${
        pill ? "rounded-full" : "rounded-[12px]"
      } ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ── Tag (hashtag pill) ───────────────────────────────────────────────── */

export function Tag({
  children,
  tone = "neutral",
  className = "",
  ...rest
}: {
  children: ReactNode;
  tone?: "neutral" | "grape";
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const tones = {
    neutral: "bg-sand text-muted",
    grape: "bg-grape-soft text-grape",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}

/* ── DifficultyBadge ──────────────────────────────────────────────────── */

export function DifficultyBadge({
  level,
  size = "md",
}: {
  level: string;
  size?: "sm" | "md";
}) {
  const { t } = useI18n();
  const tone = DIFF_TONE[level] ?? DIFF_TONE.medium;
  const label = t.difficulty[level as "easy" | "medium" | "hard"] ?? level;
  return (
    <span
      className={`inline-flex flex-none items-center rounded-full font-bold capitalize ${
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-[12px]"
      }`}
      style={{ background: tone.bg, color: tone.text }}
    >
      {label}
    </span>
  );
}

/* ── PersonaAvatar ────────────────────────────────────────────────────── */

export function PersonaAvatar({
  name,
  size = 32,
  difficulty,
  className = "",
}: {
  name: string;
  size?: number;
  difficulty?: string;
  className?: string;
}) {
  const ring = difficulty ? (DIFF_TONE[difficulty] ?? DIFF_TONE.medium).text : undefined;
  return (
    <div
      className={`flex flex-none items-center justify-center rounded-full font-bold text-white font-[family-name:var(--font-display)] ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: hue(name),
        border: ring ? `${Math.max(2, Math.round(size / 18))}px solid ${ring}` : undefined,
      }}
    >
      {initials(name)}
    </div>
  );
}

/* ── ProgressBar ──────────────────────────────────────────────────────── */

export function ProgressBar({
  value,
  className = "",
  height = 6,
  color = "var(--color-grape)",
}: {
  value: number;
  className?: string;
  height?: number;
  color?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`overflow-hidden rounded-full bg-line-soft ${className}`}
      style={{ height }}
    >
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/* ── Chip (toggle / filter) ───────────────────────────────────────────── */

export function Chip({
  active = false,
  onClick,
  children,
  size = "md",
  tone = "dark",
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  size?: "sm" | "md";
  tone?: "dark" | "grape";
}) {
  const activeCls =
    tone === "grape"
      ? "bg-grape-soft text-grape border-grape"
      : "bg-espresso text-white border-espresso";
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border font-semibold transition ${
        size === "sm" ? "px-3.5 py-1.5 text-[12.5px]" : "px-4.5 py-2.5 text-[14px]"
      } ${
        active
          ? activeCls
          : "border-line bg-paper text-ink-soft hover:border-muted"
      }`}
      style={size === "md" ? { paddingLeft: 18, paddingRight: 18 } : undefined}
    >
      {children}
    </button>
  );
}

/* ── Dialog ───────────────────────────────────────────────────────────── */

export function Dialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(36,28,20,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-[420px] max-w-[90vw] rounded-[20px] bg-paper p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ── LanguageToggle ───────────────────────────────────────────────────── */

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="flex items-center overflow-hidden rounded-[10px] border border-line bg-paper text-[13px] font-semibold">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-2.5 py-1.5 transition ${
            locale === l ? "bg-espresso text-white" : "text-muted hover:text-ink"
          }`}
        >
          {t.locale[l]}
        </button>
      ))}
    </div>
  );
}

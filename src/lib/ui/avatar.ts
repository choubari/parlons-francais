// Deterministic persona visuals shared across the league, brief, call and
// progress views — mirrors the palette from the Closer design.

const HUES = [
  "#6C4CFF", // grape
  "#FF8A5C", // coral
  "#3FAE73", // moss
  "#4C8CFF", // blue
  "#D45CBE", // magenta
  "#E1A93F", // amber
  "#4CB8C4", // teal
];

/** Two-letter initials from a display name, e.g. "Priya Nair" → "PN". */
export function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??"
  );
}

/** Stable colour for a name so the same persona always gets the same hue. */
export function hue(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return HUES[h % HUES.length];
}

export type DiffTone = { bg: string; text: string };

/** Difficulty pill colours (soft fill + strong text). */
export const DIFF_TONE: Record<string, DiffTone> = {
  easy: { bg: "var(--color-moss-soft)", text: "var(--color-moss)" },
  medium: { bg: "var(--color-honey-soft)", text: "var(--color-honey)" },
  hard: { bg: "var(--color-rose-soft)", text: "var(--color-danger)" },
};

/** Split a "Name — Role, Company" profile into its display parts. */
export function splitProfile(profile: string): { name: string; role: string } {
  const [name, ...rest] = profile.split(" — ");
  return { name: name?.trim() || profile, role: rest.join(" — ").trim() };
}

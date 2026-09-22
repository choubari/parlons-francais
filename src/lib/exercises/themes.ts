// Life-situation categories. Each situation belongs to one category.
// (Kept as `THEMES` so the existing DB/DTO plumbing stays untouched.)

export const THEMES = {
  entretien: { id: "entretien", label: "Entretien d'embauche", emoji: "💼" },
  travail: { id: "travail", label: "Au travail", emoji: "🏢" },
  sante: { id: "sante", label: "Santé & médecin", emoji: "🩺" },
  prefecture: { id: "prefecture", label: "Démarches & préfecture", emoji: "🏛️" },
  quotidien: { id: "quotidien", label: "Vie quotidienne", emoji: "🛒" },
} as const;

export type ThemeId = keyof typeof THEMES;

export type ThemeMeta = { id: string; label: string; emoji: string };

export const PUBLIC_THEME_LIST: ThemeMeta[] = Object.values(THEMES);

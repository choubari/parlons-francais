export type Difficulty = "easy" | "medium" | "hard";

export type Gender = "male" | "female";

/** A string available in every supported UI language. */
export type Localized = { en: string; fr: string };

/**
 * A life-situation the learner practises. The AI avatar plays the interlocutor
 * (recruteur, médecin, agent de préfecture, collègue…) and the whole
 * conversation happens in French. Field names are kept from the original
 * project so the DB/DTO plumbing is unchanged; meanings are repurposed below.
 */
export type Exercise = {
  id: string;
  /** Category id (entretien | travail | sante | prefecture | quotidien). */
  theme: string;
  /** Suggested level: easy = débutant, medium = intermédiaire, hard = avancé. */
  difficulty: Difficulty;
  /** Avatar voice gender — drives the Gemini Live voice. */
  gender: Gender;
  /** Situation title. */
  title: Localized;
  /** One-line summary of the setting / what the conversation is about. */
  product: Localized;
  /** Who the avatar is (name + role you'll be talking to). */
  prospectProfile: Localized;
  /** Scene briefing shown to the learner before starting. */
  researchBrief: Localized;
  /** Your objective in the conversation (e.g. "obtenir un rendez-vous"). */
  goal: Localized;
  /** Hidden acting brief for the AI interlocutor. Server-only. */
  prospectPersona: string;
};

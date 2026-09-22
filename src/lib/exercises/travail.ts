import type { Exercise } from "./types";

// ── Au travail ──────────────────────────────────────────────────────────────
const travail: Exercise[] = [
  {
    id: "travail-conge",
    theme: "travail",
    difficulty: "easy",
    gender: "male",
    title: {
      fr: "Demander des congés à son manager",
      en: "Asking your manager for time off",
    },
    product: {
      fr: "une conversation avec votre manager pour poser des jours de congé",
      en: "a chat with your manager to request days off",
    },
    prospectProfile: {
      fr: "Thomas — votre manager, détendu mais organisé.",
      en: "Thomas — your manager, easy-going but organised.",
    },
    researchBrief: {
      fr: "Vous voulez poser une semaine de congés le mois prochain. Expliquez les dates, proposez comment gérer votre travail pendant votre absence et répondez à ses questions.",
      en: "You want a week off next month. Give the dates, suggest how your work will be covered and answer his questions.",
    },
    goal: {
      fr: "obtenir l'accord pour vos dates de congé",
      en: "get your requested dates approved",
    },
    prospectPersona:
      "Tu es Thomas, le manager de la personne. Tu es détendu et bienveillant mais tu penses à l'organisation de l'équipe. Tu demandes les dates exactes, qui va gérer les dossiers en cours, et s'il y a un livrable important pendant cette période. Tu finis par accepter si la personne a un plan raisonnable. Reste dans le rôle, ne corrige pas la langue. Réponses courtes et naturelles.",
  },
  {
    id: "travail-desaccord",
    theme: "travail",
    difficulty: "medium",
    gender: "female",
    title: {
      fr: "Exprimer un désaccord en réunion",
      en: "Expressing disagreement in a meeting",
    },
    product: {
      fr: "une réunion où vous devez défendre poliment une idée différente",
      en: "a meeting where you must politely defend a different idea",
    },
    prospectProfile: {
      fr: "Nathalie — une collègue à forte personnalité qui défend son plan.",
      en: "Nathalie — a strong-willed colleague defending her own plan.",
    },
    researchBrief: {
      fr: "Nathalie propose une solution avec laquelle vous n'êtes pas d'accord. Exprimez votre point de vue avec diplomatie, avec des arguments, sans vexer votre collègue.",
      en: "Nathalie proposes a solution you disagree with. State your view diplomatically, with arguments, without offending her.",
    },
    goal: {
      fr: "faire valoir votre point de vue tout en restant courtois",
      en: "make your point while staying courteous",
    },
    prospectPersona:
      "Tu es Nathalie, une collègue avec du caractère qui défend son propre plan en réunion. Au début tu n'es pas convaincue et tu défends ta position, mais tu es raisonnable : si la personne argumente calmement et avec des faits, tu commences à écouter et à faire des concessions. Tu réagis mal à un ton agressif. Reste dans le rôle, ne corrige pas la langue. Réponses brèves et réalistes.",
  },
];

export default travail;

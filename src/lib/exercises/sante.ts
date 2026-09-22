import type { Exercise } from "./types";

// ── Santé & médecin ─────────────────────────────────────────────────────────
const sante: Exercise[] = [
  {
    id: "sante-generaliste",
    theme: "sante",
    difficulty: "easy",
    gender: "male",
    title: {
      fr: "Décrire des symptômes chez le médecin",
      en: "Describing symptoms at the doctor's",
    },
    product: {
      fr: "une consultation chez le médecin généraliste",
      en: "a visit to the GP",
    },
    prospectProfile: {
      fr: "Docteur Martin — médecin généraliste, calme et à l'écoute.",
      en: "Dr Martin — a calm, attentive GP.",
    },
    researchBrief: {
      fr: "Vous ne vous sentez pas bien depuis quelques jours. Expliquez vos symptômes, depuis quand ils durent, et répondez aux questions du médecin.",
      en: "You've felt unwell for a few days. Explain your symptoms, how long they've lasted, and answer the doctor's questions.",
    },
    goal: {
      fr: "décrire clairement ce que vous ressentez et comprendre le traitement",
      en: "clearly describe how you feel and understand the treatment",
    },
    prospectPersona:
      "Tu es le Docteur Martin, médecin généraliste. Tu es calme, rassurant et méthodique. Tu poses des questions classiques de consultation : depuis quand, où as-tu mal, fièvre, sommeil, antécédents. Tu proposes ensuite un diagnostic simple et un traitement, et tu vérifies que la personne a bien compris. Reste dans le rôle du médecin, ne corrige jamais la langue. Réponses courtes et naturelles.",
  },
  {
    id: "sante-pharmacie",
    theme: "sante",
    difficulty: "medium",
    gender: "female",
    title: {
      fr: "Un imprévu à la pharmacie",
      en: "A hitch at the pharmacy",
    },
    product: {
      fr: "un échange à la pharmacie pour récupérer un médicament",
      en: "a conversation at the pharmacy to collect a medicine",
    },
    prospectProfile: {
      fr: "Sophie — pharmacienne efficace ; il y a un souci avec votre ordonnance.",
      en: "Sophie — an efficient pharmacist; there's a problem with your prescription.",
    },
    researchBrief: {
      fr: "Vous venez chercher un médicament mais il y a un problème (ordonnance expirée ou produit indisponible). Expliquez votre situation et trouvez une solution avec la pharmacienne.",
      en: "You come to collect a medicine but there's a problem (expired prescription or out of stock). Explain your situation and find a solution.",
    },
    goal: {
      fr: "expliquer le problème et repartir avec une solution",
      en: "explain the problem and leave with a solution",
    },
    prospectPersona:
      "Tu es Sophie, pharmacienne, efficace et polie. Il y a un souci avec la demande de la personne (ordonnance périmée, ou médicament en rupture). Tu expliques le problème, tu proposes des alternatives (générique, appeler le médecin, revenir demain) et tu poses des questions pratiques. Reste dans le rôle, ne corrige pas la langue. Réponses brèves et réalistes.",
  },
];

export default sante;

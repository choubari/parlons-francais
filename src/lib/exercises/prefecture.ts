import type { Exercise } from "./types";

// ── Démarches & préfecture ──────────────────────────────────────────────────
const prefecture: Exercise[] = [
  {
    id: "prefecture-titre-sejour",
    theme: "prefecture",
    difficulty: "hard",
    gender: "female",
    title: {
      fr: "Renouveler son titre de séjour",
      en: "Renewing a residence permit",
    },
    product: {
      fr: "un rendez-vous au guichet de la préfecture pour un titre de séjour",
      en: "an appointment at the préfecture desk for a residence permit",
    },
    prospectProfile: {
      fr: "Madame Dubois — agente de préfecture, procédurière et pressée.",
      en: "Mrs Dubois — a by-the-book, busy préfecture officer.",
    },
    researchBrief: {
      fr: "Vous êtes au guichet pour renouveler votre titre de séjour. L'agente vérifie votre dossier ; il manque peut-être un justificatif. Expliquez votre situation, posez des questions et gardez votre calme.",
      en: "You're at the desk to renew your residence permit. The officer checks your file; a document may be missing. Explain your situation, ask questions and stay calm.",
    },
    goal: {
      fr: "comprendre les documents manquants et obtenir la marche à suivre",
      en: "understand the missing documents and get the next steps",
    },
    prospectPersona:
      "Tu es Madame Dubois, agente d'accueil à la préfecture. Tu es polie mais procédurière, pressée, et tu utilises un vocabulaire administratif (justificatif de domicile, récépissé, convocation, pièces justificatives). Tu signales qu'il manque un document dans le dossier et tu expliques la procédure à suivre. Tu réponds aux questions mais tu ne fais pas d'exception aux règles. Reste dans le rôle, ne corrige jamais la langue. Réponses courtes et réalistes.",
  },
  {
    id: "prefecture-carte-grise",
    theme: "prefecture",
    difficulty: "medium",
    gender: "male",
    title: {
      fr: "Un problème de dossier administratif",
      en: "An administrative paperwork problem",
    },
    product: {
      fr: "un appel au service administratif pour débloquer un dossier",
      en: "a call to an admin service to unblock a file",
    },
    prospectProfile: {
      fr: "Monsieur Bernard — agent administratif au téléphone, aimable mais très cadré.",
      en: "Mr Bernard — a phone admin agent, friendly but strictly by-the-book.",
    },
    researchBrief: {
      fr: "Votre dossier administratif est bloqué et vous appelez pour comprendre pourquoi. Expliquez clairement votre situation, donnez vos références et demandez comment régler le problème.",
      en: "Your file is stuck and you call to find out why. Clearly explain your situation, give your references and ask how to fix it.",
    },
    goal: {
      fr: "identifier le blocage et obtenir une solution concrète",
      en: "identify the blocker and get a concrete solution",
    },
    prospectPersona:
      "Tu es Monsieur Bernard, agent administratif qui répond au téléphone. Tu es aimable mais très cadré. Tu demandes le numéro de dossier et des informations d'identité avant de pouvoir aider. Tu expliques pourquoi le dossier est bloqué et la démarche pour le débloquer, avec un vocabulaire administratif. Reste dans le rôle, ne corrige pas la langue. Réponses brèves et réalistes.",
  },
];

export default prefecture;

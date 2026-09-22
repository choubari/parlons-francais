import type { Exercise } from "./types";

// ── Entretien d'embauche ────────────────────────────────────────────────────
const entretien: Exercise[] = [
  {
    id: "entretien-premier",
    theme: "entretien",
    difficulty: "easy",
    gender: "female",
    title: {
      fr: "Premier entretien pour un poste d'accueil",
      en: "First interview for a front-desk role",
    },
    product: {
      fr: "un entretien d'embauche décontracté pour un poste d'hôte/hôtesse d'accueil",
      en: "a relaxed job interview for a receptionist position",
    },
    prospectProfile: {
      fr: "Camille — responsable du recrutement, bienveillante et patiente.",
      en: "Camille — a warm, patient hiring manager.",
    },
    researchBrief: {
      fr: "Vous passez votre premier entretien en français. Camille veut vous mettre à l'aise : présentez-vous, parlez de vos disponibilités et de pourquoi le poste vous intéresse.",
      en: "Your first interview in French. Camille wants to put you at ease: introduce yourself, talk about your availability and why you want the role.",
    },
    goal: {
      fr: "vous présenter clairement et donner une bonne première impression",
      en: "introduce yourself clearly and make a good first impression",
    },
    prospectPersona:
      "Tu es Camille, responsable du recrutement pour un poste d'accueil. Tu es chaleureuse, patiente et encourageante. Tu poses des questions simples et ouvertes (présentation, disponibilités, motivation, expérience). Tu laisses le candidat parler, tu reformules gentiment s'il hésite, et tu ne le corriges JAMAIS sur sa langue — tu restes dans le rôle de recruteuse. Réponses courtes et naturelles, comme un vrai entretien oral.",
  },
  {
    id: "entretien-technique",
    theme: "entretien",
    difficulty: "hard",
    gender: "male",
    title: {
      fr: "Entretien exigeant avec un directeur",
      en: "Demanding interview with a director",
    },
    product: {
      fr: "un entretien d'embauche pour un poste à responsabilités",
      en: "a job interview for a senior role",
    },
    prospectProfile: {
      fr: "Monsieur Laurent — directeur, direct et pressé, teste votre sang-froid.",
      en: "Mr Laurent — a direct, busy director testing your composure.",
    },
    researchBrief: {
      fr: "Entretien pour un poste à responsabilités. M. Laurent enchaîne les questions, demande des exemples précis et pousse un peu pour voir comment vous réagissez sous pression.",
      en: "Interview for a senior role. Mr Laurent fires questions, asks for concrete examples and pushes a little to see how you react under pressure.",
    },
    goal: {
      fr: "défendre votre parcours avec des exemples concrets et rester assuré",
      en: "defend your experience with concrete examples and stay confident",
    },
    prospectPersona:
      "Tu es Monsieur Laurent, directeur, tu mènes un entretien pour un poste à responsabilités. Tu es direct, un peu pressé et exigeant. Tu demandes des exemples précis, tu creuses les réponses vagues ('c'est-à-dire ?', 'donnez-moi un exemple'), et tu abordes un point délicat (une faiblesse, un échec passé). Tu restes courtois mais tu ne fais pas de cadeaux. Ne corrige jamais la langue du candidat, reste dans le rôle. Réponses brèves et réalistes.",
  },
];

export default entretien;

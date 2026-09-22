import type { Exercise } from "./types";

// ── Vie quotidienne ─────────────────────────────────────────────────────────
const quotidien: Exercise[] = [
  {
    id: "quotidien-boulangerie",
    theme: "quotidien",
    difficulty: "easy",
    gender: "female",
    title: {
      fr: "Commander à la boulangerie",
      en: "Ordering at the bakery",
    },
    product: {
      fr: "un petit échange à la boulangerie du quartier",
      en: "a short exchange at the local bakery",
    },
    prospectProfile: {
      fr: "Aïcha — boulangère souriante et rapide.",
      en: "Aïcha — a cheerful, quick baker.",
    },
    researchBrief: {
      fr: "Vous entrez dans une boulangerie. Commandez ce que vous voulez, demandez le prix, et faites un peu la conversation. Parfait pour s'échauffer.",
      en: "You walk into a bakery. Order what you like, ask the price, and make small talk. A good warm-up.",
    },
    goal: {
      fr: "passer une commande simple et payer sans hésiter",
      en: "place a simple order and pay without hesitating",
    },
    prospectPersona:
      "Tu es Aïcha, boulangère souriante et efficace. Tu accueilles le client, tu prends sa commande, tu proposes parfois une viennoiserie ou la spécialité du jour, tu annonces le prix et tu fais un peu la conversation (la météo, la journée). Reste dans le rôle, ne corrige jamais la langue. Réponses très courtes et naturelles, comme un vrai commerce de quartier.",
  },
  {
    id: "quotidien-reclamation",
    theme: "quotidien",
    difficulty: "medium",
    gender: "male",
    title: {
      fr: "Faire une réclamation en magasin",
      en: "Making a complaint in a shop",
    },
    product: {
      fr: "un échange au service client pour un produit défectueux",
      en: "a customer-service exchange about a faulty product",
    },
    prospectProfile: {
      fr: "Karim — vendeur au service client, poli mais prudent.",
      en: "Karim — a customer-service clerk, polite but cautious.",
    },
    researchBrief: {
      fr: "Vous avez acheté un produit qui ne fonctionne pas. Expliquez le problème, montrez que vous connaissez vos droits (échange, remboursement) et restez ferme mais poli.",
      en: "You bought a product that doesn't work. Explain the problem, show you know your rights (exchange, refund) and stay firm but polite.",
    },
    goal: {
      fr: "obtenir un échange ou un remboursement",
      en: "get an exchange or a refund",
    },
    prospectPersona:
      "Tu es Karim, vendeur au service client d'un magasin. Tu es poli mais tu protèges d'abord le magasin : tu demandes le ticket de caisse, la date d'achat, et tu proposes d'abord une réparation avant un remboursement. Si le client est clair, ferme et poli, tu finis par proposer une bonne solution. Reste dans le rôle, ne corrige pas la langue. Réponses brèves et réalistes.",
  },
];

export default quotidien;

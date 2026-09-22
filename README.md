# Parlons — Entraînement au français oral

Parlez **à voix haute** avec un avatar en français dans des situations de la vie réelle
(entretien d'embauche, au travail, chez le médecin, à la préfecture, vie quotidienne).
Votre parole est transcrite en temps réel et **corrigée** : orthographe, grammaire,
conjugaison et vocabulaire. Entraînement **privé** — pas d'arène, pas de classement.

- **Voix en temps réel** via l'**API Gemini Live** (audio natif) — l'avatar parle et vous
  répond en français, avec transcription live de vous et de lui.
- **Correction en direct** après chaque prise de parole, **+ un rapport complet** en fin de
  session (fautes trouvées, points forts, niveau estimé, conseil principal) via Gemini Flash.
- **Situations prêtes à l'emploi** classées par catégorie, **+ vos propres situations**
  décrites à la volée.
- **Comptes par lien magique** (sans mot de passe, e-mail via **Resend**).
- **Cloudflare D1** pour les comptes, situations et l'historique de sessions ; **R2**
  (optionnel) pour les avatars.
- **Thème drapeau français** (bleu #0055A4 / blanc / rouge #EF4135) mappé sur des tokens
  Tailwind v4, composants réutilisables (`Button`, `Card`, `PersonaAvatar`, …).
- **Next.js (App Router)** déployé sur **Cloudflare** via OpenNext.

## Développement local

```bash
npm install
cp .env.example .env.local   # renseignez GEMINI_API_KEY, RESEND_API_KEY, ADMIN_EMAIL…
npm run db:migrate           # applique le schéma sur la base D1 locale
npm run dev                  # http://localhost:3000
```

Sans `RESEND_API_KEY`, le lien magique de connexion est affiché dans la console serveur.

## Déploiement sur Cloudflare

```bash
# 1. Créez les ressources (une fois)
npx wrangler d1 create french-trainer          # collez database_id dans wrangler.toml
npx wrangler r2 bucket create french-avatars

# 2. Secrets
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put AUTH_SECRET

# 3. Schéma + déploiement
npm run db:migrate:remote
npm run deploy                                  # → french.choubari.com
```

## Variables d'environnement

| Variable            | Rôle                                                        |
| ------------------- | ----------------------------------------------------------- |
| `GEMINI_API_KEY`    | Clé Google AI Studio (avatar live + correction). Serveur.   |
| `GEMINI_LIVE_MODEL` | (optionnel) modèle voix live                                |
| `GEMINI_JUDGE_MODEL`| (optionnel) modèle de correction                            |
| `RESEND_API_KEY`    | Envoi des e-mails de connexion                              |
| `RESEND_FROM`       | Expéditeur vérifié                                          |
| `APP_URL`           | Origine publique (callbacks des liens magiques)             |
| `ADMIN_EMAIL`       | Compte admin, propriétaire des situations intégrées         |
| `AUTH_SECRET`       | Chaîne aléatoire 32+ caractères (réservé)                   |

Forké depuis le projet « Closer » (cold-call-trainer) et adapté à l'apprentissage du
français oral.

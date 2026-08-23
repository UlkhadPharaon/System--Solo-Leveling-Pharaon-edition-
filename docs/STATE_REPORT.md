# STATE REPORT — État réel du projet (reconnaissance, prompt 1/2)

> **Date** : 2026-08-23 · **Méthode** : audit statique (code + docs) + exécution réelle
> (`npm run lint`, `npm run build`, dev server `:3000` navigué écran par écran via
> Puppeteer, endpoints IA testés au curl).
> **Portée** : observation uniquement. Aucune correction appliquée.
>
> ⚠️ **Nomenclature d'abord : le nom « Ka Rise » n'existe nulle part dans le repo**
> (0 occurrence dans le code, l'HTML, le manifest PWA et le service worker). L'app
> s'appelle encore **« S Y S T E M | Pharaoh »** (`index.html`) / **« Pharaoh System »**
> (`public/manifest.json`). Le repo git est « system-solo-leveling ». Si « Ka Rise » est
> la cible de renommage, **le renommage global n'a jamais été fait** — ni dans les
> métadonnées, ni dans l'UI (l'en-tête affiche « SOLO LEVELING », le footer
> « AURA MASTERY SYSTEM »).

---

## 1. Inventaire du code

### Structure réelle

```
├── server.ts                  872 lignes — Express : /api/health, /api/ai-coach,
│                              /api/generate-quests, web-push VAPID, Vite middleware/dev,
│                              static dist en prod
├── index.html                 title "S Y S T E M | Pharaoh" (ancien nom)
├── vite.config.ts             Tailwind 4 (@tailwindcss/vite), manualChunks vendor
├── public/                    manifest.json ("Pharaoh System"), sw.js (cache v8),
│                              icônes PWA complètes, sounds/*.webm (5 SFX),
│                              ambience/*.webm (5 boucles + CREDITS.md)
├── src/
│   ├── App.tsx                1368 lignes — état central (~30 slices localStorage aura_*),
│   │                          navigation 8 onglets, onboarding v2, moteur XP/gold
│   ├── types.ts               types partagés (Domain, PlayerProfile, …)
│   ├── components/            ~40 composants (dont SystemSoloLeveling.tsx ≈ 1550 lignes)
│   ├── lib/                   domains.ts (moteur Domain), questGeneration.ts,
│   │                          supabaseSync.ts, dailyEngine.ts, uiAssets.ts (badges),
│   │                          globalAudio/sfx/audioSynthesizer, comboEngine…
│   ├── data/                  defaultData.ts, ulkhadProgram.ts (transcription du PDF),
│   │                          initialPhases.ts
│   └── assets/ui|lottie       badges de rang .webp ×10, animations Lottie ×20 exercices
├── docs/ARCHITECTURE.md       SEUL fichier doc (à jour, décrit le moteur Domain)
├── scripts/                   supabase-migration.sql, seed-domains.ts, audits responsive
├── assets/                    VIDE (dossier racine non utilisé)
├── "Sound effects/"           1 mp3 brut NON intégré (source du pack converti)
├── Programme de Musculation….pdf  source humaine (transcrit → src/data/ulkhadProgram.ts)
└── program_text.txt           transcription texte du PDF
```

### Dépendances installées (package.json, node_modules présent)

| Outil | Version | Note |
|---|---|---|
| React / react-dom | ^19.0.1 | React 19 |
| Vite | ^6.2.3 | + @vitejs/plugin-react ^5 |
| Tailwind CSS | ^4.1.14 | plugin Vite officiel |
| TypeScript | ~5.8.2 | `tsc --noEmit` = lint |
| Express | ^4.21.2 | serveur unique dev+prod |
| @supabase/supabase-js | ^2.112.3 | sync cloud optionnelle |
| LLM | @google/genai ^2.4.0 | Gemini prioritaire sur ai-coach |
| Motion | ^12.23.24 | animations |
| Recharts | ^3.10.1 | graphiques |
| lottie-react/web | ^2.4.1 / ^5.13.0 | exercices animés |
| web-push | ^3.6.7 | notifications VAPID |
| esbuild / tsx | ^0.25 / ^4.21 | build server.cjs / dev |

Aucun framework de test installé (aucun runner, aucune assertion) → **0 test automatisé**.

### Compilation & tests

- ✅ `npm run lint` (tsc --noEmit) : **passe, 0 erreur**.
- ✅ `npm run build` : **réussit** (9,6 s). Un seul warning : chunk principal
  `index-*.js` > 500 kB minifié (516 kB). `dist/server.cjs` généré.
- ❌ Tests : inexistants (rien à passer).
- CI GitHub (.github/workflows/ci.yml) : typecheck + build (+ audit responsive sur
  dispatch manuel).

---

## 2. Inventaire fonctionnel réel (16 écrans)

Légende données : 🟢 persistant réel · 🟡 dérivé/persistant · 🔴 statique/mocké.
« Logique » = actions qui mutent l'état et survivent à un rechargement.

| # | Écran demandé | Nom réel (repo) | Existe ? | Données | Logique fonctionnelle | Assets intégrés | Erreurs observées |
|---|---|---|---|---|---|---|
| 1 | Statut | Sous-onglet `statut` de SystemSoloLeveling (onglet SYSTÈME) | ✅ Réel | 🟢 `aura_player_profile` (HP/MP/XP/attributs) | ✅ Allocation points d'attribut persiste ; XP/rangs calculés | ✅ RankBadge art .webp | Aucune |
| 2 | Missions | `quetes` (« Missions ») | ✅ Réel | 🟢 quêtes quotidiennes + NarrativeQuestsView | ✅ Complétion → XP/gold persistés ; reset quotidien daté | ✅ | Aucune |
| 3 | Donjons | `donjons` | ✅ Réel | 🟡 catalogues codés en dur + progression 🟢 persistée | ✅ Entrées coûtent MP, débloquent, XP/or ; boss → « Arise » | ⚠️ Image unsplash externe | **404 image unsplash** (Radar) |
| 4 | Armée Divine/Ombres | `ombres` (« Armée Divine ») | ✅ Réel | 🟢 `player.shadows` (issus des donjons) | ✅ Extraction « Arise » ajoute une ombre ; synergies calculées | ✅ | Aucune |
| 5 | Forge Royale | `forge` | ✅ Réel | 🟢 matériaux + or (état joueur) | ✅ Forge dépense matériaux/or → reliques/inventaire | ✅ | Aucune |
| 6 | Boutique | `boutique` | ✅ Réel | 🟢 or joueur, inventaire | ✅ Achat → débit or atomique ; loot box 100 or ; équipement arme/armure | ✅ | Aucune |
| 7 | Classement | `leaderboard` (« Classement ») | ✅ Réel | 🔴→🟢 Supabase table `leaderboard` (upsert + top 10) | ⚠️ Logique réelle mais **backend mort** | ✅ | **ERR_NAME_NOT_RESOLVED ×8** (DNS Supabase) |
| 8 | Journal | `logs` (« Journal ») | ✅ Réel | 🟢 `player.logs` (événements XP/donjons/ombres) | ✅ Alimenté par toutes les actions | ✅ | Erreurs résiduelles leaderboard |
| 9 | Custom | `personnalisation` (« SALLE DU TRÔNE DIVIN ») | ✅ Réel | 🟢 personnalisation + audio global | ✅ Réglages persistés ; ambiance sonore | ✅ | Aucune |
| 10 | Quêtes (dashboard) | `dashboard` (« Panneau des Quêtes ») | ✅ Réel | 🟢 planning hebdo + habitudes + rituel | ✅ Blocs CRUD complets, toggle → XP, checklist habitudes → XP | ✅ | Erreur réseau Supabase (fetch leaderboard au montage) |
| 11 | Entraînement | `workout` (« Centre de Musculation ») | ✅ Réel | 🟢 routines/sessions/PR/mensurations | ✅ Session complète → XP ; programme 10 mois transcrit du PDF | ✅ Lottie ×20 | Aucune (1 emoji décoratif) |
| 12 | Focus | `focus_timer` | ✅ Réel | 🟢 sessions focus persistées | ✅ Timer complet → XP/heures catégories ; reprise après fermeture | ✅ | Aucune |
| 13 | Bilan | `weekly_targets` (« Bilan ») | ✅ Réel | 🟡 targets dérivées des Domain + heures réelles | ✅ Sliders heures persistés ; WeeklyReportCard agrégée | ✅ | Aucune |
| 14 | Hauts Faits | `victory_journal` | ✅ Réel | 🟢 `aura_victory_logs` | ✅ Ajout/suppression persistés + carte partageable | ✅ | Aucune |
| 15 | Notes | `notepad` | ✅ Réel | 🟢 notes + phases projet | ✅ CRUD notes/phases complet, lié aux Domain | ✅ | Aucune |
| 16 | Trésorerie | `budget` | ✅ Réel | 🟢 transactions/enveloppes/objectifs | ✅ Transactions, allocations enveloppes (dont `domain:<id>`), objectifs épargne | ✅ | Aucune |

**Verdict global §2** : les 16 écrans existent, sont câblés à l'état persistant et ont
une logique réelle. Ce ne sont pas des maquettes. Les seuls trous de données sont
externes : Classement (Supabase mort) et l'image Donjons.

### Modules annexes actifs (hors liste)

Onboarding v2 (4 blocs, dérive tout l'état), Coach IA modal, Personnalisation,
Gestion des données (export/import/reset + sync cloud), DailyBonus/streak,
Notifications push VAPID, PWA offline (sw.js), tour d'introduction, mini-player
audio global, confettis/floating rewards, SystemWindow popups Solo Leveling.

---

## 3. État du moteur IA

### Génération de quêtes — branchée MAIS effectivement morte en dev

- Chaîne complète réelle : `POST /api/generate-quests` (server.ts:790) → NVIDIA NIM /
  OpenRouter → `validateQuests()` serveur → fallback templates déterministes côté
  client (`src/lib/questGeneration.ts`). Rien n'est « template only » dans le code.
- **Constat d'exécution** : appel curl réel → `{error: timeout, source: timeout}`
  après ~20 s, à chaque fois.
- **Cause racine mesurée** (curl direct vers l'API NIM, clé valide, endpoint joignable)
  : le modèle configuré `.env.local` = `nvidia/nemotron-3.5-lightning-30b-a3b` est un
  **modèle de raisonnement** : il consomme tout son budget en « thinking » avant
  d'émettre le JSON (`finish_reason: length` à 22 s avec max_tokens=1000). Le serveur,
  lui, timeout à 20 s (`AbortSignal.timeout(20000)`). Résultat : **la génération LLM
  n'aboutit jamais ; l'app retombe silencieusement sur les templates.**
- Conséquence produit : un nouvel utilisateur reçoit des quêtes template correctes mais
  jamais personnalisées par le LLM, sans message d'erreur apparent.

### Coach IA (/api/ai-coach)

- **Fonctionne réellement** : curl → réponse française pertinente en quelques secondes,
  `source: nvidia_nim`. (La clé `GEMINI_API_KEY` locale est prioritaire dans le code
  mais semble invalide/morte : le fallback NIM a servi la réponse.)
- Mode agent implémenté des deux côtés (12 types d'actions validés serveur par
  `validateAgentActions`, application côté client avec confirmation).
- ⚠️ Incohérence contextuelle : sans domaine fourni (client envoie `context.domains`
  seulement si onboarding v2 a été rejoué), le serveur injecte le **profil legacy codé
  en dur** (Bangre Neo Lab, cinéma, SVT/Maths…) — observé : réponse mentionnant
  « Bangre Neo » alors que le contexte envoyé était vide.

### Onboarding v2 & Domain adaptatif — IMPLÉMENTÉS

- `ONBOARDING_V2_ENABLED = true` (OnboardingModal.tsx:24), activé.
- `handleCompleteOnboardingV2` (App.tsx:213) : dérive cibles hebdo, matières,
  enveloppes budget, poids normalisés (`computeDomainWeights`), quêtes template puis
  upgrade LLM, purge les données démo legacy, flags versionnés
  (`aura_onboarding_version=2`).
- Migration 1-shot legacy présente (`migrateLegacyDomainsIfNeeded`, App.tsx:372) +
  preset « Créateur multi-discipline ».
- Moteur `src/lib/domains.ts` conforme à ARCHITECTURE.md (tracking_type → module
  existant, filet de sécurité `habit_checklist`).
- Nuance : l'instance locale naviguée tourne encore sur les **graines legacy**
  (Bangre Neo, SVT…) tant que l'onboarding v2 n'a pas été repassé — conforme au
  design de migration, à ne pas confondre avec un écart.

### Garde-fous — en place côté serveur (pas que dans le prompt)

| Garde-fou promis | État |
|---|---|
| Sortie JSON structurée obligatoire | ✅ `jsonMode:true` + `JSON.parse` + 502 si invalide |
| Validation/champs bornés | ✅ `validateQuests` : whitelist domainId, XP clampé 20–120, titres tronqués 120/600 chars |
| Pas de prescription santé libre | ✅ règle système stricte + contrainte physique « jamais interprétée médicalement » ; l'app reste autoritaire sur séries/reps (programme local). ⚠️ Pas de filtre lexical post-LLM (on fait confiance au prompt) |
| `flag_for_human_review` | ❌ **absent du code** (0 occurrence). Existe seulement comme concept dans les specs conversationnelles — jamais implémenté |
| Penalties bornées par catégories choisies | ✅ `penalty_categories_allowed` persisté à l'onboarding (choix unique) |
| Timeout 20 s + fallback templates | ✅ implémenté… et c'est lui qui masque le bug de modèle ci-dessus |
| domain_weights calculés côté app | ✅ `computeDomainWeights` (normalisation budgets) |
| Actions agent whitelistées/clampées | ✅ 12 types, regex horaires, anti-injection `noBadChars`, clamp XP/horaires |

---

## 4. État visuel / assets

### Intégrés proprement

- **Badges de rang** : 10 .webp (`src/assets/ui/`) importés via registre unique
  `src/lib/uiAssets.ts`, consommés par `RankBadge` dans Header, Statut, Bilan.
  Commentaire explicite : « the ONLY correct way to reference badge art ».
- **Icônes** : `PharaohIcons.tsx` (set custom) + lucide-react ; aucun emoji constaté
  dans les 17 captures DOM (0–1 emoji décoratif sur Entraînement).
- **Barres HP/MP/XP** : rendues dans Statut (données réelles).
- **PWA** : manifest complet (icônes 192/512/maskable, shortcuts), favicon multi-format,
  apple-touch-icon, theme-color, SW offline v8 pré-cachant shell + bundles hashés.
- **Audio** : 5 SFX .webm branchés (`sfx.ts`), 5 ambiances .webm branchées
  (`globalAudio.ts` + CREDITS.md CC0), synthé procédural en plus.

### Non intégrés / restes

- `"Sound effects/System - Pop Up Sound Effect Solo leveling.mp3"` (racine) : source
  brute non référencée par le code (déjà convertie en `/sounds/*.webm`).
- `assets/` (racine) : dossier vide.
- `src/assets/images/pharaoh_pwa_logo_*.jpg` : importé nulle part (les logos servis
  viennent de `/public`).

### Placeholders visuels / ancien nommage

- **Ancien nom partout** : title HTML, manifest, README (« Pharaoh Edition »), UI
  (« SOLO LEVELING », « AURA MASTERY SYSTEM », « Le Chasseur »). « Ka Rise » absent.
- Image du Radar Donjons : URL unsplash externe en dur → 404 (placeholder cassé).
- Profil legacy en dur dans defaultData (Bangre Neo/SVT/cinéma) : visible uniquement
  avant re-onboarding v2 ou pour l'instance migrée — voulu par design.

---

## 5. Logs et erreurs (navigation réelle, 17 écrans capturés)

Screenshots : `scripts/shots-state/*.png` (boot, 8 onglets top-level, 9 sous-onglets
Système). Données brutes : `scripts/runtime-results.json`.

### Erreurs console/réseau observées

| # | Écran | Erreur | Cause racine identifiée |
|---|---|---|---|
| E1 | Boot | POST `https://tteayfimrsnjoparyzjl.supabase.co/auth/v1/signup` → ERR_NAME_NOT_RESOLVED (×4+) | Projet Supabase **supprimé/inexistant au niveau DNS** (vérifié nslookup). La sync cloud tente un signup anonyme au boot |
| E2 | Classement | GET `rest/v1/leaderboard` → ERR_NAME_NOT_RESOLVED puis ERR_FAILED (×8) | Idem — table `leaderboard` injoignable ; l'écran reste vide |
| E3 | Donjons | HTTP 404 `images.unsplash.com/photo-1608976478335...` | Image externe codée en dur, supprimée d'unsplash |
| E4 | Dashboard | Erreur résiduelle fetch leaderboard au montage | Appel réseau non conditionné au statut de sync |
| E5 | generate-quests (API) | Timeout 503 systémique | Modèle reasoning sans budget de tokens suffisant vs timeout 20 s (voir §3) |

Aucune erreur JS React, aucun warning React, aucun crash pendant toute la navigation.

### Logs serveur

Dev server : aucune erreur côté Node. Supabase : inaccessible (projet mort), logs non
consultables. Endpoint `/api/health` : `{"status":"ok"}`.

---

## 6. Synthèse — Écarts documentation vs réalité

| Documenté / attendu | Réalité |
|---|---|
| Nom « Ka Rise » | **Absent du repo.** Ancien nommage « Pharaoh System » partout |
| AGENTS.md racine décrit stack + workflow push | ✅ exact (React 19/Vite 6/Tailwind 4/Supabase/NVIDIA NIM) |
| ARCHITECTURE.md (moteur Domain) | ✅ **conforme** : types, storage aura_*, sync debounce 5 s, migration 1-shot, garde-fous, mapping tracking_type→modules vérifiés dans le code |
| PRD.md / DATA_MODEL.md cités par le prompt | ❌ **n'existent pas** dans le repo (seul ARCHITECTURE.md) |
| Leaderboard « Supabase-backed » (README) | Code réel ✔ mais backend Supabase mort (DNS) → feature HS aujourd'hui |
| Sync cloud optionnelle | Code ✔ ; sans projet Supabase vivant, app 100 % locale (fallback prévu, fonctionne) |
| Génération LLM opérationnelle | Chaîne complète ✔ mais ineffective en pratique : modèle reasoning + timeout 20 s → toujours templates |
| `flag_for_human_review` | Jamais implémenté |
| Tests | Aucun framework, aucun test |
| Deploy AI Studio/Cloud Run (README) | Config CI partielle ; rien de vérifiable depuis ce poste |

---

## 7. Observations libres (non classées ailleurs)

1. **Le fallback silencieux est une arme à double tranchant** : l'app « marche »
   toujours, ce qui a permis au bug de génération LLM (modèle reasoning) de passer
   inaperçu. Aucune télémétrie ni badge « quêtes template » côté UI.
2. **Supabase est doublement mort** : projet DNS inexistant + clé locale probablement
   obsolète. Décision à prendre : recréer un projet (et relancer
   `scripts/supabase-migration.sql`) ou assumer 100 % local-first et couper les
   appels réseau au boot (ils coûtent plusieurs requêtes fantômes par session).
3. **Le modèle NIM configuré est inadapté** à un usage JSON court : modèle de
   raisonnement (`nemotron-3.5-lightning`) + `max_tokens` par défaut 2000 + jsonMode.
   Soit désactiver le thinking (si supporté), soit monter max_tokens, soit choisir un
   modèle instruct classique (ex. la valeur par défaut du code :
   `meta/llama-3.1-70b-instruct`, ou via OpenRouter `openai/gpt-4o-mini` déjà configuré).
4. **Deux profils cohabitent** (legacy Ulrich en dur vs Domain utilisateur) : la
   migration est bien conçue mais toute correction future devra tester les DEUX chemins
   (instance migrée + fresh user v2).
5. **Qualité d'ingénierie réelle** : ErrorBoundary, rate limiting IA (429 + Retry-After),
   caps de prompt, validation stricte des actions agent, atomicité or/XP, safe-load
   localStorage, chunking vendor, SW offline, CI typecheck+build. Ce n'est PAS un
   prototype : c'est une beta sérieuse dont les seuls manquements sont externes
   (Supabase, choix de modèle) ou cosmétiques (nommage, 1 image).
6. **Fichiers morts** à archiver un jour : `assets/` vide, mp3 brut racine, logo jpg
   non importé, `scripts/archive/`.
7. **Le footer affiche « AURA MASTERY SYSTEM »** alors que le header dit « SOLO
   LEVELING » et le manifest « Pharaoh System » : trois identités différentes selon
   l'endroit — le renommage « Ka Rise » devra toutes les traiter.

# ARCHITECTURE — Moteur de domaines adaptatif

## Principe

Le contenu (domaines de VIE de l'utilisateur, texte libre défini à l'onboarding) est
séparé du contenant (modules d'UI existants, génériques une fois les libellés retirés).

Une entité `Domain` (`src/types.ts`) est la source de vérité :

```
Domain { id, user_id (null = local ; uid Supabase si sync), label (texte libre),
         category (enum fermé : physical|creative|intellectual|craft|habit|financial|social),
         tracking_type (enum fermé : workout_log|project_phases|study_subjects|
                        focus_sessions|budget_bucket|habit_checklist),
         icon_ref, color_accent, goal_text (texte conservé tel quel),
         target_metric?, weekly_time_budget?, created_at, legacyCategory? }
```

`tracking_type` ne crée **jamais** de nouvel écran : il **réutilise** un module existant
(constants + mappers : `src/lib/domains.ts`).

## Stockage & sync

- Local-first : chaque slice persiste dans `localStorage` (`aura_*`), dont
  `aura_domains` et `aura_habit_checks`.
- Sync cloud = **Supabase** (`src/lib/supabaseSync.ts`, `getSupabase()`), auth anonyme,
  table `user_state(uid, data jsonb, client_updated_ms)`, push debounce 5 s,
  pull last-write-wins. Sans clés `.env.local`, l'app reste 100 % locale.
  Schéma : `scripts/supabase-migration.sql`.
- Migration 1-shot de l'instance legacy : `migrateLegacyDomainsIfNeeded()` sous
  `aura_domains` vide + `aura_onboarding_completed` → 4 domaines seedés
  (preset « Créateur multi-discipline », voir `LEGACY_DOMAIN_MIGRATION`).

## Onboarding (v2)

`OnboardingModal` — 4 blocs : Vision → Domaines (2–5, QCM tracking_type **déterministe**)
→ Calibrage (intensité, pénalités, contrainte physique texte) → Confirmation éditable.
Flag de retour arrière : `ONBOARDING_V2_ENABLED` (constante) ; version persistée
`aura_onboarding_version`.
À la validation, `handleCompleteOnboardingV2` **dérive** tout (cibles hebdo, matières,
enveloppes, poids, quêtes) depuis les domaines, et efface les données de démo legacy.

## Génération de quêtes (avec garde-fous)

- `POST /api/generate-quests` (`server.ts`), provider-agnostique :
  `LLM_PROVIDER=nvidia_nim` (dev) | `openrouter` (prod) | futur local Gemma E2B.
- Sortie **JSON structuré** obligatoire, validée serveur (XP borné 20–120).
- Garde-fous (équivalent SYSTEM_PROMPT.md) :
  1. Aucun conseil médical / nutrition / blessure ; pour `category=physical` l'app reste
     autoritaire sur séries/reps/RPE — le LLM cadre la quête, ne prescrit pas.
  2. `goal_text` et la vision sont utilisés **tels quels** (jamais réécrits).
  3. `domain_weights` est calculé côté app (normalisation des budgets hebdo),
     jamais inventé par le LLM.
  4. Pénalités bornées par `penalty_categories_allowed` choisi par l'utilisateur au Bloc 3.
  5. Timeout 20 s serveur → le client retombe sur des templates déterministes
     (`src/lib/questGeneration.ts` `buildTemplateQuests`) — l'app n'est jamais bloquée.

## Modules ↔ tracking_type

| tracking_type    | Module réutilisé                       |
|------------------|----------------------------------------|
| workout_log      | WorkoutSystem (paramétré par Domain) ; onglet caché si aucun domaine physique |
| project_phases   | ProjectTimelineView / Notepad (jalons, filtres) |
| study_subjects   | ProgressDashboard (matières du domaine, plus SVT/Maths en dur pour les nouveaux) |
| focus_sessions   | FocusTimer (onglets = domaines)        |
| budget_bucket    | BudgetTracker (enveloppes `domain:<id>`) |
| habit_checklist  | HabitChecklistCard (Dashboard) — module léger, XP via `XP_RATES.habitCheckXp` |

Domaine ambigu ne rentrant dans aucun des 6 → **habit_checklist** (filet de sécurité),
jamais un 7e type sans accord préalable.

## Non-régression

- L'instance legacy (Ulrich) est migrée 1:1 : Bilan/Timeline/Enveloppes restent pilotés par
  les graines legacy tant que le profil a les `legacyCategory` correspondants.
- Moteur XP/rang (`calculateLevelProgression`, `getRankAndClassForLevel`, `XP_RATES`)
  inchangé (seule addition : `habitCheckXp`).
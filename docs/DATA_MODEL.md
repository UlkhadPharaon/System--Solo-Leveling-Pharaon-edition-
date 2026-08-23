# DATA MODEL — Ka Rise

> Reconstruit depuis le code réel le 2026-08-23 (prompt 2/2, BUG-008). Types complets :
> `src/types.ts`. Stockage : `localStorage` (`aura_*`) + optionnel Supabase.

## 1. Entité centrale : `Domain` (source de vérité)

```ts
interface Domain {
  id: string;
  user_id: string | null;      // null = local-only ; uid Supabase si sync
  label: string;               // texte libre, affiché partout — jamais un enum
  category: DomainCategory;    // physical|creative|intellectual|craft|habit|financial|social
  tracking_type: TrackingType; // workout_log|project_phases|study_subjects|
                               // focus_sessions|budget_bucket|habit_checklist
  icon_ref: string;
  color_accent: string;
  goal_text: string;           // mots de l'utilisateur, conservés tels quels
  target_metric?: { type: string; value: number }; // libre, jamais interprété médicalement
  weekly_time_budget?: number; // heures/semaine
  created_at: number;
  legacyCategory?: Category;   // migration 1-shot depuis l'instance legacy
}
```

`tracking_type → module UI` (jamais de nouvel écran) :

| tracking_type | Module | Dérivations à l'onboarding |
|---|---|---|
| workout_log | WorkoutSystem (+ onglet caché si 0 domaine physique) | routine paramétrée |
| project_phases | Notepad/Timeline | phases vides |
| study_subjects | ProgressDashboard | matières `domain_subject:<id>` |
| focus_sessions | FocusTimer | catégories = domaines |
| budget_bucket | BudgetTracker | enveloppes `domain:<id>` |
| habit_checklist | HabitChecklistCard (Dashboard) | checks quotidiens |

## 2. Slices localStorage (`aura_*`)

| Clé | Contenu | Type |
|---|---|---|
| `aura_player_profile` | XP, niveau, rang, classe, HP/MP, attributs, or, badges, inventaire, ombres, quêtes du jour, pénalité, logs | JSON |
| `aura_domains` / `aura_habit_checks` | moteur Domain | JSON |
| `aura_onboarding_completed` / `aura_onboarding_version` | `'true'` / `'2'` | flag |
| `aura_day_schedules` | blocs hebdo `{Monday..Sunday: [{id,title,start,end,category,isCompleted}]}` | JSON |
| `aura_category_targets` / `aura_subject_goals` | cibles dérivées (`dom:<id>`) | JSON |
| `aura_budget_buckets` / `aura_transactions` / `aura_savings_goals` | trésorerie | JSON |
| `aura_workout_routines` / `aura_completed_workout_sessions` / `aura_personal_records` / `aura_body_metrics` | entraînement | JSON |
| `aura_focus_sessions` / `aura_active_focus_session` | focus | JSON |
| `aura_victory_logs` / `aura_notes` / `aura_project_phases` | journalisation/projets | JSON |
| `aura_dungeons` | état des donjons (déverrouillage, victoires) | JSON |
| `aura_daily_streak` / `aura_daily_quest_reset` / `aura_streak_records` / `aura_streak_protected_at` | streaks & resets datés | JSON/flag |
| `aura_personalization` | nom, tagline, devise, avatar, préférences audio | JSON |
| `aura_music_volume` / `aura_sfx_muted` / `aura_focus_playlist_meta` | audio global | JSON |
| `aura_cloud_sync_enabled` / `aura_cloud_sync_meta` / `aura_system_db` | sync cloud | JSON |

Règles transverses : lecture via loader tolérant (JSON corrompu → défaut), reset
quotidien des quêtes horodaté, purge des données de démo à l'onboarding v2.

## 3. Sync Supabase (optionnelle, actuellement gated)

- Table unique `user_state(uid, data jsonb, client_updated_ms)` — payload = toutes les
  slices ci-dessus sérialisées ; auth anonyme ; push debouncé 5 s ; pull last-write-wins.
- Schéma SQL : `scripts/supabase-migration.sql`.
- Table `leaderboard(user_id, user_name, level, rank, hunter_class, total_xp, avatar)`
  — upsert on conflict user_id + select top 10. **Gate de joignabilité** (BUG-005) :
  aucune requête tant que le projet ne répond pas au health check.

## 4. Contrats API serveur

| Endpoint | Entrée | Sortie |
|---|---|---|
| `GET /api/health` | — | `{"status":"ok", timestamp}` |
| `POST /api/generate-quests` | `{vision, domains[], coachingIntensity, physicalConstraint?}` | `{quests:[{domainId,title,description,xpReward∈[20,120],difficulty}], source:'llm'}` · fallback `{source:'timeout'}` (503) · garde-fou `{flag_for_human_review:true, reason:'user_text_flagged', message, source:'flagged'}` (200) |
| `POST /api/ai-coach` | `{prompt, context{domains,…}, history[], agentMode?}` | `{reply}` ou mode agent `{reply, actions[]}` — 12 types d'actions whitelistés/clampés |
| `POST /api/push/*`, `GET /api/push/config|status` | web-push VAPID | souscriptions/notifications |

## 5. Économie de jeu (constantes clés)

- XP par niveau ×1.5 dès 100 (pas de plafond, DISC-005) ; +5 points d'attribut/niveau.
- Rangs E→S puis spéciaux (Dragon/Monarque/Loup) → Pharaon (niveau ≥ 25).
- Quêtes de domaine : XP plein, or = XP/2 ; actions agent clampées (XP 1–200, or 0–100).

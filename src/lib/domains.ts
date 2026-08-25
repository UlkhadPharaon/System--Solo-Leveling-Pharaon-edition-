/**
 * Adaptive Domain Engine — store & helpers.
 *
 * A Domain is the single source of truth for the user's life areas
 * (replaces hardcoded Musculation/Cinéma/Bangre Neo Lab/École). Local-first:
 * persisted under `aura_domains` in localStorage and cloud-synced like every
 * other `aura_*` key.
 */

import { Domain, DomainCategory, TrackingType, Category } from '../types';

export const DOMAINS_STORAGE_KEY = 'aura_domains';

// ── Styles per closed category enum (icon + accent color) ──────────────────
// Colors follow the Pharaoh palette (see index.css @theme): blood/gold/
// sapphire/amethyst/emerald core accents, extended with jade & lotus so the
// seven categories stay distinct without leaving the theme's saturation family.
export const DOMAIN_CATEGORY_STYLES: Record<DomainCategory, { label: string; icon: string; color: string; emoji: string }> = {
  physical: { label: 'Physique', icon: 'dumbbell', color: '#C0392B', emoji: '🏋️' },
  creative: { label: 'Créatif', icon: 'film', color: '#D4A81E', emoji: '🎬' },
  intellectual: { label: 'Intellectuel', icon: 'graduation-cap', color: '#1D6FA5', emoji: '📚' },
  craft: { label: 'Artisanat/Tech', icon: 'code', color: '#7B3FE4', emoji: '🛠️' },
  habit: { label: 'Habitude', icon: 'check-circle', color: '#2FA57A', emoji: '✅' },
  financial: { label: 'Financier', icon: 'wallet', color: '#1E8A49', emoji: '💰' },
  social: { label: 'Social', icon: 'users', color: '#C94277', emoji: '🤝' },
};

// QCM label → tracking_type (onboarding Bloc 2) — deterministic, never LLM-classified.
export const TRACKING_TYPE_CHOICES: { value: TrackingType; label: string }[] = [
  { value: 'workout_log', label: "De l'entraînement physique régulier" },
  { value: 'project_phases', label: 'Un projet créatif avec des étapes' },
  { value: 'study_subjects', label: "De l'apprentissage / des révisions" },
  { value: 'habit_checklist', label: 'Une pratique/habitude à tenir dans la durée' },
  { value: 'focus_sessions', label: 'Du temps de travail concentré à programmer' },
  { value: 'budget_bucket', label: "De la gestion d'argent/budget" },
];

// Sensible default category per tracking_type (user answers QCM on tracking;
// category drives icon/color and can be inferred, then overridden).
export const DEFAULT_CATEGORY_FOR_TRACKING: Record<TrackingType, DomainCategory> = {
  workout_log: 'physical',
  project_phases: 'creative',
  study_subjects: 'intellectual',
  focus_sessions: 'intellectual',
  budget_bucket: 'financial',
  habit_checklist: 'habit',
};

export function makeDomainId(label: string): string {
  const slug = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  return `dom_${slug || Math.random().toString(36).slice(2, 8)}`;
}

export function styleForDomain(domain: Domain) {
  return DOMAIN_CATEGORY_STYLES[domain.category] ?? DOMAIN_CATEGORY_STYLES.habit;
}

// ── Storage ────────────────────────────────────────────────────────────────
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadDomains(): Domain[] {
  return safeParse<Domain[]>(localStorage.getItem(DOMAINS_STORAGE_KEY), []);
}

export function saveDomains(domains: Domain[]) {
  localStorage.setItem(DOMAINS_STORAGE_KEY, JSON.stringify(domains));
}

export function domainsForTracking(domains: Domain[], tracking: TrackingType): Domain[] {
  return domains.filter((d) => d.tracking_type === tracking);
}

export function findDomainByLegacy(domains: Domain[], category: Category): Domain | undefined {
  return domains.find((d) => d.legacyCategory === category);
}

// ── domain_weights: deterministic, normalized from weekly_time_budget ───────
export function computeDomainWeights(domains: Domain[]): Record<string, number> {
  const budgets = domains.map((d) => ({
    id: d.id,
    h: Math.max(0.5, Number(d.weekly_time_budget) || 2), // sensible floor: 2h default
  }));
  const total = budgets.reduce((acc, b) => acc + b.h, 0);
  if (total <= 0) return {};
  const weights: Record<string, number> = {};
  budgets.forEach((b) => {
    weights[b.id] = Math.round((b.h / total) * 1000) / 1000;
  });
  return weights;
}

// ── Migration seed: Ulrich's 4 legacy domains → Domain rows ────────────────
// Preset "Créateur multi-discipline" — the first concrete example the engine
// must be able to reproduce. Mapping decisions (tranché):
//   Musculation    → workout_log    / physical
//   Cinéma         → project_phases / creative
//   Bangre Neo Lab → project_phases / craft
//   École          → study_subjects / intellectual
export const LEGACY_DOMAIN_MIGRATION: Omit<Domain, 'created_at' | 'user_id'>[] = [
  {
    id: 'dom_musculation',
    label: 'Musculation',
    category: 'physical',
    tracking_type: 'workout_log',
    icon_ref: 'dumbbell',
    color_accent: '#ef4444',
    goal_text: 'Suivre le programme Ulkhad sur 10 mois et gagner en force et en condition physique.',
    weekly_time_budget: 6,
    legacyCategory: 'morning_routine',
  },
  {
    id: 'dom_cinema',
    label: 'Cinéma',
    category: 'creative',
    tracking_type: 'project_phases',
    icon_ref: 'film',
    color_accent: '#f59e0b',
    goal_text: 'Écrire et produire des scénarios, mener les projets ciné à terme.',
    weekly_time_budget: 12,
    legacyCategory: 'cinema',
  },
  {
    id: 'dom_bangre_neo_lab',
    label: 'Bangre Neo Lab',
    category: 'craft',
    tracking_type: 'project_phases',
    icon_ref: 'code',
    color_accent: '#8b5cf6',
    goal_text: 'Développer les projets tech/IA de Bangre Neo Lab, architecture et produits.',
    weekly_time_budget: 17,
    legacyCategory: 'bangre_neo',
  },
  {
    id: 'dom_ecole',
    label: 'École',
    category: 'intellectual',
    tracking_type: 'study_subjects',
    icon_ref: 'graduation-cap',
    color_accent: '#06b6d4',
    goal_text: 'Réviser régulièrement les matières scolaires et réussir les examens.',
    weekly_time_budget: 7,
    legacyCategory: 'school',
  },
];

/** Seed the 4 legacy domains — used by the boot migration and by the onboarding preset. */
export function buildLegacyDomains(): Domain[] {
  const now = Date.now();
  return LEGACY_DOMAIN_MIGRATION.map((d, i) => ({ ...d, user_id: null, created_at: now + i }));
}

/**
 * One-shot migration at boot: if the user completed the legacy onboarding
 * (Ulrich's instance) but has no Domain rows yet, seed them so the app keeps
 * working identically, now driven by Domain data instead of hardcoded labels.
 */
export function migrateLegacyDomainsIfNeeded(): Domain[] {
  const existing = loadDomains();
  if (existing.length > 0) return existing;
  const legacyOnboarded = localStorage.getItem('aura_onboarding_completed') === 'true';
  if (!legacyOnboarded) return []; // fresh user → real onboarding v2 will create domains
  const seeded = buildLegacyDomains();
  saveDomains(seeded);
  return seeded;
}

/**
 * Resolve the categoryTargets id that workout hours should be credited to.
 *
 * Since onboarding v2 the user's workout domain lives under `dom:<id>`;
 * crediting the hardcoded legacy `morning_routine` slice instead silently
 * drops those hours from every domain card, chart and weekly target. The
 * legacy slice stays authoritative ONLY for profiles that never migrated.
 */
export function workoutTargetId(domains: Domain[]): string {
  const workoutDomain = domains.find((d) => d.tracking_type === 'workout_log');
  return workoutDomain ? `dom:${workoutDomain.id}` : 'morning_routine';
}

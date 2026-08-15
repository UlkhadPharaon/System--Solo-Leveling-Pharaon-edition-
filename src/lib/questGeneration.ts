/**
 * Client-side quest generation pipeline.
 *
 * After onboarding, the first quests for each domain are requested from
 * POST /api/generate-quests (structured output, guardrails enforced
 * server-side). If the endpoint is unavailable (offline, missing key), a
 * deterministic template per tracking_type is used so the app is never
 * blocked. domain_weights are always computed locally — never LLM-invented.
 */

import { Domain, GeneratedQuest, CoachingIntensity } from '../types';

// Deterministic fallback (and starter) quests per tracking type.
const TEMPLATE_QUESTS: Record<string, (d: Domain) => { title: string; description: string; xp: number; difficulty: 'easy' | 'medium' | 'hard' }[]> = {
  workout_log: (d) => [
    { title: `Première séance ${d.label}`, description: `Le Système vous assigne votre première séance ${d.label}. Suis le programme prescrit dans l'app (séries/répétitions/RPE).`, xp: 60, difficulty: 'medium' },
    { title: `Planifier la semaine ${d.label}`, description: `Bloque tes créneaux d'entraînement de la semaine dans ton emploi du temps.`, xp: 30, difficulty: 'easy' },
  ],
  project_phases: (d) => [
    { title: `Définir le jalon n°1 — ${d.label}`, description: `Écris concrètement à quoi ressemble la première étape tangible de « ${d.label} » puis crée-la dans tes jalons de projet.`, xp: 50, difficulty: 'medium' },
    { title: `Session d'avancement ${d.label}`, description: `Une session de travail concentrée de 25 minutes sur ${d.label}. Rien de parfait, juste de l'avancement.`, xp: 40, difficulty: 'easy' },
  ],
  study_subjects: (d) => [
    { title: `Plan de révision ${d.label}`, description: `Liste tes matières/sous-thèmes de ${d.label} et fixe un objectif d'heures hebdo réaliste.`, xp: 40, difficulty: 'easy' },
    { title: `Première session de révision ${d.label}`, description: `Une session Pomodoro de révision active (rappel, pas relecture passive).`, xp: 50, difficulty: 'medium' },
  ],
  focus_sessions: (d) => [
    { title: `Deep work — ${d.label}`, description: `Programme une session de travail profond dédiée à ${d.label} via le minuteur Focus.`, xp: 50, difficulty: 'medium' },
    { title: `Rituel ${d.label}`, description: `3 sessions focus cette semaine sur ${d.label}. Coche-les au fur et à mesure.`, xp: 70, difficulty: 'hard' },
  ],
  budget_bucket: (d) => [
    { title: `Enveloppe ${d.label} créée`, description: `Fixe l'allocation mensuelle de ton enveloppe « ${d.label} » dans la Trésorerie.`, xp: 30, difficulty: 'easy' },
    { title: `Premier point ${d.label}`, description: `Enregistre tes transactions de la semaine et compare-les à ton enveloppe ${d.label}.`, xp: 40, difficulty: 'medium' },
  ],
  habit_checklist: (d) => [
    { title: `Premier check ${d.label}`, description: `Coche ta première répétition de « ${d.label} » dans la carte Habitudes du Dashboard.`, xp: 30, difficulty: 'easy' },
    { title: `Série de 3 — ${d.label}`, description: `Tiens ton habitude ${d.label} 3 jours d'affilée.`, xp: 60, difficulty: 'medium' },
  ],
};

export function buildTemplateQuests(domains: Domain[]): GeneratedQuest[] {
  const now = Date.now();
  return domains.flatMap((d, i) =>
    (TEMPLATE_QUESTS[d.tracking_type] ?? TEMPLATE_QUESTS.habit_checklist)(d).map((q, j) => ({
      id: `gq_tpl_${d.id}_${now}_${j}_${i}`,
      domainId: d.id,
      title: q.title,
      description: q.description,
      xpReward: q.xp,
      difficulty: q.difficulty,
      source: 'template' as const,
    }))
  );
}

export async function generateInitialQuests(params: {
  vision: string;
  domains: Domain[];
  coachingIntensity: CoachingIntensity;
  physicalConstraint?: string;
}): Promise<GeneratedQuest[]> {
  const { vision, domains, coachingIntensity, physicalConstraint } = params;
  try {
    const res = await fetch('/api/generate-quests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vision,
        domains,
        coachingIntensity,
        physicalConstraint: physicalConstraint || undefined,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.quests) || data.quests.length === 0) throw new Error('empty quests');
    const now = Date.now();
    return data.quests.map((q: any, i: number) => ({
      id: `gq_llm_${now}_${i}`,
      domainId: q.domainId,
      title: q.title,
      description: q.description,
      xpReward: q.xpReward,
      difficulty: q.difficulty,
      source: 'llm' as const,
    }));
  } catch (err) {
    console.warn('[quests] LLM generation unavailable — using deterministic templates:', err);
    return buildTemplateQuests(domains);
  }
}

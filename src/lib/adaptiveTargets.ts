/**
 * Adaptive weekly targets (F4) — the System proposes recalibrating a domain's
 * weekly budget when reality diverges from it for two consecutive weeks.
 *
 * A target nobody hits is demotivating noise; a target always smashed is not
 * a target. Rather than silently mutating the user's goals (their own words,
 * set at onboarding), this computes a SUGGESTION with its evidence and leaves
 * the decision to one tap.
 *
 * Pure functions: no React, no storage access. Week snapshots are persisted
 * by the caller under 'aura_weekly_snapshots'.
 */

import type { WeeklyCategoryTarget } from '../types';

export const WEEKLY_SNAPSHOTS_KEY = 'aura_weekly_snapshots';
/** Keep ~3 months of history; enough for trends, small on disk. */
export const MAX_SNAPSHOTS = 12;

export interface WeeklySnapshot {
  /** ISO date (YYYY-MM-DD) of the snapshot day. */
  weekEnd: string;
  /** completedHours per categoryTarget id at snapshot time. */
  hours: Record<string, number>;
}

export interface RecalibrationSuggestion {
  targetId: string;
  label: string;
  currentTarget: number;
  suggestedTarget: number;
  /** Average completion rate across the evaluated weeks (0..∞). */
  avgCompletion: number;
  weeksEvaluated: number;
  direction: 'raise' | 'lower';
}

/**
 * Append this week's completion snapshot, capped to MAX_SNAPSHOTS entries.
 * Pure: returns the new array (caller persists).
 */
export function pushWeeklySnapshot(
  history: WeeklySnapshot[],
  categoryTargets: WeeklyCategoryTarget[],
  weekEnd = new Date().toISOString().split('T')[0],
): WeeklySnapshot[] {
  const hours: Record<string, number> = {};
  categoryTargets.forEach((t) => {
    hours[t.id] = Math.round((t.completedHours || 0) * 10) / 10;
  });
  const next = [...history.filter((h) => h.weekEnd !== weekEnd), { weekEnd, hours }];
  return next.slice(-MAX_SNAPSHOTS);
}

/**
 * Compute recalibration suggestions from the last `weeksToUse` snapshots.
 *
 * Rules (deliberately conservative):
 *  - need ≥2 comparable snapshots,
 *  - LOWER when average completion < 60% → suggest ≈ observed reality (+15%),
 *    never below 1h,
 *  - RAISE when ≥110% every evaluated week → suggest +25%.
 * Only dom:* targets are considered — legacy slices belong to migrated-out
 * profiles and shouldn't resurface through suggestions.
 */
export function computeRecalibrations(
  history: WeeklySnapshot[],
  categoryTargets: WeeklyCategoryTarget[],
  weeksToUse = 2,
): RecalibrationSuggestion[] {
  if (history.length < 2) return [];
  // weeksToUse = number of completion RATES to evaluate → needs one extra
  // snapshot as the baseline for the first delta.
  const window = history.slice(-(weeksToUse + 1));
  const out: RecalibrationSuggestion[] = [];

  for (const t of categoryTargets) {
    if (!(typeof t.id === 'string' && t.id.startsWith('dom:'))) continue;
    if ((t.targetHours ?? 0) <= 0) continue;

    // Completion rate per snapshot = hours done that week / weekly target.
    // Snapshots store ABSOLUTE completedHours; consecutive deltas approximate
    // each week's work because targets reset weekly in practice.
    const rates = window.map((snap, i) => {
      if (i === 0) return null;
      const prev = window[i - 1];
      const delta = (snap.hours[t.id] ?? 0) - (prev.hours[t.id] ?? 0);
      const gained = delta >= 0 ? delta : snap.hours[t.id] ?? 0; // reset detected
      return t.targetHours > 0 ? gained / t.targetHours : 0;
    }).filter((r): r is number => r !== null);

    if (rates.length < 1) continue;
    const avgCompletion = rates.reduce((a, b) => a + b, 0) / rates.length;

    // Zero observed work over the whole window means "never started" — we
    // cannot tell an overloaded domain from an abandoned one. Suggesting a
    // change there would be noise, so stay silent until some effort shows up.
    const totalObservedGain = window.reduce(
      (sum, snap, i) => (i === 0 ? sum : sum + Math.max(0, (snap.hours[t.id] ?? 0) - (window[i - 1].hours[t.id] ?? 0))),
      0,
    );
    if (totalObservedGain <= 0) continue;

    if (avgCompletion < 0.6 && t.targetHours > 1) {
      out.push({
        targetId: t.id,
        label: t.label,
        currentTarget: t.targetHours,
        suggestedTarget: Math.max(1, Math.round(t.targetHours * avgCompletion * 1.15 * 2) / 2),
        avgCompletion: Math.round(avgCompletion * 100) / 100,
        weeksEvaluated: rates.length,
        direction: 'lower',
      });
    } else if (avgCompletion >= 1.1 && rates.every((r) => r >= 1.1)) {
      out.push({
        targetId: t.id,
        label: t.label,
        currentTarget: t.targetHours,
        suggestedTarget: Math.round(t.targetHours * 1.25 * 2) / 2,
        avgCompletion: Math.round(avgCompletion * 100) / 100,
        weeksEvaluated: rates.length,
        direction: 'raise',
      });
    }
  }

  return out;
}

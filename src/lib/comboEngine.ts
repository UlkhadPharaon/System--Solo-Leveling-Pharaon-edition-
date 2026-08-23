/**
 * Combo Engine (M3) — chain rewards within a time window for a multiplier.
 * Makes grinding quests FEEL active instead of transactional: each +1 taps
 * into the next multiplier tier, so finishing "une dernière quête" has pull.
 *
 * Tiers: 3 actions in 60s → ×1.5 · 6 actions → ×2 (applies to gold only;
 * XP stays honest to the level curve).
 */
import { useSyncExternalStore } from 'react';

const WINDOW_MS = 60_000;
const MAX_TRACKED = 12;

export interface ComboState {
  count: number;        // actions inside the current window
  multiplier: number;   // 1 | 1.5 | 2
  lastAt: number;
}

let state: ComboState = { count: 0, multiplier: 1, lastAt: 0 };
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }

function tierFor(count: number): number {
  if (count >= 6) return 2;
  if (count >= 3) return 1.5;
  return 1;
}

/** Register an action. Returns the CURRENT combo after this hit. */
export function registerComboHit(): ComboState {
  const now = Date.now();
  state.count = now - state.lastAt <= WINDOW_MS ? Math.min(MAX_TRACKED, state.count + 1) : 1;
  state.lastAt = now;
  state.multiplier = tierFor(state.count);
  emit();
  return state;
}

/** Gold bonus for a reward event given the live combo. */
export function comboGoldBonus(baseGold: number): number {
  return Math.round(baseGold * (state.multiplier - 1));
}

export function getCombo(): ComboState {
  return state;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot(): ComboState {
  return state;
}

export function useCombo(): ComboState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Active Focus Session store (#1 UX audit).
 *
 * The FocusTimer previously kept its countdown in component state, so simply
 * switching tabs unmounted it and silently destroyed a running session. This
 * module-level store hoists the running session OUT of the component tree:
 *
 * - Timestamp-based (endsAt), not tick-based: the countdown stays correct even
 *   when the Focus tab is unmounted or the whole app reloads (sessionStorage).
 * - Pub/sub + useSyncExternalStore: any mounted consumer (timer, header pill)
 *   stays in sync with the same session.
 * - Completion is driven by App.tsx's watcher, so a session that finishes
 *   while the user is on another tab still grants XP and fires a notification.
 */
import { useSyncExternalStore } from 'react';
import { Category, SchoolSubject } from '../types';

export interface ActiveFocusSession {
  category: Category;
  schoolSubject?: SchoolSubject;
  targetMinutes: number;
  startedAt: number;  // epoch ms
  endsAt: number;     // epoch ms — session is complete when now >= endsAt
  /** Remaining ms at pause time; null while running (never completed). */
  pausedRemainingMs: number | null;
  notes: string;
}

const STORAGE_KEY = 'aura_active_focus_session';

let cached: ActiveFocusSession | null = loadFromStorage();
const listeners = new Set<() => void>();

function loadFromStorage(): ActiveFocusSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveFocusSession;
    if (
      !parsed ||
      typeof parsed.endsAt !== 'number' ||
      typeof parsed.targetMinutes !== 'number' ||
      typeof parsed.startedAt !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persist() {
  try {
    if (cached) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable — in-memory session still works for this mount.
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Stable snapshot for useSyncExternalStore (null when no session). */
function getSnapshot(): ActiveFocusSession | null {
  return cached;
}

/** React hook — re-renders on every session mutation. */
export function useActiveFocusSession(): ActiveFocusSession | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getActiveFocusSession(): ActiveFocusSession | null {
  return cached;
}

export function startActiveFocusSession(params: {
  category: Category;
  schoolSubject?: SchoolSubject;
  targetMinutes: number;
  notes: string;
}): void {
  const now = Date.now();
  cached = {
    category: params.category,
    schoolSubject: params.schoolSubject,
    targetMinutes: params.targetMinutes,
    startedAt: now,
    endsAt: now + params.targetMinutes * 60_000,
    pausedRemainingMs: null,
    notes: params.notes,
  };
  persist();
  emit();
}

export function pauseActiveFocusSession(): void {
  if (!cached || cached.pausedRemainingMs != null) return;
  const remaining = Math.max(0, cached.endsAt - Date.now());
  if (remaining <= 0) return; // already over — let the watcher complete it
  cached = { ...cached, pausedRemainingMs: remaining };
  persist();
  emit();
}

export function resumeActiveFocusSession(): void {
  if (!cached || cached.pausedRemainingMs == null) return;
  cached = { ...cached, endsAt: Date.now() + (cached.pausedRemainingMs ?? 0), pausedRemainingMs: null };
  persist();
  emit();
}

export function updateActiveFocusNotes(notes: string): void {
  if (!cached || cached.notes === notes) return;
  cached = { ...cached, notes };
  persist();
  emit();
}

export function clearActiveFocusSession(): void {
  if (!cached) return;
  cached = null;
  persist();
  emit();
}

/** Remaining ms right now (0 when elapsed). Paused sessions hold their value. */
export function activeFocusRemainingMs(session: ActiveFocusSession = cached!): number {
  if (!session) return 0;
  if (session.pausedRemainingMs != null) return session.pausedRemainingMs;
  return Math.max(0, session.endsAt - Date.now());
}

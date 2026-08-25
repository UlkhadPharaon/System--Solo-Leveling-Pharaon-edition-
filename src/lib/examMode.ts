/**
 * Exam Mode (F4) — temporary recalibration for exam periods.
 *
 * When active, the System bends around reality:
 *  - study_subjects weekly targets are scaled up (default ×1.5),
 *  - physical workout targets are scaled down (default ×0.6),
 *  - a countdown banner shows the days remaining until the exam date.
 *
 * Pure module: no React, no side effects. The state lives in localStorage
 * under its own key so it survives reloads and expires on its own.
 */

export const EXAM_MODE_STORAGE_KEY = 'aura_exam_mode';

export interface ExamModeState {
  isActive: boolean;
  /** ISO date (YYYY-MM-DD) of the exam — the countdown target. */
  examDate: string | null;
  /** Short label shown in the banner (e.g. "Bac Blanc"). */
  label: string;
  /** Multiplier applied to study_subjects weekly targets while active. */
  studyMultiplier: number;
  /** Multiplier applied to physical workout targets while active. */
  workoutMultiplier: number;
}

export const DEFAULT_EXAM_STATE: ExamModeState = {
  isActive: false,
  examDate: null,
  label: 'Examens',
  studyMultiplier: 1.5,
  workoutMultiplier: 0.6,
};

/** Load persisted exam state; corrupt/foreign payloads fall back to defaults. */
export function loadExamMode(): ExamModeState {
  try {
    const raw = localStorage.getItem(EXAM_MODE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_EXAM_STATE };
    const p = JSON.parse(raw);
    return {
      isActive: p?.isActive === true,
      examDate: typeof p?.examDate === 'string' ? p.examDate : null,
      label: typeof p?.label === 'string' && p.label.trim() ? p.label.slice(0, 40) : DEFAULT_EXAM_STATE.label,
      studyMultiplier: clampMultiplier(p?.studyMultiplier, DEFAULT_EXAM_STATE.studyMultiplier),
      workoutMultiplier: clampMultiplier(p?.workoutMultiplier, DEFAULT_EXAM_STATE.workoutMultiplier),
    };
  } catch {
    return { ...DEFAULT_EXAM_STATE };
  }
}

function clampMultiplier(v: unknown, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(3, Math.max(0.1, Math.round(n * 10) / 10));
}

/** Persist the exam state. Returns false when storage refused (quota…). */
export function saveExamMode(state: ExamModeState): boolean {
  try {
    localStorage.setItem(EXAM_MODE_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/**
 * Whole days remaining until the exam date (ceil — "J-1" means tomorrow).
 * Negative once the date has passed; null when no date is set.
 */
export function examDaysRemaining(examDate: string | null): number | null {
  if (!examDate) return null;
  const target = new Date(`${examDate}T00:00:00`);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

/**
 * True when an ACTIVE exam window has ended (date strictly past).
 * The caller can use this to auto-deactivate instead of leaving a stale
 * multiplier applied forever.
 */
export function isExamWindowExpired(state: ExamModeState): boolean {
  if (!state.isActive || !state.examDate) return false;
  const days = examDaysRemaining(state.examDate);
  // The mode stays useful ON exam day (J-0), expires the day after.
  return days !== null && days < 0;
}

// ── Target scaling ───────────────────────────────────────────────────────────

interface ScalableTarget {
  id: string;
  minHours?: number;
  maxHours?: number;
  targetHours?: number;
}

/**
 * Scale a set of weekly targets according to exam mode.
 *
 * Routing rule: targets whose id is prefixed `dom:` are routed by their
 * domain's tracking type (study_subjects → up, workout_log → down); legacy
 * slices keep their historical routing (`school` → up, `morning_routine` →
 * down). Everything else passes through untouched.
 */
export function scaleTargetsForExam<T extends ScalableTarget>(
  targets: T[],
  trackingTypeOf: (id: string) => 'study_subjects' | 'workout_log' | null,
  state: ExamModeState,
): T[] {
  if (!state.isActive) return targets;
  const round = (h: number) => Math.max(1, Math.round(h * 2) / 2); // half-hour steps, floor 1h
  return targets.map((t) => {
    const kind = t.id.startsWith('dom:')
      ? trackingTypeOf(t.id)
      : t.id === 'school'
        ? 'study_subjects'
        : t.id === 'morning_routine'
          ? 'workout_log'
          : null;
    if (kind === 'study_subjects') {
      return {
        ...t,
        targetHours: round((t.targetHours ?? 0) * state.studyMultiplier),
        maxHours: round((t.maxHours ?? 0) * state.studyMultiplier),
      };
    }
    if (kind === 'workout_log') {
      return {
        ...t,
        targetHours: round((t.targetHours ?? 0) * state.workoutMultiplier),
        minHours: round((t.minHours ?? 0) * state.workoutMultiplier),
        maxHours: round((t.maxHours ?? 0) * state.workoutMultiplier),
      };
    }
    return t;
  });
}

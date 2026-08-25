import React from 'react';
import { GraduationCap, X } from './ui/PharaohIcons';
import type { ExamModeState } from '../lib/examMode';

interface ExamModeBannerProps {
  examMode: ExamModeState;
  /** Whole days until the exam (null when no date set); negative = past. */
  daysRemaining: number | null;
  onUpdate: (next: ExamModeState) => void;
}

/**
 * F4 — Exam Mode banner. Sits at the top of the dashboard while the mode is
 * active: countdown + what the System is doing to the targets, and a one-tap
 * exit so the mode never outlives its usefulness.
 */
export const ExamModeBanner: React.FC<ExamModeBannerProps> = ({ examMode, daysRemaining, onUpdate }) => {
  if (!examMode.isActive) return null;

  let countdown: string;
  if (daysRemaining === null) {
    countdown = 'date non définie';
  } else if (daysRemaining > 1) {
    countdown = `J-${daysRemaining}`;
  } else if (daysRemaining === 1) {
    countdown = 'J-1 — demain';
  } else if (daysRemaining === 0) {
    countdown = "Aujourd'hui — bonne chance";
  } else {
    countdown = 'échéance passée';
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amethyst/40 bg-amethyst/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-amethyst/20 border border-amethyst/40 shrink-0">
            <GraduationCap className="w-5 h-5 text-amethyst" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-pharaoh tracking-wide truncate">
              Mode Examen — {examMode.label}
            </p>
            <p className="font-mono text-[10px] text-pharaoh-muted mt-0.5">
              {countdown} · Cibles d'étude ×{examMode.studyMultiplier} · Entraînement ×{examMode.workoutMultiplier}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[11px] font-bold px-2 py-1 rounded-lg bg-amethyst/20 border border-amethyst/50 text-amethyst tabular-nums">
            {countdown.split(' ')[0]}
          </span>
          <button
            onClick={() => onUpdate({ ...examMode, isActive: false })}
            aria-label="Désactiver le mode examen"
            className="btn-press p-1.5 rounded-lg hover:bg-amethyst/20 text-pharaoh-muted hover:text-pharaoh transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

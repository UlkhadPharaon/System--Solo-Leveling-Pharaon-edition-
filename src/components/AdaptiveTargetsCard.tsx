import React, { useState } from 'react';
import { Sparkles, Check, X } from './ui/PharaohIcons';
import type { WeeklyCategoryTarget } from '../types';
import {
  computeRecalibrations,
  WEEKLY_SNAPSHOTS_KEY,
  MAX_SNAPSHOTS,
  type WeeklySnapshot,
} from '../lib/adaptiveTargets';

interface AdaptiveTargetsCardProps {
  categoryTargets: WeeklyCategoryTarget[];
  /** Apply a suggestion to the live target (hours are recalibrated). */
  onApplySuggestion: (targetId: string, newTarget: number) => void;
}

function loadHistory(): WeeklySnapshot[] {
  try {
    const raw = localStorage.getItem(WEEKLY_SNAPSHOTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(-MAX_SNAPSHOTS) : [];
  } catch {
    return [];
  }
}

/**
 * F4b — "The System noticed" card: proposes recalibrating a domain's weekly
 * budget when two consecutive weeks diverge from it. Dismissible; suggestions
 * recompute only when targets change (dismissals live in component state).
 */
export const AdaptiveTargetsCard: React.FC<AdaptiveTargetsCardProps> = ({ categoryTargets, onApplySuggestion }) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const suggestions = computeRecalibrations(loadHistory(), categoryTargets).filter(
    (s) => !dismissed.has(s.targetId),
  );
  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amethyst/40 bg-amethyst/5 p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-amethyst/20 border border-amethyst/50 shrink-0">
          <Sparkles className="w-4 h-4 text-amethyst" />
        </div>
        <div>
          <h3 className="font-display text-sm font-bold text-pharaoh tracking-wide">Le Système a observé vos deux dernières semaines</h3>
          <p className="font-mono text-[10px] text-pharaoh-subtle mt-0.5">Proposition de recalibrage basée sur votre rythme réel.</p>
        </div>
      </div>

      <div className="space-y-2">
        {suggestions.map((s) => (
          <div key={s.targetId} className="flex items-center justify-between gap-3 rounded-xl border border-lapis/40 bg-lapis/10 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-xs font-medium text-pharaoh truncate">{s.label}</p>
              <p className="font-mono text-[10px] text-pharaoh-subtle mt-0.5">
                {Math.round(s.avgCompletion * 100)}% de la cible en moyenne · {s.currentTarget}h →{' '}
                <strong className={s.direction === 'raise' ? 'text-emerald' : 'text-gold-bright'}>{s.suggestedTarget}h/sem</strong>
                {' '}{s.direction === 'raise' ? '(cible relevée)' : '(cible allégée)'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  onApplySuggestion(s.targetId, s.suggestedTarget);
                  setDismissed((prev) => new Set(prev).add(s.targetId));
                }}
                aria-label={`Appliquer la nouvelle cible de ${s.suggestedTarget} heures`}
                className="btn-press p-2 rounded-lg bg-emerald/20 border border-emerald/50 text-emerald hover:bg-emerald hover:text-inverse transition-all"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDismissed((prev) => new Set(prev).add(s.targetId))}
                aria-label="Ignorer cette suggestion"
                className="btn-press p-2 rounded-lg bg-lapis/40 border border-lapis text-pharaoh-muted hover:text-pharaoh transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

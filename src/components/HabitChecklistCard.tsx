import React from 'react';
import { playSfx } from '../lib/sfx';
import { CheckCircle2, Circle, Flame } from './ui/PharaohIcons';
import { Domain, HabitCheck } from '../types';
import { styleForDomain } from '../lib/domains';

interface HabitChecklistCardProps {
  habitDomains: Domain[];
  checks: HabitCheck[];
  today: string; // YYYY-MM-DD
  onToggleCheck: (domain: Domain) => void;
}

/**
 * habit_checklist module — the lightest tracking type. A simple daily check
 * card on the Dashboard for pure-habit domains (méditation, lecture, sommeil
 * régulier…). XP is granted via the existing XP_RATES table (habitCheckXp).
 */
export const HabitChecklistCard: React.FC<HabitChecklistCardProps> = ({
  habitDomains,
  checks,
  today,
  onToggleCheck,
}) => {
  if (habitDomains.length === 0) return null;

  const isChecked = (domainId: string) =>
    checks.some((c) => c.domainId === domainId && c.date === today && c.done);

  const streakFor = (domainId: string) => {
    // count consecutive days back from today (today counts only if checked)
    const dates = new Set(checks.filter((c) => c.domainId === domainId && c.done).map((c) => c.date));
    let streak = 0;
    const d = new Date(today);
    for (;;) {
      const key = d.toISOString().split('T')[0];
      if (dates.has(key)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  };

  const allDone = habitDomains.every((dom) => isChecked(dom.id));

  return (
    <div className="bg-panel hover-lift rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-wide text-pharaoh">Habitudes du Jour</h3>
        </div>
        {allDone && (
          <span className="px-2.5 py-1 rounded-full bg-emerald/15 border border-emerald/50 text-emerald font-mono text-[10px] uppercase">
            Complet
          </span>
        )}
      </div>

      <div className="space-y-2">
        {habitDomains.map((domain) => {
          const style = styleForDomain(domain);
          const done = isChecked(domain.id);
          const streak = streakFor(domain.id);
          return (
            <button
              key={domain.id}
              onClick={() => { playSfx('ui-tick', 0.7); onToggleCheck(domain); }}
              className={`btn-press w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                done
                  ? 'bg-emerald/15 border-emerald/50'
                  : 'bg-lapis/40 border-lapis hover:border-gold'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-pharaoh-subtle shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${done ? 'text-emerald' : 'text-pharaoh'}`}>
                    {domain.label}
                  </p>
                  {domain.goal_text && (
                    <p className="text-[11px] text-pharaoh-muted truncate">{domain.goal_text}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0" style={{ color: style.color }}>
                {streak > 0 && (
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Flame className="w-3.5 h-3.5" /> {streak}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { CheckCircle2, Circle, Flame } from 'lucide-react';
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
    <div className="bg-card border border-soft rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 accent-cyan" />
          <h3 className="serif text-lg italic text-white">Habitudes du Jour</h3>
        </div>
        {allDone && (
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 mono text-[10px] uppercase">
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
              onClick={() => onToggleCheck(domain)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                done
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-cyan-950/40 border-soft hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${done ? 'text-emerald-300' : 'text-white'}`}>
                    {domain.label}
                  </p>
                  {domain.goal_text && (
                    <p className="text-[11px] text-slate-400 truncate">{domain.goal_text}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0" style={{ color: style.color }}>
                {streak > 0 && (
                  <span className="flex items-center gap-1 mono text-[11px]">
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

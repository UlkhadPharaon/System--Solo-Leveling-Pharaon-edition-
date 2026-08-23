/**
 * WeeklyReportCard — "Palier de la Semaine".
 * Rendered at the top of the Progress Dashboard (weekly_targets tab).
 */
import React from 'react';
import { Flame, Clock, TrendingUp, Crown, Calendar } from './ui/PharaohIcons';
import { WeeklyReport } from '../lib/weeklyReport';

export const WeeklyReportCard: React.FC<{ report: WeeklyReport }> = ({ report }) => {
  const fmtH = (n: number) => `${Math.round(n * 10) / 10}h`;

  return (
    <section
      aria-label="Rapport hebdomadaire"
      className="relative overflow-hidden rounded-xl bg-panel border border-lapis p-4 md:p-6 space-y-5 anim-in"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gold/8 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg md:text-xl font-light text-gradient-gold tracking-wide flex items-center gap-2">
          <Crown size={18} /> Palier de la Semaine
        </h3>
        <span className="font-mono text-[10px] text-pharaoh-subtle flex items-center gap-1.5">
          <Calendar size={12} /> {report.weekLabel}
        </span>
      </div>

      {/* KPI row */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: TrendingUp,
            value: `+${report.xpGained.toLocaleString('fr-FR')}`,
            label: 'XP gagnés',
            color: 'text-gold-bright',
          },
          {
            icon: Flame,
            value: `${report.currentStreak} j`,
            label: `Série (record ${report.bestStreak})`,
            color: 'text-blood',
          },
          {
            icon: Clock,
            value: `${Math.floor(report.focusMinutes / 60)}h${String(report.focusMinutes % 60).padStart(2, '0')}`,
            label: `${report.focusSessions} session${report.focusSessions > 1 ? 's' : ''} focus`,
            color: 'text-amethyst',
          },
          {
            icon: Crown,
            value: report.blocksTotal > 0 ? `${Math.round((report.blocksCompleted / report.blocksTotal) * 100)}%` : '—',
            label: 'Blocs accomplis',
            color: 'text-emerald',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl bg-obsidian/60 border border-lapis-border p-3 text-center">
            <kpi.icon size={16} className={`mx-auto mb-1.5 ${kpi.color}`} />
            <p className={`font-display text-xl md:text-2xl font-light ${kpi.color}`}>{kpi.value}</p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-pharaoh-subtle mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Domain hours vs targets */}
      {report.domains.length > 0 && (
        <div className="relative z-10 space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-pharaoh-subtle">Heures par domaine</p>
          {report.domains.slice(0, 5).map((d) => {
            const pct = Math.min(100, Math.round((d.hours / Math.max(1, d.targetHours)) * 100));
            return (
              <div key={d.label}>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className="text-pharaoh-muted truncate max-w-[70%]">{d.label}</span>
                  <span className={d.hours >= d.targetHours ? 'text-emerald' : 'text-pharaoh-subtle'}>
                    {fmtH(d.hours)} / {fmtH(d.targetHours)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-obsidian overflow-hidden border border-lapis-border/50">
                  <div
                    className={`h-full transition-all duration-500 ${
                      d.hours >= d.targetHours ? 'bg-emerald' : 'bg-gradient-to-r from-gold-dim to-gold'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

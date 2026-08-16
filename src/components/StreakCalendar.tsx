import React, { useState } from 'react';
import { StreakDayRecord } from '../types';
import {
  Flame,
  CheckCircle2,
  Calendar as CalendarIcon,
  Medal,
  Sparkles,
  Filter as ListFilter,
  Grid,
  X,
  Check,
  TrendingUp,
  Clock,
  ChevronRight
} from './ui/PharaohIcons';

interface StreakCalendarProps {
  streakRecords: StreakDayRecord[];
  currentStreak: number;
  onToggleDayCompletion?: (id: string) => void;
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({
  streakRecords,
  currentStreak,
  onToggleDayCompletion,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDayRecord, setSelectedDayRecord] = useState<StreakDayRecord | null>(null);

  // Calculated Metrics
  const totalDays = (streakRecords || []).length;
  const perfectDaysCount = (streakRecords || []).filter((r) => r.allGoalsMet).length;
  const perfectPercentage = totalDays > 0 ? Math.round((perfectDaysCount / totalDays) * 100) : 0;

  const dayNameShortFrench: Record<string, string> = {
    Monday: 'LUN',
    Tuesday: 'MAR',
    Wednesday: 'MER',
    Thursday: 'JEU',
    Friday: 'VEN',
    Saturday: 'SAM',
    Sunday: 'DIM',
  };

  const dayNameFrench: Record<string, string> = {
    Monday: 'Lundi',
    Tuesday: 'Mardi',
    Wednesday: 'Mercredi',
    Thursday: 'Jeudi',
    Friday: 'Vendredi',
    Saturday: 'Samedi',
    Sunday: 'Dimanche',
  };

  return (
    <div className="bg-panel border border-lapis-border rounded-xl p-6 space-y-6 anim-in">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-lapis-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-xl text-[10px] font-mono tracking-wide font-medium bg-gold/10 text-gold border border-gold/40 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-gold" />
              Suivi des Séries & Objectifs
            </span>
            <span className="px-2 py-0.5 rounded-xl text-[9px] font-mono uppercase font-bold bg-gold text-obsidian flex items-center gap-1">
              <Medal className="w-3 h-3" />
              Série de {currentStreak} Jours Active
            </span>
          </div>

          <h3 className="font-display text-2xl font-light text-pharaoh tracking-wide">
            Historique de Réalisation des Objectifs Quotidiens
          </h3>
          <p className="text-xs text-pharaoh-muted mt-1 max-w-2xl">
            Registre visuel de vos performances. Les jours surlignés en or/émeraude confirment 100% d'objectifs atteints sur la routine et les projets.
          </p>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-lapis p-1 rounded-xl border border-lapis-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`btn-press px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-gold text-obsidian font-semibold'
                  : 'text-pharaoh-muted hover:text-pharaoh'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Calendrier Grille</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`btn-press px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-gold text-obsidian font-semibold'
                  : 'text-pharaoh-muted hover:text-pharaoh'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Liste Chronologique</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
        <div className="p-3.5 rounded-xl bg-lapis border border-lapis-border flex items-center justify-between">
          <div>
            <span className="font-mono text-[9px] tracking-wide font-medium text-pharaoh-muted block mb-0.5">Série Active</span>
            <div className="font-display text-2xl font-light text-gold-bright flex items-center gap-1.5">
              <span>{currentStreak}</span>
              <span className="text-xs font-sans opacity-70">Jours</span>
            </div>
          </div>
          <Flame className="w-6 h-6 text-gold opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl bg-lapis border border-lapis-border flex items-center justify-between">
          <div>
            <span className="font-mono text-[9px] tracking-wide font-medium text-pharaoh-muted block mb-0.5">Taux Objectifs 100%</span>
            <div className="font-display text-2xl font-light text-emerald">
              {perfectPercentage}%
            </div>
          </div>
          <TrendingUp className="w-6 h-6 text-emerald opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl bg-lapis border border-lapis-border flex items-center justify-between">
          <div>
            <span className="font-mono text-[9px] tracking-wide font-medium text-pharaoh-muted block mb-0.5">Jours Parfaits</span>
            <div className="font-display text-2xl font-light text-gold-bright">
              {perfectDaysCount} / {totalDays}
            </div>
          </div>
          <Sparkles className="w-6 h-6 text-gold opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl bg-lapis border border-lapis-border flex items-center justify-between">
          <div>
            <span className="font-mono text-[9px] tracking-wide font-medium text-pharaoh-muted block mb-0.5">Période Suivie</span>
            <div className="font-display text-xl font-light text-pharaoh">
              14 Derniers Jours
            </div>
          </div>
          <CalendarIcon className="w-6 h-6 text-amethyst opacity-80" />
        </div>
      </div>

      {/* Grid Calendar View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 stagger">
          {streakRecords.map((record) => {
            const isPerfect = record.allGoalsMet;
            const dateObj = new Date(record.date);
            const formattedDateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
            const shortDay = dayNameShortFrench[record.dayName] || record.dayName.slice(0, 3);

            return (
              <div
                key={record.id}
                onClick={() => setSelectedDayRecord(record)}
                className={`group relative p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between min-h-[110px] ${
                  isPerfect
                    ? 'bg-gradient-to-b from-gold/15 to-obsidian-elevated border-gold/60 shadow-gold hover:scale-[1.02]'
                    : 'bg-lapis border-lapis-border hover:border-lapis-light'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] uppercase font-bold text-pharaoh">
                      {shortDay}
                    </span>
                    <span className="font-mono text-[9px] text-pharaoh-muted">
                      {formattedDateStr}
                    </span>
                  </div>

                  <div className="mt-1">
                    {isPerfect ? (
                      <div className="flex items-center gap-1 text-gold-bright font-semibold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-gold-bright shrink-0" />
                        <span className="font-mono text-[9px] uppercase tracking-tighter">100% ATTEINT</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-pharaoh-muted text-xs">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-gold-dim" />
                        <span className="font-mono text-[9px] uppercase">{record.completionPercentage}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] text-pharaoh-muted line-clamp-2 italic leading-tight group-hover:text-pharaoh transition-colors">
                    {record.highlights || `${record.completedBlocksCount}/${record.totalBlocksCount} tâches faites`}
                  </p>

                  <div className="mt-2 flex items-center justify-between pt-1 border-t border-lapis-border/40">
                    <span className="font-mono text-[8px] tracking-wide font-medium text-pharaoh-muted">
                      {record.completedBlocksCount}/{record.totalBlocksCount} Objectifs
                    </span>
                    {isPerfect && (
                      <span className="flex items-center text-[9px] text-gold">
                        <Flame className="w-3 h-3 text-gold" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline List View */}
      {viewMode === 'list' && (
        <div className="space-y-2.5 stagger">
          {streakRecords.map((record) => {
            const isPerfect = record.allGoalsMet;
            const fullDayName = dayNameFrench[record.dayName] || record.dayName;

            return (
              <div
                key={record.id}
                onClick={() => setSelectedDayRecord(record)}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all ${
                  isPerfect
                    ? 'bg-lapis border-gold-dim hover:border-gold'
                    : 'bg-obsidian-elevated border-lapis-border hover:border-lapis-light'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`p-2 rounded-xl border shrink-0 ${
                    isPerfect 
                      ? 'bg-gold/10 border-gold/60 text-gold-bright' 
                      : 'bg-obsidian border-lapis-border text-pharaoh-muted'
                  }`}>
                    {isPerfect ? (
                      <CheckCircle2 className="w-5 h-5 text-gold-bright" />
                    ) : (
                      <Clock className="w-5 h-5 text-pharaoh-muted" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-base font-light text-pharaoh tracking-wide">
                        {fullDayName}, {record.date}
                      </h4>
                      {isPerfect ? (
                        <span className="px-2 py-0.5 rounded-xl text-[9px] font-mono uppercase font-bold bg-gold text-obsidian">
                          Tous Objectifs Atteints ✨
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-xl text-[9px] font-mono uppercase bg-lapis text-pharaoh-muted border border-lapis-border">
                          {record.completionPercentage}% Effectué
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-pharaoh-muted mt-0.5 italic">
                      {record.highlights}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-lapis-border pt-2 sm:pt-0">
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-pharaoh-muted block">Suivi des Tâches</span>
                    <strong className="font-mono text-xs text-pharaoh">{record.completedBlocksCount} / {record.totalBlocksCount}</strong>
                  </div>

                  <ChevronRight className="w-4 h-4 text-pharaoh-subtle" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Day Details Modal */}
      {selectedDayRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-obsidian-elevated border border-gold rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedDayRecord(null)}
              className="btn-press absolute top-4 right-4 p-1.5 rounded-xl bg-lapis text-pharaoh-muted hover:text-pharaoh border border-lapis-border"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-xl text-[10px] font-mono tracking-wide font-medium bg-gold/10 text-gold border border-gold/40 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-gold" />
                  Résumé de la Journée
                </span>
                {selectedDayRecord.allGoalsMet && (
                  <span className="px-2 py-0.5 rounded-xl text-[9px] font-mono uppercase font-bold bg-emerald text-obsidian">
                    Tous Objectifs Confirmés
                  </span>
                )}
              </div>

              <h3 className="font-display text-2xl font-light text-pharaoh tracking-wide">
                {dayNameFrench[selectedDayRecord.dayName] || selectedDayRecord.dayName}, {selectedDayRecord.date}
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-lapis border border-lapis-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-pharaoh-muted">Score de Réalisation</span>
                <span className="font-display text-xl text-gold-bright font-light">
                  {selectedDayRecord.completedBlocksCount} / {selectedDayRecord.totalBlocksCount} tâches ({selectedDayRecord.completionPercentage}%)
                </span>
              </div>

              <div className="w-full bg-obsidian h-2 rounded-none overflow-hidden border border-lapis-border">
                <div
                  className="bg-gold h-full transition-all duration-300"
                  style={{ width: `${selectedDayRecord.completionPercentage}%` }}
                />
              </div>

              <p className="text-xs text-pharaoh-muted italic leading-relaxed pt-2 border-t border-lapis-border">
                "{selectedDayRecord.highlights}"
              </p>
            </div>

            {selectedDayRecord.completedCategories && (
              <div>
                <h4 className="font-mono text-[10px] tracking-wide font-medium text-pharaoh-muted mb-2">
                  Domaines de Focus Complétés
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDayRecord.completedCategories.map((cat) => (
                    <span
                      key={cat}
                      className="px-2.5 py-1 rounded-xl text-[10px] font-mono uppercase bg-lapis text-pharaoh-muted border border-lapis-border"
                    >
                      {cat.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-lapis-border flex items-center justify-between gap-3">
              {onToggleDayCompletion && (
                <button
                  onClick={() => {
                    onToggleDayCompletion(selectedDayRecord.id);
                    setSelectedDayRecord((prev) =>
                      prev
                        ? {
                            ...prev,
                            allGoalsMet: !prev.allGoalsMet,
                            completionPercentage: !prev.allGoalsMet ? 100 : 80,
                          }
                        : null
                    );
                  }}
                  className="btn-press py-2 px-4 rounded-xl bg-lapis hover:bg-lapis-light text-gold-bright border border-gold/50 font-mono text-xs uppercase flex items-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Basculer "Tous Objectifs Atteints"</span>
                </button>
              )}

              <button
                onClick={() => setSelectedDayRecord(null)}
                className="btn-press py-2 px-4 rounded-xl bg-gold text-obsidian font-semibold font-mono text-xs uppercase ml-auto"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

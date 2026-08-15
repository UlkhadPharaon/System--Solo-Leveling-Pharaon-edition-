import React, { useState } from 'react';
import { StreakDayRecord } from '../types';
import { 
  Flame, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  Award, 
  Sparkles, 
  ListFilter, 
  Grid, 
  X, 
  Check, 
  TrendingUp, 
  Clock,
  ChevronRight
} from 'lucide-react';

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
    <div className="bg-card border border-soft rounded-xl p-6 space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-soft pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-xl text-[10px] mono tracking-wide font-medium bg-cyan-400/10 text-cyan-400 border border-cyan flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 accent-cyan" />
              Suivi des Séries & Objectifs
            </span>
            <span className="px-2 py-0.5 rounded-xl text-[9px] mono uppercase font-bold bg-cyan-400 text-black flex items-center gap-1">
              <Award className="w-3 h-3" />
              Série de {currentStreak} Jours Active
            </span>
          </div>

          <h3 className="serif text-2xl font-light italic text-white tracking-tight">
            Historique de Réalisation des Objectifs Quotidiens
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Registre visuel de vos performances. Les jours surlignés en or/émeraude confirment 100% d'objectifs atteints sur la routine et les projets.
          </p>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-cyan-950/40 p-1 rounded-xl border border-soft">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl text-xs mono flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-cyan-400 text-black font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Calendrier Grille</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl text-xs mono flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-cyan-400 text-black font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Liste Chronologique</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-soft flex items-center justify-between">
          <div>
            <span className="mono text-[9px] tracking-wide font-medium text-slate-400 block mb-0.5">Série Active</span>
            <div className="serif text-2xl font-light text-cyan-400 flex items-center gap-1.5">
              <span>{currentStreak}</span>
              <span className="text-xs font-sans opacity-70">Jours</span>
            </div>
          </div>
          <Flame className="w-6 h-6 text-cyan-400 opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-soft flex items-center justify-between">
          <div>
            <span className="mono text-[9px] tracking-wide font-medium text-slate-400 block mb-0.5">Taux Objectifs 100%</span>
            <div className="serif text-2xl font-light text-emerald-400">
              {perfectPercentage}%
            </div>
          </div>
          <TrendingUp className="w-6 h-6 text-emerald-400 opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-soft flex items-center justify-between">
          <div>
            <span className="mono text-[9px] tracking-wide font-medium text-slate-400 block mb-0.5">Jours Parfaits</span>
            <div className="serif text-2xl font-light text-amber-400">
              {perfectDaysCount} / {totalDays}
            </div>
          </div>
          <Sparkles className="w-6 h-6 text-amber-400 opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-soft flex items-center justify-between">
          <div>
            <span className="mono text-[9px] tracking-wide font-medium text-slate-400 block mb-0.5">Période Suivie</span>
            <div className="serif text-xl font-light text-white">
              14 Derniers Jours
            </div>
          </div>
          <CalendarIcon className="w-6 h-6 text-purple-400 opacity-80" />
        </div>
      </div>

      {/* Grid Calendar View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
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
                    ? 'bg-gradient-to-b from-cyan-500/15 to-[#1A1D24] border-cyan shadow-sm hover:scale-[1.02]'
                    : 'bg-cyan-950/40 border-soft hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="mono text-[10px] uppercase font-bold text-slate-300">
                      {shortDay}
                    </span>
                    <span className="mono text-[9px] text-slate-400">
                      {formattedDateStr}
                    </span>
                  </div>

                  <div className="mt-1">
                    {isPerfect ? (
                      <div className="flex items-center gap-1 text-cyan-400 font-semibold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="mono text-[9px] uppercase tracking-tighter">100% ATTEINT</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                        <span className="mono text-[9px] uppercase">{record.completionPercentage}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] text-slate-400 line-clamp-2 italic leading-tight group-hover:text-slate-200 transition-colors">
                    {record.highlights || `${record.completedBlocksCount}/${record.totalBlocksCount} tâches faites`}
                  </p>

                  <div className="mt-2 flex items-center justify-between pt-1 border-t border-soft/40">
                    <span className="mono text-[8px] tracking-wide font-medium text-slate-400">
                      {record.completedBlocksCount}/{record.totalBlocksCount} Objectifs
                    </span>
                    {isPerfect && (
                      <span className="flex items-center text-[9px] text-cyan-400">
                        <Flame className="w-3 h-3 fill-gold accent-cyan" />
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
        <div className="space-y-2.5">
          {streakRecords.map((record) => {
            const isPerfect = record.allGoalsMet;
            const fullDayName = dayNameFrench[record.dayName] || record.dayName;

            return (
              <div
                key={record.id}
                onClick={() => setSelectedDayRecord(record)}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all ${
                  isPerfect
                    ? 'bg-cyan-950/40 border-cyan/60 hover:border-cyan'
                    : 'bg-[#1a1d24]/60 border-soft hover:border-slate-500'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`p-2 rounded-xl border shrink-0 ${
                    isPerfect 
                      ? 'bg-cyan-400/10 border-cyan text-cyan-400' 
                      : 'bg-black/30 border-soft text-slate-400'
                  }`}>
                    {isPerfect ? (
                      <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="serif text-base font-light italic text-white">
                        {fullDayName}, {record.date}
                      </h4>
                      {isPerfect ? (
                        <span className="px-2 py-0.5 rounded-xl text-[9px] mono uppercase font-bold bg-cyan-400 text-black">
                          Tous Objectifs Atteints ✨
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-xl text-[9px] mono uppercase bg-slate-800 text-slate-400 border border-slate-700">
                          {record.completionPercentage}% Effectué
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 italic">
                      {record.highlights}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-soft pt-2 sm:pt-0">
                  <div className="text-right">
                    <span className="mono text-[10px] text-slate-400 block">Suivi des Tâches</span>
                    <strong className="mono text-xs text-white">{record.completedBlocksCount} / {record.totalBlocksCount}</strong>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Day Details Modal */}
      {selectedDayRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#14161C] border border-cyan rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedDayRecord(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-cyan-950/40 text-slate-400 hover:text-white border border-soft"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-xl text-[10px] mono tracking-wide font-medium bg-cyan-400/10 text-cyan-400 border border-cyan flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 accent-cyan" />
                  Résumé de la Journée
                </span>
                {selectedDayRecord.allGoalsMet && (
                  <span className="px-2 py-0.5 rounded-xl text-[9px] mono uppercase font-bold bg-emerald-500 text-black">
                    Tous Objectifs Confirmés
                  </span>
                )}
              </div>

              <h3 className="serif text-2xl font-light italic text-white">
                {dayNameFrench[selectedDayRecord.dayName] || selectedDayRecord.dayName}, {selectedDayRecord.date}
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-cyan-950/40 border border-soft space-y-3">
              <div className="flex items-center justify-between">
                <span className="mono text-[10px] uppercase text-slate-400">Score de Réalisation</span>
                <span className="serif text-xl accent-cyan font-light">
                  {selectedDayRecord.completedBlocksCount} / {selectedDayRecord.totalBlocksCount} tâches ({selectedDayRecord.completionPercentage}%)
                </span>
              </div>

              <div className="w-full bg-white/5 h-2 rounded-none overflow-hidden">
                <div
                  className="bg-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${selectedDayRecord.completionPercentage}%` }}
                />
              </div>

              <p className="text-xs text-slate-300 italic leading-relaxed pt-2 border-t border-soft">
                "{selectedDayRecord.highlights}"
              </p>
            </div>

            {selectedDayRecord.completedCategories && (
              <div>
                <h4 className="mono text-[10px] tracking-wide font-medium text-slate-400 mb-2">
                  Domaines de Focus Complétés
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDayRecord.completedCategories.map((cat) => (
                    <span
                      key={cat}
                      className="px-2.5 py-1 rounded-xl text-[10px] mono uppercase bg-cyan-950/40 text-slate-300 border border-soft"
                    >
                      {cat.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-soft flex items-center justify-between gap-3">
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
                  className="py-2 px-4 rounded-xl bg-cyan-950/40 hover:bg-[#222630] text-cyan-400 border border-cyan mono text-xs uppercase flex items-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Basculer "Tous Objectifs Atteints"</span>
                </button>
              )}

              <button
                onClick={() => setSelectedDayRecord(null)}
                className="py-2 px-4 rounded-xl bg-cyan-400 text-black font-semibold mono text-xs uppercase ml-auto"
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

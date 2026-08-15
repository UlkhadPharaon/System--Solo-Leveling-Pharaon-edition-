import React, { useState } from 'react';
import { WeeklyCategoryTarget, SubjectGoal, UserPersonalization, LessonStatus, StreakDayRecord, Domain } from '../types';
import { domainsForTracking } from '../lib/domains';
import { StreakCalendar } from './StreakCalendar';
import { formatHoursDecimal, getCategoryStyle } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie,
  Legend,
  CartesianGrid
} from 'recharts';
import { 
  Target, 
  Code, 
  Film, 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  Circle,
  Plus, 
  Minus,
  Sparkles,
  Award,
  Sliders,
  Calendar
} from 'lucide-react';

interface ProgressDashboardProps {
  categoryTargets: WeeklyCategoryTarget[];
  subjectGoals: SubjectGoal[];
  personalization: UserPersonalization;
  streakRecords?: StreakDayRecord[];
  currentStreak?: number;
  onUpdateCategoryHours: (id: string, delta: number) => void;
  onUpdateSubjectHours: (subjectKey: string, delta: number) => void;
  onOpenFocusTimer: () => void;
  /** User domains (onboarding v2) — legacy sections render only when the
   *  profile actually declared these domains. */
  domains?: Domain[];
  openPersonalizationModal?: () => void;
  onUpdatePersonalization?: (updated: UserPersonalization) => void;
  onToggleDayStreak?: (id: string) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  categoryTargets,
  subjectGoals,
  personalization,
  streakRecords = [],
  currentStreak = 7,
  onUpdateCategoryHours,
  onUpdateSubjectHours,
  onOpenFocusTimer,
  openPersonalizationModal,
  onUpdatePersonalization,
  onToggleDayStreak,
  domains = [],
}) => {
  // Onboarding v2: legacy editorial sections (cinema/bangre milestones, fixed
  // school lessons) only render for profiles that actually declared these
  // domains — i.e. the migrated legacy instance. New users get domain-driven
  // content instead.
  const hasLegacyCinema = domains.length === 0 || domains.some((d) => d.legacyCategory === 'cinema');
  const hasLegacyBangre = domains.length === 0 || domains.some((d) => d.legacyCategory === 'bangre_neo');
  const studyDomains = domainsForTracking(domains, 'study_subjects');
  const hasLegacySchool = domains.length === 0 || domains.some((d) => d.legacyCategory === 'school');
  // Dynamic weekly-target summary — domain-driven for v2 profiles, legacy
  // text otherwise (never hardcoded Bangre Neo/Cinéma for new users).
  const domainMode = domains.length > 0;
  const weeklySummary = domainMode
    ? domains
        .map((d) => `${d.label} (${d.weekly_time_budget ?? '-'}h)`)
        .join(', ')
    : null;
  const bangreNeo = categoryTargets.find((c) => c.id === 'bangre_neo');
  const cinema = categoryTargets.find((c) => c.id === 'cinema');
  const school = categoryTargets.find((c) => c.id === 'school');

  // Cinema Milestone Toggle
  const handleToggleCinemaMilestone = (id: string) => {
    if (!onUpdatePersonalization) return;
    const updatedMilestones = personalization.cinemaProject.milestones.map((m) =>
      m.id === id ? { ...m, isCompleted: !m.isCompleted } : m
    );
    onUpdatePersonalization({
      ...personalization,
      cinemaProject: {
        ...personalization.cinemaProject,
        milestones: updatedMilestones,
      },
    });
  };

  // Bangre Neo Milestone Toggle
  const handleToggleBangreMilestone = (id: string) => {
    if (!onUpdatePersonalization) return;
    const updatedMilestones = personalization.bangreLab.milestones.map((m) =>
      m.id === id ? { ...m, isCompleted: !m.isCompleted } : m
    );
    onUpdatePersonalization({
      ...personalization,
      bangreLab: {
        ...personalization.bangreLab,
        milestones: updatedMilestones,
      },
    });
  };

  // Academic Lesson Status Toggle
  const handleLessonStatusChange = (id: string, newStatus: LessonStatus) => {
    if (!onUpdatePersonalization) return;
    const updatedLessons = personalization.lessons.map((l) =>
      l.id === id ? { ...l, status: newStatus } : l
    );
    onUpdatePersonalization({
      ...personalization,
      lessons: updatedLessons,
    });
  };

  // Filter for Category Chart
  const [chartCategoryFilter, setChartCategoryFilter] = useState<'core' | 'all'>('core');

  // Chart Data Preparation for Categories
  const filteredCategories = categoryTargets.filter((c) => {
    if (chartCategoryFilter === 'core') {
      const legacyCore = c.id === 'bangre_neo' || c.id === 'cinema' || c.id === 'school';
      return legacyCore || (typeof c.id === 'string' && c.id.startsWith('dom:'));
    }
    return true;
  });

  const categoryChartData = filteredCategories.map((c) => {
    const displayName =
      typeof c.id === 'string' && c.id.startsWith('dom:')
        ? getCategoryStyle(c.id).label
        : c.id === 'bangre_neo'
        ? 'Bangre Neo Lab'
        : c.id === 'cinema'
        ? 'Cinéma & Films'
        : c.id === 'school'
        ? 'Études Scolaires'
        : c.label.replace('Routine & Fitness', 'Forme').replace('Work', '').trim();

    return {
      id: c.id,
      name: displayName,
      fullName: c.label,
      'Heures Réalisées': Number(c.completedHours.toFixed(1)),
      'Heures Cibles': c.targetHours,
      minHours: c.minHours,
      maxHours: c.maxHours,
      color: c.color || '#00D4FF',
      percentage: c.targetHours > 0 ? Math.min(100, Math.round((c.completedHours / c.targetHours) * 100)) : 0,
    };
  });

  const subjectChartData = subjectGoals.map((s) => ({
    name: s.name,
    value: Number(s.completedHours.toFixed(1)),
    target: s.targetWeeklyHours,
    color: s.color,
  }));

  const CustomCategoryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#051428] border border-cyan p-3.5 rounded-xl shadow-2xl space-y-2 min-w-[210px] z-50">
          <div className="flex items-center justify-between border-b border-soft pb-1.5">
            <span className="serif text-sm font-light text-white">{data.fullName || label}</span>
            <span
              className={`mono text-[10px] font-bold px-1.5 py-0.5 rounded-xl ${
                data.percentage >= 100
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-cyan-400/10 text-cyan-400 border border-cyan/40'
              }`}
            >
              {data.percentage}%
            </span>
          </div>

          <div className="space-y-1 text-xs mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-none inline-block bg-cyan-400"></span>
                Réalisé :
              </span>
              <strong className="text-emerald-400 text-sm font-light">{data['Heures Réalisées']} h</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-none inline-block bg-slate-600 border border-slate-400"></span>
                Cible :
              </span>
              <strong className="text-slate-200">{data['Heures Cibles']} h</strong>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-soft/50 text-[10px]">
              <span className="text-slate-400">Plage Cible :</span>
              <span className="text-cyan-400 font-semibold">{data.minHours} - {data.maxHours}h / sem</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Target Progress Banner */}
      <div className="relative overflow-hidden rounded-xl bg-card border border-soft p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-xl text-[10px] mono tracking-wide font-medium bg-cyan-400/10 text-cyan-400 border border-cyan flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 accent-cyan" />
                Objectifs Hebdomadaires de Performance
              </span>
            </div>
            <h2 className="serif text-3xl md:text-4xl font-light italic text-white tracking-tight">
              Allocation & Progression Hebdomadaire
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
              {domainMode
                ? `Suivez vos objectifs hebdomadaires en temps réel : ${weeklySummary}.`
                : 'Suivez vos objectifs hebdomadaires en temps réel : Bangre Neo (15-20h), Cinéma (10-15h), Études (5-10h avec SVT, Maths, PC, Hist-Géo), et Travail Incontournable.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {openPersonalizationModal && (
              <button
                onClick={openPersonalizationModal}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-950/40 hover:bg-[#222630] text-cyan-400 border border-cyan mono text-xs tracking-wide font-medium transition-all"
              >
                <Sliders className="w-4 h-4 accent-cyan" />
                <span>Personnaliser le Programme</span>
              </button>
            )}

            <button
              onClick={onOpenFocusTimer}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-card-hover text-cyan-400 border border-cyan mono text-xs tracking-wide font-medium transition-all"
            >
              <Sparkles className="w-4 h-4 accent-cyan" />
              <span>Lancer une Session Focus</span>
            </button>
          </div>
        </div>
      </div>

      {/* Streak History Visual Calendar Tracker */}
      {streakRecords.length > 0 && (
        <StreakCalendar
          streakRecords={streakRecords}
          currentStreak={currentStreak}
          onToggleDayCompletion={onToggleDayStreak}
        />
      )}

      {/* Core Weekly Targets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Bangre Neo Lab */}
        {bangreNeo && (() => {
          const style = getCategoryStyle('bangre_neo');
          return (
            <div className={`relative overflow-hidden rounded-xl ${style.cardBg} ${style.borderLeft} p-6 flex flex-col justify-between space-y-4 transition-all`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${style.iconBg}`}>
                    <Code className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`mono text-[10px] tracking-wide font-medium font-semibold ${style.textColor}`}>
                      Tech Prioritaire
                    </span>
                    <h3 className="serif text-xl font-light italic text-white">Bangre Neo Lab</h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="mono text-[10px] uppercase opacity-60 block">Objectif</span>
                  <span className={`mono text-xs font-semibold ${style.textColor}`}>
                    15h - 20h / sem
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className={`serif text-3xl font-light italic ${style.textColor}`}>
                    {formatHoursDecimal(bangreNeo.completedHours)}
                  </span>
                  <span className="mono text-[10px] opacity-60">
                    Cible : {bangreNeo.minHours}h - {bangreNeo.maxHours}h
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/5 h-2 overflow-hidden rounded-none">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (bangreNeo.completedHours / bangreNeo.maxHours) * 100)}%`,
                      backgroundColor: style.barColor,
                    }}
                  />
                </div>

                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  {bangreNeo.completedHours >= bangreNeo.minHours
                    ? 'Objectif minimum de 15h atteint. Continuez vers les 20h.'
                    : `Reste pour l’objectif min : ${(bangreNeo.minHours - bangreNeo.completedHours).toFixed(1)} heures.`}
                </p>
              </div>

              {/* Quick +/- controls */}
              <div className="flex items-center justify-between pt-3 border-t border-violet-500/20">
                <span className="mono text-[10px] tracking-wide font-medium opacity-60">Ajuster les Heures</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateCategoryHours('bangre_neo', -0.5)}
                    className="p-1 rounded-xl bg-cyan-950/40 hover:bg-[#222630] text-slate-300 border border-soft"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="mono text-xs text-slate-200 w-8 text-center">
                    0.5h
                  </span>
                  <button
                    onClick={() => onUpdateCategoryHours('bangre_neo', 0.5)}
                    className={`p-1 rounded-xl border ${style.badgeBg}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 2. Movies & Cinema */}
        {cinema && (() => {
          const style = getCategoryStyle('cinema');
          return (
            <div className={`relative overflow-hidden rounded-xl ${style.cardBg} ${style.borderLeft} p-6 flex flex-col justify-between space-y-4 transition-all`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${style.iconBg}`}>
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`mono text-[10px] tracking-wide font-medium font-semibold ${style.textColor}`}>
                      Scénarios & Films
                    </span>
                    <h3 className="serif text-xl font-light italic text-white">Cinéma & Scénarios</h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="mono text-[10px] uppercase opacity-60 block">Objectif</span>
                  <span className={`mono text-xs font-semibold ${style.textColor}`}>
                    10h - 15h / sem
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className={`serif text-3xl font-light italic ${style.textColor}`}>
                    {formatHoursDecimal(cinema.completedHours)}
                  </span>
                  <span className="mono text-[10px] opacity-60">
                    Cible : {cinema.minHours}h - {cinema.maxHours}h
                  </span>
                </div>

                <div className="w-full bg-white/5 h-2 overflow-hidden rounded-none">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (cinema.completedHours / cinema.maxHours) * 100)}%`,
                      backgroundColor: style.barColor,
                    }}
                  />
                </div>

                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  {cinema.completedHours >= cinema.minHours
                    ? 'Objectif Cinéma & Scénario atteint. Continuez l’écriture.'
                    : `Reste pour l’objectif min : ${(cinema.minHours - cinema.completedHours).toFixed(1)} heures.`}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-amber-500/20">
                <span className="mono text-[10px] tracking-wide font-medium opacity-60">Ajuster les Heures</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateCategoryHours('cinema', -0.5)}
                    className="p-1 rounded-xl bg-cyan-950/40 hover:bg-[#222630] text-slate-300 border border-soft"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="mono text-xs text-slate-200 w-8 text-center">
                    0.5h
                  </span>
                  <button
                    onClick={() => onUpdateCategoryHours('cinema', 0.5)}
                    className={`p-1 rounded-xl border ${style.badgeBg}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 3. School Lessons */}
        {school && (() => {
          const style = getCategoryStyle('school');
          return (
            <div className={`relative overflow-hidden rounded-xl ${style.cardBg} ${style.borderLeft} p-6 flex flex-col justify-between space-y-4 transition-all`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${style.iconBg}`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`mono text-[10px] tracking-wide font-medium font-semibold ${style.textColor}`}>
                      Académique
                    </span>
                    <h3 className="serif text-xl font-light italic text-white">Cours Scolaires</h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="mono text-[10px] uppercase opacity-60 block">Objectif</span>
                  <span className={`mono text-xs font-semibold ${style.textColor}`}>
                    5h - 10h / sem
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className={`serif text-3xl font-light italic ${style.textColor}`}>
                    {formatHoursDecimal(school.completedHours)}
                  </span>
                  <span className="mono text-[10px] opacity-60">
                    Cible : {school.minHours}h - {school.maxHours}h
                  </span>
                </div>

                <div className="w-full bg-white/5 h-2 overflow-hidden rounded-none">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (school.completedHours / school.maxHours) * 100)}%`,
                      backgroundColor: style.barColor,
                    }}
                  />
                </div>

                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  {school.completedHours >= school.minHours
                    ? 'Objectif minimum d’études scolaires atteint.'
                    : `Reste pour l’objectif min : ${(school.minHours - school.completedHours).toFixed(1)} heures.`}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-cyan-500/20">
                <span className="mono text-[10px] tracking-wide font-medium opacity-60">Ajuster les Heures</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateCategoryHours('school', -0.5)}
                    className="p-1 rounded-xl bg-cyan-950/40 hover:bg-[#222630] text-slate-300 border border-soft"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="mono text-xs text-slate-200 w-8 text-center">
                    0.5h
                  </span>
                  <button
                    onClick={() => onUpdateCategoryHours('school', 0.5)}
                    className={`p-1 rounded-xl border ${style.badgeBg}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Academic Subject Specific Breakdown Section - Editorial Block Meter */}
      <div className="bg-card border border-soft rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-soft pb-4">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 accent-cyan" />
              <h3 className="serif text-2xl font-light italic text-white">
                {studyDomains.length > 0
                  ? `Maîtrise — ${studyDomains.map((d) => d.label).join(' / ')}`
                  : 'Maîtrise Académique (SVT / Maths / PC / Hist-Géo)'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Répartition équilibrée du temps d’étude pour une haute performance scolaire.
            </p>
          </div>

          <div className="mono text-xs accent-cyan bg-cyan-950/40 border border-cyan px-3 py-1.5 rounded-xl">
            Total Études : <strong>{subjectGoals.reduce((a, b) => a + b.completedHours, 0).toFixed(1)}h</strong> / 7.5h Cible
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectGoals.map((subj) => {
            const ratio = subj.completedHours / subj.targetWeeklyHours;
            const blockCount = 5;
            const filledBlocks = Math.min(blockCount, Math.round(ratio * blockCount));

            return (
              <div key={subj.subject} className="bg-cyan-950/40 border border-soft rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="mono text-xs font-semibold text-white uppercase">{subj.name}</span>
                  <span className="mono text-[11px] opacity-60">
                    {subj.completedHours.toFixed(1)} / {subj.targetWeeklyHours}h
                  </span>
                </div>

                {/* Editorial Block Meter */}
                <div className="flex items-center gap-1.5 py-1">
                  {Array.from({ length: blockCount }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-3 flex-1 rounded-none transition-all ${
                        i < filledBlocks ? 'bg-cyan-400' : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 text-xs border-t border-soft">
                  <span className="mono text-[10px] uppercase opacity-60">{Math.round(ratio * 100)}% réalisé</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateSubjectHours(subj.subject, -0.25)}
                      className="p-1 rounded-xl bg-black/40 hover:bg-black/60 text-slate-300"
                      title="Diminuer de 15 min"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onUpdateSubjectHours(subj.subject, 0.25)}
                      className="p-1 rounded-xl bg-black/40 hover:bg-black/60 text-slate-200"
                      title="Augmenter de 15 min"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Milestones Roadmap Grid (Cinema & Bangre Neo Lab) */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!hasLegacyCinema && !hasLegacyBangre ? 'hidden' : ''}`}>
        {/* Cinema Project & Screenplay Roadmap */}
        <div className="bg-card border border-soft rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between border-b border-soft pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-amber-400" />
                <h3 className="serif text-xl font-light italic text-white">
                  {personalization.cinemaProject.title}
                </h3>
              </div>
              <span className="mono text-[10px] tracking-wide font-medium text-amber-400 mt-0.5 block">
                {personalization.cinemaProject.genre}
              </span>
            </div>

            {openPersonalizationModal && (
              <button
                onClick={openPersonalizationModal}
                className="p-1.5 rounded-xl bg-cyan-950/40 text-cyan-400 border border-cyan hover:bg-[#222630]"
                title="Modifier les détails du projet Cinéma"
              >
                <Sliders className="w-3.5 h-3.5 accent-cyan" />
              </button>
            )}
          </div>

          <div className="bg-cyan-950/40 p-3 rounded-xl border border-soft space-y-1">
            <span className="mono text-[9px] tracking-wide font-medium text-slate-400">Étape Actuelle de Production</span>
            <p className="serif text-sm font-light italic text-white">{personalization.cinemaProject.currentStage}</p>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{personalization.cinemaProject.synopsis}</p>
          </div>

          <div className="space-y-2">
            <h4 className="mono text-[10px] tracking-wide font-medium opacity-60">Jalons du Projet</h4>
            {personalization.cinemaProject.milestones.map((ms) => (
              <div
                key={ms.id}
                onClick={() => handleToggleCinemaMilestone(ms.id)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-950/40 border border-soft hover:border-amber-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2.5">
                  {ms.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                  <span className={`text-xs ${ms.isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
                    {ms.title}
                  </span>
                </div>
                <span className="mono text-[9px] uppercase px-2 py-0.5 rounded-xl bg-black/40 text-slate-400 border border-soft">
                  {ms.stageName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bangre Neo Lab Engineering Roadmap */}
        <div className="bg-card border border-soft rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between border-b border-soft pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-purple-400" />
                <h3 className="serif text-xl font-light italic text-white">
                  {personalization.bangreLab.projectName}
                </h3>
              </div>
              <span className="mono text-[10px] tracking-wide font-medium text-purple-400 mt-0.5 block">
                {personalization.bangreLab.focusModule}
              </span>
            </div>

            {openPersonalizationModal && (
              <button
                onClick={openPersonalizationModal}
                className="p-1.5 rounded-xl bg-cyan-950/40 text-cyan-400 border border-cyan hover:bg-[#222630]"
                title="Modifier les détails de Bangre Lab"
              >
                <Sliders className="w-3.5 h-3.5 accent-cyan" />
              </button>
            )}
          </div>

          <div className="bg-cyan-950/40 p-3 rounded-xl border border-soft space-y-1">
            <span className="mono text-[9px] tracking-wide font-medium text-slate-400">Étape Actuelle d'Ingénierie</span>
            <p className="serif text-sm font-light italic text-white">{personalization.bangreLab.currentStage}</p>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{personalization.bangreLab.architectureGoal}</p>
          </div>

          <div className="space-y-2">
            <h4 className="mono text-[10px] tracking-wide font-medium opacity-60">Jalons d'Ingénierie</h4>
            {personalization.bangreLab.milestones.map((ms) => (
              <div
                key={ms.id}
                onClick={() => handleToggleBangreMilestone(ms.id)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-950/40 border border-soft hover:border-purple-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2.5">
                  {ms.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                  <span className={`text-xs ${ms.isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
                    {ms.title}
                  </span>
                </div>
                <span className="mono text-[9px] uppercase px-2 py-0.5 rounded-xl bg-black/40 text-slate-400 border border-soft">
                  {ms.stageName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real Academic Syllabus & Lesson Tracker — legacy school profile only */}
      <div className={`bg-card border border-soft rounded-xl p-6 space-y-6 ${hasLegacySchool ? '' : 'hidden'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-soft pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 accent-cyan" />
              <h3 className="serif text-2xl font-light italic text-white">
                Programme de Cours & Préparation aux Examens
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Chapitres personnalisés et objectifs de révision en SVT, Mathématiques, Physique-Chimie et Histoire-Géographie.
            </p>
          </div>

          {openPersonalizationModal && (
            <button
              onClick={openPersonalizationModal}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-[#222630] text-cyan-400 border border-cyan mono text-xs uppercase flex items-center gap-2 transition-all self-start sm:self-auto"
            >
              <Sliders className="w-3.5 h-3.5 accent-cyan" />
              <span>Gérer le Programme de Cours</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personalization.lessons.map((les) => (
            <div key={les.id} className="p-4 rounded-xl bg-cyan-950/40 border border-soft space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`mono text-[9px] uppercase px-2 py-0.5 rounded-xl border ${
                    les.subject === 'svt' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800' :
                    les.subject === 'math' ? 'bg-blue-950/40 text-blue-400 border-blue-800' :
                    les.subject === 'pc' ? 'bg-purple-950/40 text-purple-400 border-purple-800' :
                    'bg-amber-950/40 text-amber-400 border-amber-800'
                  }`}>
                    {les.subject.toUpperCase()}
                  </span>

                  <span className={`mono text-[10px] uppercase px-2 py-0.5 rounded-xl border ${
                    les.status === 'mastered' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-600' :
                    les.status === 'in_progress' ? 'bg-cyan-400/20 text-cyan-400 border-cyan' :
                    'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {les.status === 'mastered' ? 'Maîtrisé ✨' : les.status === 'in_progress' ? 'En cours' : 'Non commencé'}
                  </span>
                </div>

                <h4 className="serif text-base font-light italic text-white">{les.title}</h4>
                <p className="mono text-[11px] text-slate-400 mt-0.5">{les.chapter}</p>
                {les.notes && <p className="text-xs text-slate-300 mt-2 italic leading-relaxed">{les.notes}</p>}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-soft mt-2">
                {les.targetExamDate ? (
                  <span className="mono text-[10px] opacity-60 flex items-center gap-1">
                    <Calendar className="w-3 h-3 accent-cyan" /> Examen : {les.targetExamDate}
                  </span>
                ) : (
                  <span className="mono text-[10px] opacity-40">Pas de date d'examen fixée</span>
                )}

                {/* Quick Status Buttons */}
                <div className="flex items-center gap-1">
                  {(['not_started', 'in_progress', 'mastered'] as LessonStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleLessonStatusChange(les.id, st)}
                      className={`px-2 py-1 rounded-xl mono text-[9px] uppercase transition-all ${
                        les.status === st
                          ? 'bg-cyan-400 text-black font-bold'
                          : 'bg-black/40 text-slate-400 hover:text-white border border-soft'
                      }`}
                    >
                      {st === 'not_started' ? 'En attente' : st === 'in_progress' ? 'Actif' : 'Maîtrisé'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Target vs Achieved Progress Chart */}
        <div className="lg:col-span-7 bg-card border border-soft rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-soft pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-xl text-[9px] mono tracking-wide font-medium bg-cyan-400/10 text-cyan-400 border border-cyan">
                  Comparaison Visuelle des Objectifs
                </span>
              </div>
              <h3 className="serif text-xl font-light italic text-white flex items-center gap-2">
                <Award className="w-5 h-5 accent-cyan" />
                Heures Hebdomadaires Réalisées vs Objectifs Fixés
              </h3>
            </div>

            {/* View Filter Switcher */}
            <div className="flex items-center bg-cyan-950/40 p-1 rounded-xl border border-soft self-start sm:self-auto">
              <button
                onClick={() => setChartCategoryFilter('core')}
                className={`px-2.5 py-1 rounded-xl text-[10px] mono uppercase transition-all ${
                  chartCategoryFilter === 'core'
                    ? 'bg-cyan-400 text-black font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Piliers Principaux
              </button>
              <button
                onClick={() => setChartCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-xl text-[10px] mono uppercase transition-all ${
                  chartCategoryFilter === 'all'
                    ? 'bg-cyan-400 text-black font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Toutes les Catégories
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {domainMode
              ? `Comparaison directe entre heures enregistrées et objectifs hebdomadaires : ${weeklySummary}.`
              : 'Comparaison directe entre heures enregistrées et objectifs hebdomadaires : Bangre Neo Lab (15-20h), Cinéma (10-15h), et Études (5-10h).'}
          </p>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} interval={0} textAnchor="middle" />
                <YAxis stroke="#9ca3af" fontSize={11} unit="h" />
                <Tooltip content={<CustomCategoryTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', paddingTop: '10px' }} />
                <Bar dataKey="Heures Réalisées" fill="#00D4FF" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Heures Cibles" fill="rgba(255, 255, 255, 0.12)" stroke="#9ca3af" strokeDasharray="3 3" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Academic Subject Share Donut Chart */}
        <div className="lg:col-span-5 bg-card border border-soft rounded-xl p-6 space-y-4">
          <h3 className="serif text-xl font-light italic text-white flex items-center gap-2 border-b border-soft pb-2">
            <GraduationCap className="w-5 h-5 accent-cyan" />
            Répartition des Études Scolaires (Heures)
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed">
            Répartition du temps d'étude par matière : SVT, Mathématiques, Physique-Chimie et Histoire-Géo.
          </p>

          <div className="h-72 w-full flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name.split(' ')[0]}: ${value}h`}
                >
                  {subjectChartData.map((_entry, index) => {
                    const colors = ['#00D4FF', '#8b5cf6', '#10b981', '#06b6d4'];
                    return <Cell key={`cell-subject-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#051428', borderColor: '#00D4FF', borderRadius: '2px' }}
                  itemStyle={{ color: '#E5E7EB', fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { WeeklyCategoryTarget, SubjectGoal, UserPersonalization, LessonStatus, StreakDayRecord, Domain } from '../types';
import { domainsForTracking, DOMAIN_CATEGORY_STYLES } from '../lib/domains';
import { StreakCalendar } from './StreakCalendar';
import { formatHoursDecimal, getCategoryStyle } from '../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, CartesianGrid
} from 'recharts';
import {
  Target, Code, Film, GraduationCap, BookOpen, CheckCircle2, Circle,
  Plus, Minus, Sparkles, Award, Settings, Calendar, Flame, Zap, Sword, Shield, Star,
  Dumbbell, Wallet, Users, BarChart3
} from './ui/PharaohIcons';
import { RankBadgeInline, RankBadgeCard, getRankFromXP, RANK_DEFINITIONS } from './ui/RankBadge';
import { motion, AnimatePresence } from 'motion/react';

interface ProgressDashboardProps {
  categoryTargets: WeeklyCategoryTarget[];
  subjectGoals: SubjectGoal[];
  personalization: UserPersonalization;
  streakRecords?: StreakDayRecord[];
  currentStreak?: number;
  onUpdateCategoryHours: (id: string, delta: number) => void;
  onUpdateSubjectHours: (subjectKey: string, delta: number) => void;
  onOpenFocusTimer: () => void;
  domains?: Domain[];
  openPersonalizationModal?: () => void;
  onUpdatePersonalization?: (updated: UserPersonalization) => void;
  onToggleDayStreak?: (id: string) => void;
  totalXP?: number;
  playerProfile?: { name?: string; level?: number };
}

const DomainIconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  physical: Dumbbell,
  creative: Film,
  intellectual: GraduationCap,
  craft: Code,
  habit: CheckCircle2,
  financial: Wallet,
  social: Users,
};

// Single source of truth: the Pharaoh palette per domain category (lib/domains).
const DomainColorMap: Record<string, string> = Object.fromEntries(
  Object.entries(DOMAIN_CATEGORY_STYLES).map(([key, style]) => [key, style.color])
);

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
  totalXP = 0,
  playerProfile,
}) => {
  const [chartCategoryFilter, setChartCategoryFilter] = useState<'core' | 'all'>('core');
  const [showRankDetail, setShowRankDetail] = useState(false);

  const rank = getRankFromXP(totalXP);
  const rankInfo = RANK_DEFINITIONS[rank];

  const hasLegacyCinema = domains.length === 0 || domains.some((d) => d.legacyCategory === 'cinema');
  const hasLegacyBangre = domains.length === 0 || domains.some((d) => d.legacyCategory === 'bangre_neo');
  const studyDomains = domainsForTracking(domains, 'study_subjects');
  const hasLegacySchool = domains.length === 0 || domains.some((d) => d.legacyCategory === 'school');
  const domainMode = domains.length > 0;
  const weeklySummary = domainMode
    ? domains.map((d) => `${d.label} (${d.weekly_time_budget ?? '-'}h)`).join(', ')
    : null;

  const bangreNeo = categoryTargets.find((c) => c.id === 'bangre_neo');
  const cinema = categoryTargets.find((c) => c.id === 'cinema');
  const school = categoryTargets.find((c) => c.id === 'school');

  const handleToggleCinemaMilestone = (id: string) => {
    if (!onUpdatePersonalization) return;
    const updatedMilestones = personalization.cinemaProject.milestones.map((m) =>
      m.id === id ? { ...m, isCompleted: !m.isCompleted } : m
    );
    onUpdatePersonalization({ ...personalization, cinemaProject: { ...personalization.cinemaProject, milestones: updatedMilestones } });
  };

  const handleToggleBangreMilestone = (id: string) => {
    if (!onUpdatePersonalization) return;
    const updatedMilestones = personalization.bangreLab.milestones.map((m) =>
      m.id === id ? { ...m, isCompleted: !m.isCompleted } : m
    );
    onUpdatePersonalization({ ...personalization, bangreLab: { ...personalization.bangreLab, milestones: updatedMilestones } });
  };

  const handleLessonStatusChange = (id: string, newStatus: LessonStatus) => {
    if (!onUpdatePersonalization) return;
    const updatedLessons = personalization.lessons.map((l) =>
      l.id === id ? { ...l, status: newStatus } : l
    );
    onUpdatePersonalization({ ...personalization, lessons: updatedLessons });
  };

  const filteredCategories = useMemo(() => categoryTargets.filter((c) => {
    if (chartCategoryFilter === 'core') {
      const legacyCore = c.id === 'bangre_neo' || c.id === 'cinema' || c.id === 'school';
      return legacyCore || (typeof c.id === 'string' && c.id.startsWith('dom:'));
    }
    return true;
  }), [categoryTargets, chartCategoryFilter]);

  const categoryChartData = useMemo(() => filteredCategories.map((c) => {
    const displayName =
      typeof c.id === 'string' && c.id.startsWith('dom:')
        ? getCategoryStyle(c.id).label
        : c.id === 'bangre_neo' ? 'Bangre Neo Lab'
        : c.id === 'cinema' ? 'Cinéma & Films'
        : c.id === 'school' ? 'Études Scolaires'
        : c.label.replace('Routine & Fitness', 'Forme').replace('Work', '').trim();

    return {
      id: c.id,
      name: displayName,
      fullName: c.label,
      'Heures Réalisées': Number(c.completedHours.toFixed(1)),
      'Heures Cibles': c.targetHours,
      minHours: c.minHours,
      maxHours: c.maxHours,
      color: c.color || DomainColorMap.habit,
      percentage: c.targetHours > 0 ? Math.min(100, Math.round((c.completedHours / c.targetHours) * 100)) : 0,
    };
  }), [filteredCategories]);

  const subjectChartData = useMemo(() => subjectGoals.map((s) => ({
    name: s.name,
    value: Number(s.completedHours.toFixed(1)),
    target: s.targetWeeklyHours,
    color: s.color,
  })), [subjectGoals]);

  const CustomCategoryTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <motion.div
          className="bg-panel border border-lapis-border p-3.5 rounded-xl shadow-card-hover space-y-2 min-w-[220px] z-50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center justify-between border-b border-lapis-border pb-1.5">
            <span className="font-display text-sm font-light text-pharaoh">{data.fullName || label}</span>
            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-xl ${
              data.percentage >= 100
                ? 'bg-emerald/20 text-emerald border border-emerald/40'
                : 'bg-sapphire/10 text-sapphire border border-sapphire/40'
            }`}>
              {data.percentage}%
            </span>
          </div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-pharaoh-subtle flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-none inline-block" style={{ background: 'var(--color-gold)' }} />
                Réalisé :
              </span>
              <strong className="text-emerald text-sm font-light">{data['Heures Réalisées']} h</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-pharaoh-subtle flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-none inline-block bg-lapis-border border border-lapis-light" />
                Cible :
              </span>
              <strong className="text-pharaoh-muted">{data['Heures Cibles']} h</strong>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-lapis-border/50 text-[10px]">
              <span className="text-pharaoh-subtle">Plage Cible :</span>
              <span className="text-gold-bright font-semibold">{data.minHours} - {data.maxHours}h / sem</span>
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const renderDomainCard = (domain: Domain) => {
    const style = DomainIconMap[domain.category] || CheckCircle2;
    const color = DomainColorMap[domain.category] || DomainColorMap.intellectual;
    const completed = (domain as any).completedHours || 0;
    const target = domain.weekly_time_budget || 0;
    const percentage = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;
    const Icon = style;

    return (
      <motion.div
        key={domain.id}
        className="relative overflow-hidden rounded-2xl bg-panel border border-lapis-border p-5 flex flex-col justify-between space-y-4 hover-lift hover-glow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="deco-corner deco-corner--tl" style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
          <div className="deco-corner deco-corner--br" style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
        </div>

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl flex items-center justify-center" style={{
              background: `linear-gradient(135deg, ${color}22, ${color}00)`,
              border: `1px solid ${color}44`,
            }}>
              <Icon size={22} style={{ color, filter: `drop-shadow(0 0 6px ${color}88)` }} />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider font-medium" style={{ color }}>
                {domain.tracking_type.replace('_', ' ')}
              </span>
              <h3 className="font-display text-lg font-light text-pharaoh truncate max-w-[160px]">
                {domain.label}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] uppercase text-pharaoh-subtle block">Objectif</span>
            <span className="font-mono text-sm font-semibold" style={{ color }}>
              {target}h / sem
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-xl font-light text-pharaoh tabular-nums">{completed.toFixed(1)}h</span>
            <span className="font-mono text-sm text-pharaoh-subtle">/ {target}h</span>
          </div>
          <div className="h-2 bg-obsidian rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${percentage}%`,
                background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                boxShadow: `0 0 8px ${color}88`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-pharaoh-subtle">{percentage}% complété</span>
            <span className="text-gold-bright">{target - completed > 0 ? `${(target - completed).toFixed(1)}h restants` : 'Objectif atteint'}</span>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onUpdateCategoryHours(domain.id, 0.5)}
              className="btn-press flex-1 py-2 px-3 rounded-xl text-sm font-medium bg-panel-gold text-gold-bright border-gold/50 hover:shadow-gold"
            >
              +0.5h
            </button>
            <button
              onClick={() => onUpdateCategoryHours(domain.id, -0.5)}
              className="btn-press flex-1 py-2 px-3 rounded-xl text-sm font-medium bg-panel text-pharaoh-muted hover:bg-panel-hover border-lapis-border"
            >
              -0.5h
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderLegacyCategory = (target: WeeklyCategoryTarget | undefined, label: string, Icon: React.ComponentType<{ size?: number; color?: string }>, color: string, minHours: number, maxHours: number) => {
    if (!target) return null;
    const completed = target.completedHours;
    const targetHours = target.targetHours;
    const percentage = targetHours > 0 ? Math.min(100, Math.round((completed / targetHours) * 100)) : 0;

    return (
      <motion.div
        key={target.id}
        className="relative overflow-hidden rounded-2xl bg-panel border border-lapis-border p-5 flex flex-col justify-between space-y-4 hover-lift hover-glow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="deco-corner deco-corner--tl" style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
          <div className="deco-corner deco-corner--br" style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
        </div>

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl flex items-center justify-center" style={{
              background: `linear-gradient(135deg, ${color}22, ${color}00)`,
              border: `1px solid ${color}44`,
            }}>
              <Icon size={22} style={{ color, filter: `drop-shadow(0 0 6px ${color}88)` }} />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider font-medium" style={{ color }}>
                {label}
              </span>
              <h3 className="font-display text-lg font-light text-pharaoh truncate max-w-[160px]">
                {target.label}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] uppercase text-pharaoh-subtle block">Objectif</span>
            <span className="font-mono text-sm font-semibold" style={{ color }}>
              {minHours}h - {maxHours}h / sem
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-xl font-light text-pharaoh tabular-nums">{completed.toFixed(1)}h</span>
            <span className="font-mono text-sm text-pharaoh-subtle">/ {targetHours}h</span>
          </div>
          <div className="h-2 bg-obsidian rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${percentage}%`,
                background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                boxShadow: `0 0 8px ${color}88`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-pharaoh-subtle">{percentage}% complété</span>
            <span className="text-gold-bright">{targetHours - completed > 0 ? `${(targetHours - completed).toFixed(1)}h restants` : 'Objectif atteint'}</span>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onUpdateCategoryHours(target.id, 0.5)}
              className="btn-press flex-1 py-2 px-3 rounded-xl text-sm font-medium bg-panel-gold text-gold-bright border-gold/50 hover:shadow-gold"
            >
              +0.5h
            </button>
            <button
              onClick={() => onUpdateCategoryHours(target.id, -0.5)}
              className="btn-press flex-1 py-2 px-3 rounded-xl text-sm font-medium bg-panel text-pharaoh-muted hover:bg-panel-hover border-lapis-border"
            >
              -0.5h
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 anim-in">
      {/* Rank Showcase Header */}
      {playerProfile && (
        <motion.div
          className="relative overflow-hidden rounded-2xl bg-panel border border-lapis-border p-6 md:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <div className="deco-corner deco-corner--tl" style={{ background: `radial-gradient(circle, ${rankInfo.color} 0%, transparent 70%)` }} />
            <div className="deco-corner deco-corner--br" style={{ background: `radial-gradient(circle, ${rankInfo.color} 0%, transparent 70%)` }} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <RankBadgeInline rank={rank} size="md" showLabel />
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-light text-gradient-gold tracking-wide">
                  {personalization?.hunterTitle || 'Hunter'}
                </h2>
                <p className="text-pharaoh-subtle text-sm font-mono">
                  NIV {playerProfile.level || 1} • {totalXP.toLocaleString()} XP
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowRankDetail(!showRankDetail)}
                className="btn-press flex items-center gap-2 px-4 py-2 rounded-xl bg-panel-gold text-gold-bright border-gold/50 font-mono text-xs tracking-wide hover:shadow-gold"
              >
                <Sword size={16} />
                <span>Détails du Rang</span>
              </button>
              {openPersonalizationModal && (
                <button
                  onClick={openPersonalizationModal}
                  className="btn-press flex items-center gap-2 px-4 py-2 rounded-xl bg-panel text-pharaoh border-lapis-border font-mono text-xs tracking-wide hover:bg-panel-hover hover:text-pharaoh"
                >
                  <Settings size={16} />
                  <span>Personnaliser</span>
                </button>
              )}
              <button
                onClick={onOpenFocusTimer}
                className="btn-press flex items-center gap-2 px-4 py-2 rounded-xl bg-panel text-sapphire border-sapphire/30 font-mono text-xs tracking-wide hover:bg-panel-hover hover:text-sapphire hover:border-sapphire/50 hover:shadow-glow-sapphire"
              >
                <Sparkles size={16} />
                <span>Session Focus</span>
              </button>
            </div>
          </div>

          {showRankDetail && (
            <motion.div
              className="mt-6 pt-6 border-t border-lapis-border"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <RankBadgeCard rank={rank} xp={totalXP} showProgress />
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Target Progress Banner */}
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-panel border border-lapis-border p-6 md:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="deco-corner deco-corner--tl" />
          <div className="deco-corner deco-corner--br" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-xl text-[10px] font-mono tracking-wide font-medium bg-sapphire/10 text-sapphire border border-sapphire/40 flex items-center gap-1.5">
                <Target size={14} style={{ color: 'var(--color-sapphire)' }} />
                Objectifs Hebdomadaires de Performance
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-light italic text-pharaoh tracking-tight">
              Allocation & Progression Hebdomadaire
            </h2>
            <p className="text-pharaoh-subtle text-sm mt-2 max-w-2xl leading-relaxed">
              {domainMode
                ? `Suivez vos objectifs : ${weeklySummary}.`
                : 'Suivez vos objectifs : Bangre Neo (15-20h), Cinéma (10-15h), Études (5-10h), Travail Incontournable.'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Streak Calendar */}
      {streakRecords.length > 0 && (
        <motion.div
          className="bg-panel border border-lapis-border rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StreakCalendar
            streakRecords={streakRecords}
            currentStreak={currentStreak}
            onToggleDayCompletion={onToggleDayStreak}
          />
        </motion.div>
      )}

      {/* Core Weekly Targets Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Domain-driven cards (onboarding v2) */}
        {domainMode && domains.length > 0 && domains.map(renderDomainCard)}

        {/* Legacy categories (fallback for migrated users) */}
        {!domainMode && (
          <>
            {renderLegacyCategory(bangreNeo, 'Tech Prioritaire', Code, '#7B3FE4', 15, 20)}
            {renderLegacyCategory(cinema, 'Arts Visuels', Film, '#D4A81E', 10, 15)}
            {renderLegacyCategory(school, 'Savoir Académique', GraduationCap, '#1D6FA5', 5, 10)}
          </>
        )}
      </motion.div>

      {/* Category Chart Section */}
      <motion.div
        className="bg-panel border border-lapis-border rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-panel-gold">
              <BarChart3 size={20} color="var(--color-gold)" />
            </div>
            <div>
              <h3 className="font-display text-xl font-light text-pharaoh">Répartition Hebdomadaire</h3>
              <p className="text-pharaoh-subtle text-sm">Heures réalisées vs objectifs</p>
            </div>
          </div>
          <div className="flex gap-2">
            {['core', 'all'].map((filter) => (
              <button
                key={filter}
                onClick={() => setChartCategoryFilter(filter)}
                className={`btn-press px-3 py-1.5 rounded-xl text-xs font-mono tracking-wide font-medium transition-all ${
                  chartCategoryFilter === filter
                    ? 'bg-panel-gold text-gold-bright border-gold/50 shadow-gold'
                    : 'bg-panel text-pharaoh-muted hover:bg-panel-hover border-lapis-border'
                }`}
              >
                {filter === 'core' ? 'Principaux' : 'Tous'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} layout="vertical" margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,30,0.05)" vertical={false} />
              <XAxis
                type="number"
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                axisLine={false}
                tickLine={false}
                domain={['dataMin', 'dataMax']}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12, fontFamily: 'var(--font-sans)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomCategoryTooltip />} />
              <Legend />
              <Bar
                dataKey="Heures Réalisées"
                name="Réalisé"
                radius={[0, 4, 4, 0]}
                barSize={24}
                maxBarSize={28}
              >
                {categoryChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
              <Bar
                dataKey="Heures Cibles"
                name="Cible"
                radius={[0, 4, 4, 0]}
                barSize={24}
                maxBarSize={28}
                fill="rgba(212,168,30,0.3)"
                stroke="var(--color-gold)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Subject Goals */}
      {subjectGoals.length > 0 && (
        <motion.div
          className="bg-panel border border-lapis-border rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-panel-gold">
                <GraduationCap size={20} color="var(--color-gold)" />
              </div>
              <div>
                <h3 className="font-display text-xl font-light text-pharaoh">Objectifs Matières</h3>
                <p className="text-pharaoh-subtle text-sm">Progression par matière scolaire</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectGoals.map((subject) => (
              <motion.div
                key={subject.id}
                className="relative overflow-hidden rounded-xl bg-panel border border-lapis-border p-4 hover-lift"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 pointer-events-none opacity-5">
                  <div className="deco-corner deco-corner--tl" style={{ background: `radial-gradient(circle, ${subject.color} 0%, transparent 70%)` }} />
                </div>
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-base font-light text-pharaoh truncate pr-2">{subject.name}</h4>
                    <span className="font-mono text-[10px] font-medium px-2 py-0.5 rounded-full" style={{
                      background: `${subject.color}22`,
                      color: subject.color,
                      border: `1px solid ${subject.color}44`,
                    }}>
                      {subject.completedHours.toFixed(1)}h
                    </span>
                  </div>
                  <div className="h-2 bg-obsidian rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        width: `${subject.targetWeeklyHours > 0 ? Math.min(100, (subject.completedHours / subject.targetWeeklyHours) * 100) : 0}%`,
                        background: `linear-gradient(90deg, ${subject.color}, ${subject.color}aa)`,
                        boxShadow: `0 0 8px ${subject.color}88`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${subject.targetWeeklyHours > 0 ? Math.min(100, (subject.completedHours / subject.targetWeeklyHours) * 100) : 0}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-pharaoh-subtle">{subject.targetWeeklyHours}h cible</span>
                    <button
                      onClick={() => onUpdateSubjectHours(subject.subjectKey, 0.5)}
                      className="btn-press text-gold-bright hover:text-gold text-xs"
                    >
                      +0.5h
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Legacy Milestones (Cinema / Bangre Neo) */}
      {hasLegacyCinema && personalization.cinemaProject.milestones.length > 0 && (
        <motion.div
          className="bg-panel border border-lapis-border rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #D4A81E22, #D4A81E00)', border: '1px solid #D4A81E44' }}>
                <Film size={20} color="#D4A81E" />
              </div>
              <h3 className="font-display text-xl font-light text-pharaoh">Cinéma & Scénarios — Jalons</h3>
            </div>
          </div>
          <div className="space-y-3">
            {personalization.cinemaProject.milestones.map((m) => (
              <motion.label
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-panel-hover border border-lapis-border cursor-pointer hover:border-gold/30 transition-all"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <input
                  type="checkbox"
                  checked={m.isCompleted}
                  onChange={() => handleToggleCinemaMilestone(m.id)}
                  className="w-5 h-5 rounded border-2 appearance-none cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian"
                  style={{
                    borderColor: m.isCompleted ? '#D4A81E' : 'rgba(212,168,30,0.3)',
                    backgroundColor: m.isCompleted ? '#D4A81E' : 'transparent',
                  }}
                />
                <span className={`font-display text-base ${m.isCompleted ? 'line-through text-pharaoh-subtle' : 'text-pharaoh'}`}>
                  {m.title}
                </span>
              </motion.label>
            ))}
          </div>
        </motion.div>
      )}

      {hasLegacyBangre && personalization.bangreLab.milestones.length > 0 && (
        <motion.div
          className="bg-panel border border-lapis-border rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #7B3FE422, #7B3FE400)', border: '1px solid #7B3FE444' }}>
                <Code size={20} color="#7B3FE4" />
              </div>
              <h3 className="font-display text-xl font-light text-pharaoh">Bangre Neo Lab — Jalons</h3>
            </div>
          </div>
          <div className="space-y-3">
            {personalization.bangreLab.milestones.map((m) => (
              <motion.label
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-panel-hover border border-lapis-border cursor-pointer hover:border-gold/30 transition-all"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <input
                  type="checkbox"
                  checked={m.isCompleted}
                  onChange={() => handleToggleBangreMilestone(m.id)}
                  className="w-5 h-5 rounded border-2 appearance-none cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian"
                  style={{
                    borderColor: m.isCompleted ? '#7B3FE4' : 'rgba(212,168,30,0.3)',
                    backgroundColor: m.isCompleted ? '#7B3FE4' : 'transparent',
                  }}
                />
                <span className={`font-display text-base ${m.isCompleted ? 'line-through text-pharaoh-subtle' : 'text-pharaoh'}`}>
                  {m.title}
                </span>
              </motion.label>
            ))}
          </div>
        </motion.div>
      )}

      {/* Academic Lessons */}
      {hasLegacySchool && personalization.lessons.length > 0 && (
        <motion.div
          className="bg-panel border border-lapis-border rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #1D6FA522, #1D6FA500)', border: '1px solid #1D6FA544' }}>
                <GraduationCap size={20} color="#1D6FA5" />
              </div>
              <h3 className="font-display text-xl font-light text-pharaoh">Programme Académique — Leçons</h3>
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
            {personalization.lessons.map((lesson) => (
              <motion.div
                key={lesson.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-panel-hover border border-lapis-border hover:border-gold/30 transition-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <select
                  value={lesson.status}
                  onChange={(e) => handleLessonStatusChange(lesson.id, e.target.value as LessonStatus)}
                  className="flex-shrink-0 w-28 h-8 px-2 bg-obsidian border border-lapis-border rounded-lg text-pharaoh text-xs font-mono cursor-pointer hover:border-gold/40 focus:border-gold focus:ring-1 focus:ring-gold/50 transition-colors"
                >
                  <option value="pending">En attente</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminé</option>
                </select>
                <span className="font-display text-sm text-pharaoh truncate flex-1 min-w-0">{lesson.title}</span>
                <span className="font-mono text-[10px] text-pharaoh-subtle px-2 py-0.5 rounded-full bg-obsidian border border-lapis-border">
                  {lesson.estimatedHours}h
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
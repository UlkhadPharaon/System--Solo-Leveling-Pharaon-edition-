import { Category, SchoolSubject } from '../types';

export interface CategoryStyleToken {
  label: string;
  badgeBg: string;
  dotColor: string;
  barColor: string;
  cardBg: string;
  borderLeft: string;
  textColor: string;
  iconBg: string;
  accentTagBg: string;
  glowBorder: string;
  activeFilterBg: string;
}

export function getCategoryStyle(category: Category, schoolSubject?: SchoolSubject): CategoryStyleToken {
  switch (category) {
    case 'bangre_neo':
      return {
        label: 'Bangre Neo Lab',
        badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
        dotColor: 'bg-violet-400',
        barColor: '#8b5cf6',
        cardBg: 'bg-violet-950/20 border-violet-500/30 hover:border-violet-500/60',
        borderLeft: 'border-l-4 border-l-violet-500',
        textColor: 'text-violet-400',
        iconBg: 'bg-violet-500/20 border-violet-500/40 text-violet-300',
        accentTagBg: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
        glowBorder: 'border-violet-500/50',
        activeFilterBg: 'bg-violet-500/20 text-violet-300 border-violet-500',
      };
    case 'cinema':
      return {
        label: 'Cinéma & Films',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dotColor: 'bg-amber-400',
        barColor: '#f59e0b',
        cardBg: 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/60',
        borderLeft: 'border-l-4 border-l-amber-500',
        textColor: 'text-amber-400',
        iconBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
        accentTagBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        glowBorder: 'border-amber-500/50',
        activeFilterBg: 'bg-amber-500/20 text-amber-300 border-amber-500',
      };
    case 'school':
      if (schoolSubject === 'math') {
        return {
          label: 'Études - Maths',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          dotColor: 'bg-blue-400',
          barColor: '#3b82f6',
          cardBg: 'bg-blue-950/20 border-blue-500/30 hover:border-blue-500/60',
          borderLeft: 'border-l-4 border-l-blue-500',
          textColor: 'text-blue-400',
          iconBg: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
          accentTagBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          glowBorder: 'border-blue-500/50',
          activeFilterBg: 'bg-blue-500/20 text-blue-300 border-blue-500',
        };
      }
      if (schoolSubject === 'pc') {
        return {
          label: 'Études - Phys/Chimie',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          dotColor: 'bg-purple-400',
          barColor: '#a855f7',
          cardBg: 'bg-purple-950/20 border-purple-500/30 hover:border-purple-500/60',
          borderLeft: 'border-l-4 border-l-purple-500',
          textColor: 'text-purple-400',
          iconBg: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
          accentTagBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          glowBorder: 'border-purple-500/50',
          activeFilterBg: 'bg-purple-500/20 text-purple-300 border-purple-500',
        };
      }
      if (schoolSubject === 'svt') {
        return {
          label: 'Études - SVT',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dotColor: 'bg-emerald-400',
          barColor: '#10b981',
          cardBg: 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60',
          borderLeft: 'border-l-4 border-l-emerald-500',
          textColor: 'text-emerald-400',
          iconBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
          accentTagBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          glowBorder: 'border-emerald-500/50',
          activeFilterBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500',
        };
      }
      if (schoolSubject === 'hist_geo') {
        return {
          label: 'Études - Hist & Géo',
          badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          dotColor: 'bg-orange-400',
          barColor: '#f97316',
          cardBg: 'bg-orange-950/20 border-orange-500/30 hover:border-orange-500/60',
          borderLeft: 'border-l-4 border-l-orange-500',
          textColor: 'text-orange-400',
          iconBg: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
          accentTagBg: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
          glowBorder: 'border-orange-500/50',
          activeFilterBg: 'bg-orange-500/20 text-orange-300 border-orange-500',
        };
      }
      return {
        label: 'Études Scolaires',
        badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        dotColor: 'bg-cyan-400',
        barColor: '#06b6d4',
        cardBg: 'bg-cyan-950/20 border-cyan-500/30 hover:border-cyan-500/60',
        borderLeft: 'border-l-4 border-l-cyan-500',
        textColor: 'text-cyan-400',
        iconBg: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
        accentTagBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        glowBorder: 'border-cyan-500/50',
        activeFilterBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500',
      };
    case 'must_do_work':
      return {
        label: 'Travail Incontournable',
        badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        dotColor: 'bg-sky-400',
        barColor: '#38bdf8',
        cardBg: 'bg-sky-950/20 border-sky-500/30 hover:border-sky-500/60',
        borderLeft: 'border-l-4 border-l-sky-500',
        textColor: 'text-sky-400',
        iconBg: 'bg-sky-500/20 border-sky-500/40 text-sky-300',
        accentTagBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        glowBorder: 'border-sky-500/50',
        activeFilterBg: 'bg-sky-500/20 text-sky-300 border-sky-500',
      };
    case 'morning_routine':
      return {
        label: 'Routine Matinale',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        dotColor: 'bg-emerald-400',
        barColor: '#10b981',
        cardBg: 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60',
        borderLeft: 'border-l-4 border-l-emerald-500',
        textColor: 'text-emerald-400',
        iconBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
        accentTagBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        glowBorder: 'border-emerald-500/50',
        activeFilterBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500',
      };
    case 'learning':
      return {
        label: 'Lecture & Podcasts',
        badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
        dotColor: 'bg-pink-400',
        barColor: '#ec4899',
        cardBg: 'bg-pink-950/20 border-pink-500/30 hover:border-pink-500/60',
        borderLeft: 'border-l-4 border-l-pink-500',
        textColor: 'text-pink-400',
        iconBg: 'bg-pink-500/20 border-pink-500/40 text-pink-300',
        accentTagBg: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
        glowBorder: 'border-pink-500/50',
        activeFilterBg: 'bg-pink-500/20 text-pink-300 border-pink-500',
      };
    case 'sleep':
      return {
        label: 'Sommeil & Récupération',
        badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        dotColor: 'bg-indigo-400',
        barColor: '#6366f1',
        cardBg: 'bg-indigo-950/20 border-indigo-500/30 hover:border-indigo-500/60',
        borderLeft: 'border-l-4 border-l-indigo-500',
        textColor: 'text-indigo-400',
        iconBg: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300',
        accentTagBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        glowBorder: 'border-indigo-500/50',
        activeFilterBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500',
      };
    default:
      return {
        label: 'Temps Personnel',
        badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
        dotColor: 'bg-slate-400',
        barColor: '#64748b',
        cardBg: 'bg-slate-900/30 border-slate-700/50 hover:border-slate-500',
        borderLeft: 'border-l-4 border-l-slate-500',
        textColor: 'text-slate-400',
        iconBg: 'bg-slate-500/20 border-slate-500/40 text-slate-300',
        accentTagBg: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
        glowBorder: 'border-slate-500/50',
        activeFilterBg: 'bg-slate-500/20 text-slate-300 border-slate-500',
      };
  }
}

export function getCategoryBadge(category: Category, schoolSubject?: SchoolSubject) {
  const style = getCategoryStyle(category, schoolSubject);
  return {
    label: style.label,
    badgeBg: style.badgeBg,
    dotColor: style.dotColor,
    barColor: style.barColor,
  };
}

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export function formatHoursDecimal(hours: number): string {
  return hours.toFixed(1) + 'h';
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Weekly Report Engine — aggregates the last 7 days from local state.
 * Pure functions: no side effects, trivially testable.
 */
import { WeeklyCategoryTarget, FocusSession } from '../types';
import { DailyStreakState } from './dailyEngine';

export interface WeeklyReport {
  weekLabel: string;        // ex. "Semaine du 17 au 23 août"
  xpGained: number;         // approximated from completed blocks & focus time
  blocksCompleted: number;
  blocksTotal: number;      // scheduled in the last 7 days (approx: current week)
  focusMinutes: number;
  focusSessions: number;
  topDomain: { label: string; hours: number } | null;
  domains: { label: string; hours: number; targetHours: number }[];
  currentStreak: number;
  bestStreak: number;
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** XP approximation: same rates the app grants live (see lib/utils XP_RATES). */
const XP_PER_BLOCK_HOUR = 40; // blockReward ≈ minutes/60 * rate
const XP_PER_FOCUS_HOUR = 50;

export function buildWeeklyReport(
  categoryTargets: WeeklyCategoryTarget[],
  allFocusSessions: FocusSession[],
  streak: DailyStreakState,
  daySchedulesCompleted: number,
  daySchedulesTotal: number,
): WeeklyReport {
  const today = startOfDay(new Date());
  const weekAgo = new Date(today.getTime() - 6 * 86400000);

  // Focus sessions of the last 7 days only.
  const recent = allFocusSessions.filter((s) => {
    const stamp = s.completedAt || s.date;
    const d = new Date(stamp || Date.now());
    return d >= weekAgo && d <= new Date(today.getTime() + 86400000);
  });
  const focusMinutes = recent.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  // Domains: completed vs weekly target (the app's own tracking unit).
  const domains = categoryTargets
    .filter((t) => (t.targetHours ?? 0) > 0)
    .map((t) => ({
      label: t.label,
      hours: Math.round((t.completedHours || 0) * 10) / 10,
      targetHours: t.targetHours,
    }))
    .sort((a, b) => b.hours - a.hours);

  const topDomain = domains.length > 0 ? { label: domains[0].label, hours: domains[0].hours } : null;

  const xpGained =
    Math.round(daySchedulesCompleted * 0.75 * XP_PER_BLOCK_HOUR) + // rough per-block average
    Math.round((focusMinutes / 60) * XP_PER_FOCUS_HOUR);

  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const weekStart = new Date(today.getTime() - 6 * 86400000);

  return {
    weekLabel: `Semaine du ${fmt(weekStart)} au ${fmt(today)}`,
    xpGained,
    blocksCompleted: daySchedulesCompleted,
    blocksTotal: daySchedulesTotal,
    focusMinutes,
    focusSessions: recent.length,
    topDomain,
    domains,
    currentStreak: streak.currentStreak,
    bestStreak: streak.bestStreak,
  };
}

/** Short push-notification body for the Sunday evening reminder. */
export function weeklyReportPushBody(report: WeeklyReport): string {
  const top = report.topDomain ? ` Top : ${report.topDomain.label}.` : '';
  return `${report.xpGained} XP gagnés cette semaine. Série de ${report.currentStreak} jours.${top} Ton rapport t'attend.`;
}

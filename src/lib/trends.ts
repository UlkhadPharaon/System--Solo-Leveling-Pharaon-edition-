/**
 * Trend analytics (F5) — multi-week aggregation for the Progress Dashboard.
 *
 * The dashboard previously showed only the CURRENT week; long-term trajectory
 * — the whole point of tracking — was invisible. This derives an N-week series
 * from data the app already stores (focus sessions, workout sessions).
 *
 * Pure functions: no React, no storage access.
 */

export interface TrendPoint {
  /** Human label, e.g. "S32" (ISO week) or "12/08". */
  label: string;
  /** ISO date of the week's Monday (YYYY-MM-DD). */
  weekStart: string;
  focusMinutes: number;
  focusSessions: number;
  workoutMinutes: number;
  workoutSessions: number;
}

interface DatedSession {
  durationMinutes: number;
  /** Best-effort timestamp field(s), same tolerance as weeklyReport.ts. */
  completedAt?: string | Date;
  date?: string | Date;
}

function sessionDate(s: DatedSession): Date {
  const stamp = s.completedAt || s.date || Date.now();
  return new Date(stamp);
}

function mondayOf(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  const dow = (c.getDay() + 6) % 7; // 0 = Monday
  c.setDate(c.getDate() - dow);
  return c;
}

/** "S<isoweek>" — good enough for chart axis labels. */
function isoWeekLabel(d: Date): string {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3); // nearest Thursday
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const week =
    1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  return `S${week}`;
}

/**
 * Build a continuous series of the LAST `weeks` weeks (oldest → newest),
 * ending with the current week. Weeks without sessions appear as zeros so
 * gaps stay visible in the chart instead of silently disappearing.
 */
export function buildWeeklyTrends(
  focusSessions: DatedSession[],
  workoutSessions: DatedSession[],
  weeks = 8,
): TrendPoint[] {
  const thisMonday = mondayOf(new Date());
  const points: TrendPoint[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(thisMonday.getTime() - i * 7 * 86400000);
    const end = new Date(start.getTime() + 7 * 86400000);
    points.push({
      label: isoWeekLabel(start),
      weekStart: start.toISOString().split('T')[0],
      focusMinutes: 0,
      focusSessions: 0,
      workoutMinutes: 0,
      workoutSessions: 0,
    });
    void end;
  }

  const bucketOf = (d: Date): number => {
    const mon = mondayOf(d).getTime();
    const idx = Math.round((thisMonday.getTime() - mon) / (7 * 86400000));
    return weeks - 1 - idx; // oldest-first index; outside range → <0 or ≥weeks
  };

  const add = (s: DatedSession, key: 'focus' | 'workout') => {
    const idx = bucketOf(sessionDate(s));
    if (idx < 0 || idx >= weeks) return;
    const p = points[idx];
    if (key === 'focus') {
      p.focusMinutes += s.durationMinutes || 0;
      p.focusSessions += 1;
    } else {
      p.workoutMinutes += s.durationMinutes || 0;
      p.workoutSessions += 1;
    }
  };

  focusSessions.forEach((s) => add(s, 'focus'));
  workoutSessions.forEach((s) => add(s, 'workout'));

  return points;
}

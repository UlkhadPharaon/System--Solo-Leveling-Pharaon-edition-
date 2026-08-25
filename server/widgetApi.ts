/**
 * Widget data snapshot API (server-side).
 *
 * Single authenticated-by-knowledge endpoint that renders the user's current
 * app state into the compact JSON shape every widget surface consumes:
 *   - the in-app widget host,
 *   - the desktop Document-PiP companion window (same origin),
 *   - future native Android companions.
 *
 * Security: the token is compared with a timing-safe equality against
 * WIDGET_TOKEN from the environment. Without a configured token the endpoint is
 * disabled (403) — never an open data leak. The response carries no secrets,
 * only derived aggregates (counts, hours, streaks) — same class of data the
 * PWA already shows on its dashboard.
 */

import { Request, Response } from 'express';
import { timingSafeEqual } from 'crypto';

export interface WidgetSnapshotInput {
  playerProfile: {
    level: number;
    xp: number;
    xpToNextLevel: number;
    rank: string;
    gold: number;
    dailyQuests?: { isCompleted: boolean }[];
  } | null;
  todayBlocks: { id: string; title: string; startTime: string; endTime: string; isCompleted: boolean; category: string }[];
  categoryTargets: { id: string; label: string; targetHours: number; completedHours: number }[];
  streakCount: number;
  notesTotal: number;
  focusSessionsTodayMinutes: number;
  focusSessionsTotal: number;
}

/** Timing-safe string compare (both sides hashed to equal length). */
function safeEq(a: string, b: string): boolean {
  const ha = require('crypto').createHash('sha256').update(a).digest();
  const hb = require('crypto').createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function widgetTokenFromEnv(): string | null {
  const t = process.env.WIDGET_TOKEN;
  return t && t.length >= 16 ? t : null;
}

export function handleWidgetSnapshot(req: Request, res: Response, input: WidgetSnapshotInput): void {
  const token = widgetTokenFromEnv();
  if (!token) {
    res.status(403).json({ error: 'Widget API disabled: WIDGET_TOKEN not configured.' });
    return;
  }
  const provided = String(req.get('X-Widget-Token') || req.query.token || '');
  if (!provided || !safeEq(provided, token)) {
    res.status(401).json({ error: 'Invalid widget token.' });
    return;
  }

  const quests = input.playerProfile?.dailyQuests ?? [];
  const questsDone = quests.filter((q) => q.isCompleted).length;
  const blocksDone = input.todayBlocks.filter((b) => b.isCompleted).length;

  res.json({
    generatedAt: new Date().toISOString(),
    player: {
      level: input.playerProfile?.level ?? 1,
      rank: input.playerProfile?.rank ?? 'E',
      xp: input.playerProfile?.xp ?? 0,
      xpToNextLevel: input.playerProfile?.xpToNextLevel ?? 100,
      gold: input.playerProfile?.gold ?? 0,
    },
    streakDays: input.streakCount,
    today: {
      date: new Date().toISOString().slice(0, 10),
      sessions: input.todayBlocks.map((b) => ({
        title: b.title,
        start: b.startTime,
        end: b.endTime,
        done: b.isCompleted,
      })),
      completedSessions: blocksDone,
      totalSessions: input.todayBlocks.length,
    },
    quests: { done: questsDone, total: quests.length },
    weeklyTargets: input.categoryTargets.map((t) => ({
      label: t.label,
      hours: Math.round((t.completedHours || 0) * 10) / 10,
      target: Math.round((t.targetHours || 0) * 10) / 10,
    })),
    focus: {
      minutesToday: Math.round(input.focusSessionsTodayMinutes),
      sessionsTotal: input.focusSessionsTotal,
    },
    notes: input.notesTotal,
    deepLinks: {
      dashboard: '/?tab=dashboard',
      focus: '/?tab=focus_timer',
      notes: '/?tab=notepad',
      system: '/?tab=system_solo',
    },
  });
}

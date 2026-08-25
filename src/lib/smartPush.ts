/**
 * Intelligent push scheduling (F6) — the VAPID infra existed but only sent
 * fixed-time pushes. This derives CONTEXTUAL reminders from the user's live
 * local state and registers them with /api/push/schedule:
 *
 *  1. Evening quest reminder — today's uncompleted blocks, at the user's
 *     preferred hour (personalization.questReminderHour, default 19h).
 *     Silent when everything is already done (no nagging).
 *  2. Streak-at-risk reminder — next morning if today ends with zero activity
 *     and the streak is ≥3 days (the ones worth protecting).
 *
 * Both are re-registered on every relevant state change and at boot, so a
 * server restart or an edited schedule self-heals. All functions are pure
 * planners: they return the payloads, App.tsx performs the side effects.
 */

import type { RoutineBlock } from '../types';

export interface PlannedPush {
  id: string;
  fireAt: Date;
  payload: { title: string; body: string; tag: string; url: string; icon: string };
}

/** Uncompleted blocks of a day's schedule. */
export function pendingBlocks(blocks: RoutineBlock[] | undefined): RoutineBlock[] {
  if (!blocks || blocks.length === 0) return [];
  return blocks.filter((b) => !b.isCompleted);
}

/** Human summary for the evening reminder: "3 quêtes restantes". */
export function questReminderBody(blocks: RoutineBlock[]): { count: number; titles: string } {
  const names = blocks.slice(0, 3).map((b) => b.title);
  const more = blocks.length > 3 ? ` +${blocks.length - 3}` : '';
  return { count: blocks.length, titles: `${names.join(', ')}${more}` };
}

/**
 * Today's evening reminder, or null when there is nothing left to do.
 * `now` is injectable for tests.
 */
export function planQuestReminder(
  todayBlocks: RoutineBlock[] | undefined,
  reminderHour: number,
  now = new Date(),
): PlannedPush | null {
  const remaining = pendingBlocks(todayBlocks);
  if (remaining.length === 0) return null;

  // Already past the reminder hour → don't schedule for today; tomorrow's
  // registration will handle it if still relevant.
  const fireAt = new Date(now);
  fireAt.setHours(Math.min(23, Math.max(0, reminderHour)), 0, 0, 0);
  if (fireAt.getTime() <= now.getTime()) return null;

  const { count, titles } = questReminderBody(remaining);
  const key = `qrem-${fireAt.toISOString().slice(0, 10)}`;
  return {
    id: key,
    fireAt,
    payload: {
      title: 'Quêtes du jour en attente',
      body:
        count === 1
          ? `Il reste 1 quête : ${titles}. Le Système attend.`
          : `${count} quêtes restantes : ${titles}.`,
      tag: key,
      url: '/?tab=dashboard',
      icon: '/icon-192.png',
    },
  };
}

/**
 * Morning streak-rescue reminder for YESTERDAY'S missed activity.
 * Scheduled in the morning so it lands before the new day slips away.
 */
export function planStreakRescue(
  currentStreak: number,
  lastActiveDate: string | null,
  rescueHour = 8,
  now = new Date(),
): PlannedPush | null {
  // Only protect streaks that carry weight; casual users get no guilt trips.
  if (currentStreak < 3) return null;
  if (!lastActiveDate) return null;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400000);
  const ymd = (d: Date) => d.toISOString().split('T')[0];

  // lastActiveDate === yesterday means the streak engine hasn't registered
  // "today" yet but nothing is lost yet either → no alert needed.
  if (lastActiveDate >= ymd(today)) return null;
  if (lastActiveDate >= ymd(yesterday)) return null;

  const fireAt = new Date(now);
  fireAt.setHours(Math.min(23, Math.max(0, rescueHour)), 0, 0, 0);
  // It's already later than the rescue hour → firing now would be noise.
  if (fireAt.getTime() <= now.getTime()) return null;

  const key = `sres-${ymd(today)}`;
  return {
    id: key,
    fireAt,
    payload: {
      title: 'Votre série est menacée',
      body: `Série de ${currentStreak} jours en jeu. Une session aujourd'hui la maintient en vie.`,
      tag: key,
      url: '/?tab=dashboard',
      icon: '/icon-192.png',
    },
  };
}

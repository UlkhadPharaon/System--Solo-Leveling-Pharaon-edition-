/**
 * Push delivery core (server-side) — extracted from server.ts so the pure
 * planning/normalization logic is unit-testable without HTTP or real VAPID
 * credentials.
 *
 * Storage model (single-user personal app, but multi-device ready):
 *  - data/push-subscriptions.json : { subscriptions: StoredSubscription[] }
 *    Multiple devices/browsers per user; each entry keyed by endpoint.
 *  - data/push-schedule.json      : { schedules: ScheduledPush[] }  — survives
 *    server restarts (the old in-memory Map silently dropped every scheduled
 *    reminder on redeploy).
 *  - data/push-log.json           : ring buffer of the last N delivery results,
 *    surfaced via /api/push/status so a broken setup is diagnosable instead of
 *    "notifications just don't come".
 */

import type { WebPushError } from 'web-push';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime: number | null;
  /** ISO date of last successful interaction — used for stale cleanup. */
  createdAt: string;
  /** Free-form device label for the status UI ("Chrome desktop", "Pixel"...). */
  label?: string;
}

export interface NotificationCategoryDef {
  id: string;
  label: string;
  description: string;
}

export interface PushPayloadShape {
  title: string;
  body?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  url?: string;
  category?: string;
  actions?: { action: string; title: string; icon?: string }[];
  data?: Record<string, unknown>;
}

export interface ScheduledPush {
  id: string;
  fireAt: number; // epoch ms
  payload: PushPayloadShape;
  subscriptionEndpoint?: string; // null → fan out to all subscriptions
}

export interface DeliveryLogEntry {
  at: number;
  endpoint: string; // truncated for logs
  ok: boolean;
  statusCode?: number;
  error?: string;
  pruned: boolean;
  title: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers (unit-tested)
// ─────────────────────────────────────────────────────────────────────────────

/** Validates any client-supplied subscription shape into a canonical one. */
export function normalizeSubscription(raw: unknown): StoredSubscription | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, any>;
  const endpointRef = obj.subscription ?? obj;
  const endpoint: string | undefined = endpointRef.endpoint || obj.endpoint;
  const p256dh: string | undefined = endpointRef?.keys?.p256dh;
  const auth: string | undefined = endpointRef?.keys?.auth;
  if (
    typeof endpoint !== 'string' || !endpoint.startsWith('https://') ||
    typeof p256dh !== 'string' || !p256dh ||
    typeof auth !== 'string' || !auth
  ) return null;
  return {
    endpoint,
    keys: { p256dh, auth },
    expirationTime:
      typeof endpointRef.expirationTime === 'number' ? endpointRef.expirationTime : null,
    createdAt: new Date().toISOString(),
  };
}

/** Merge-by-endpoint upsert. Returns the new list (pure). */
export function upsertSubscription(
  list: StoredSubscription[],
  sub: StoredSubscription,
  max = 20
): StoredSubscription[] {
  const next = list.filter((s) => s.endpoint !== sub.endpoint);
  // Preserve original createdAt when refreshing an existing endpoint.
  const prev = list.find((s) => s.endpoint === sub.endpoint);
  const merged = prev ? { ...sub, createdAt: prev.createdAt, label: prev.label ?? sub.label } : sub;
  next.unshift(merged);
  return next.slice(0, max);
}

/** Remove one endpoint (pure). */
export function removeSubscription(list: StoredSubscription[], endpoint: string): StoredSubscription[] {
  return list.filter((s) => s.endpoint !== endpoint);
}

/**
 * Classify a web-push failure: `prunable` means the push service answered that
 * this subscription is dead (410 Gone / 404 / 403 / 400 invalid) and must be
 * removed; otherwise the failure is transient (network, 5xx, 429 rate limit).
 */
export function classifyPushError(err: unknown): { prunable: boolean; statusCode?: number } {
  const e = err as WebPushError | undefined;
  const code = e?.statusCode;
  if (code === 404 || code === 410 || code === 403 || code === 400) {
    return { prunable: true, statusCode: code };
  }
  return { prunable: false, statusCode: code };
}

/** Truncate an endpoint for safe logging (never log full capability URLs). */
export function truncateEndpoint(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    return `${url.host}${url.pathname.slice(0, 24)}…`;
  } catch {
    return endpoint.slice(0, 40);
  }
}

/**
 * Due-schedule selection (pure): returns the entries whose fireAt has passed.
 * `maxMissedMs` drops schedules older than that (e.g. a session reminder from
 * three days ago is noise, not signal).
 */
export function selectDueSchedules(
  schedules: ScheduledPush[],
  now: number,
  maxMissedMs = 12 * 3600 * 1000
): ScheduledPush[] {
  return schedules.filter((s) => {
    const missedFor = now - s.fireAt;
    return missedFor >= 0 && missedFor <= maxMissedMs;
  });
}

/** Ring-buffer append for the delivery log (pure). */
export function appendDeliveryLog(
  log: DeliveryLogEntry[],
  entry: Omit<DeliveryLogEntry, 'at'>,
  cap = 200
): DeliveryLogEntry[] {
  const next = [{ ...entry, at: Date.now() }, ...log];
  return next.slice(0, cap);
}

/** Default notification categories — extensible, never hard-coded at call sites. */
export const NOTIFICATION_CATEGORIES: NotificationCategoryDef[] = [
  { id: 'schedule', label: 'Sessions & emploi du temps', description: 'Rappels avant le début des sessions planifiées.' },
  { id: 'quests', label: 'Quêtes du jour', description: 'Rappel du soir et quêtes en attente.' },
  { id: 'streak', label: 'Série & régularité', description: 'Alertes de série en danger.' },
  { id: 'rewards', label: 'Récompenses', description: 'Niveaux, rangs, bonus quotidiens.' },
  { id: 'system', label: 'Système', description: 'Notifications techniques de la plateforme.' },
];

/** Server-side category gate: unknown/absent category defaults to allowed. */
export function isCategoryAllowed(category: string | undefined, disabled: Set<string>): boolean {
  if (!category) return true;
  return !disabled.has(category);
}

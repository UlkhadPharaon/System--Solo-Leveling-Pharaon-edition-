/**
 * Stateful Web-Push manager — owns persistence (data/*.json), the web-push
 * transport, retries, dead-subscription pruning and the delivery log.
 * Pure logic lives in ./pushCore (unit-tested); everything touching fs/network
 * is here so tests can cover the rules without side effects.
 */

import fs from 'fs';
import path from 'path';
import webpush from 'web-push';
import {
  StoredSubscription,
  ScheduledPush,
  PushPayloadShape,
  DeliveryLogEntry,
  NotificationCategoryDef,
  NOTIFICATION_CATEGORIES,
  normalizeSubscription,
  upsertSubscription,
  removeSubscription,
  classifyPushError,
  truncateEndpoint,
  selectDueSchedules,
  appendDeliveryLog,
} from './pushCore';

const DATA_DIR = path.join(process.cwd(), 'data');
const SUBS_FILE = path.join(DATA_DIR, 'push-subscriptions.json');
const SCHEDULE_FILE = path.join(DATA_DIR, 'push-schedule.json');
const LOG_FILE = path.join(DATA_DIR, 'push-log.json');
const PREFS_FILE = path.join(DATA_DIR, 'push-prefs.json');

/** Per-category TTL/urgency — a late "session starts now" is worthless. */
const CATEGORY_TTL_SEC: Record<string, number> = {
  schedule: 3600,
  quests: 6 * 3600,
  streak: 12 * 3600,
  rewards: 24 * 3600,
  system: 24 * 3600,
};
const DEFAULT_TTL_SEC = 24 * 3600;

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, value: unknown): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
  } catch (e) {
    console.error('[push] failed to persist', path.basename(file), e);
  }
}

export interface PushSendResult {
  ok: boolean;
  delivered: number;
  failed: number;
  pruned: number;
  skippedNoSubscription?: boolean;
}

export class PushManager {
  private subs: StoredSubscription[] = [];
  private schedules: ScheduledPush[] = [];
  private log: DeliveryLogEntry[] = [];
  private disabledCategories = new Set<string>();
  private enabled: boolean;

  constructor(
    vapidPublicKey: string,
    private vapidPrivateKey: string,
    private subject: string
  ) {
    this.enabled = !!(vapidPublicKey && vapidPrivateKey);
    if (this.enabled) {
      webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);
    }
    // Legacy single-subscription file ({endpoint…}) migrates transparently.
    const rawSubs = readJson<any>(SUBS_FILE, { subscriptions: [] });
    const legacyList: any[] = Array.isArray(rawSubs) ? rawSubs : rawSubs?.subscriptions ?? [];
    this.subs = legacyList
      .map((s) => normalizeSubscription(s))
      .filter((s): s is StoredSubscription => s !== null);
    this.schedules = readJson<{ schedules: ScheduledPush[] }>(SCHEDULE_FILE, { schedules: [] }).schedules ?? [];
    this.log = readJson<{ entries: DeliveryLogEntry[] }>(LOG_FILE, { entries: [] }).entries ?? [];
    this.disabledCategories = new Set(readJson<{ disabled: string[] }>(PREFS_FILE, { disabled: [] }).disabled ?? []);
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  get categories(): NotificationCategoryDef[] {
    return NOTIFICATION_CATEGORIES;
  }

  status() {
    return {
      enabled: this.enabled,
      subscriptionCount: this.subs.length,
      subscriptions: this.subs.map((s) => ({
        endpoint: truncateEndpoint(s.endpoint),
        createdAt: s.createdAt,
        label: s.label,
      })),
      scheduledCount: this.schedules.length,
      categories: NOTIFICATION_CATEGORIES.map((c) => ({
        ...c,
        disabled: this.disabledCategories.has(c.id),
      })),
      recentDeliveries: this.log.slice(0, 20),
    };
  }

  subscribe(raw: unknown): { ok: true; count: number } | { ok: false } {
    const sub = normalizeSubscription(raw);
    if (!sub || !this.enabled) return { ok: false };
    this.subs = upsertSubscription(this.subs, sub);
    writeJson(SUBS_FILE, { subscriptions: this.subs });
    return { ok: true, count: this.subs.length };
  }

  /** Attach/update a human label for the device row in the settings UI. */
  labelSubscription(endpoint: string, label: string): void {
    this.subs = this.subs.map((s) =>
      s.endpoint === endpoint ? { ...s, label: String(label).slice(0, 60) } : s
    );
    writeJson(SUBS_FILE, { subscriptions: this.subs });
  }

  unsubscribe(endpoint?: string): void {
    if (!endpoint) {
      this.subs = [];
    } else {
      this.subs = removeSubscription(this.subs, endpoint);
    }
    writeJson(SUBS_FILE, { subscriptions: this.subs });
  }

  setDisabledCategories(disabled: unknown): void {
    if (!Array.isArray(disabled)) return;
    const valid = new Set(NOTIFICATION_CATEGORIES.map((c) => c.id));
    this.disabledCategories = new Set(
      disabled.filter((c): c is string => typeof c === 'string' && valid.has(c))
    );
    writeJson(PREFS_FILE, { disabled: [...this.disabledCategories] });
  }

  /**
   * Normalize any caller payload into the canonical wire shape. Returns null
   * when the payload is invalid (missing title).
   */
  normalizePayload(input: any): PushPayloadShape | null {
    if (!input || typeof input.title !== 'string' || !input.title.trim()) return null;
    const category = typeof input.category === 'string' ? input.category : undefined;
    return {
      title: input.title.trim().slice(0, 120),
      body: typeof input.body === 'string' ? input.body.slice(0, 300) : '',
      tag: typeof input.tag === 'string' ? input.tag.slice(0, 80) : '',
      icon: typeof input.icon === 'string' ? input.icon : '/icon-192.png',
      badge: '/icon-192.png',
      url: typeof input.url === 'string' ? input.url : '/',
      category,
      actions: Array.isArray(input.actions)
        ? input.actions.slice(0, 3).filter((a: any) => a && typeof a.action === 'string' && typeof a.title === 'string')
        : undefined,
      data: input.data && typeof input.data === 'object' ? input.data : {},
    };
  }

  async send(payloadInput: any): Promise<PushSendResult> {
    const payload = this.normalizePayload(payloadInput);
    if (!payload) return { ok: false, delivered: 0, failed: 0, pruned: 0 };
    if (!this.enabled) return { ok: false, delivered: 0, failed: 0, pruned: 0 };
    if (this.subs.length === 0) {
      this.record('none', false, undefined, 'no-subscription', payload);
      return { ok: true, delivered: 0, failed: 0, pruned: 0, skippedNoSubscription: true };
    }

    let delivered = 0;
    let failed = 0;
    let pruned = 0;
    const ttlSec = CATEGORY_TTL_SEC[payload.category ?? ''] ?? DEFAULT_TTL_SEC;
    const urgency = payload.category === 'schedule' ? 'high' : 'normal';

    for (const sub of [...this.subs]) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys, expirationTime: sub.expirationTime },
          JSON.stringify(payload),
          { TTL: ttlSec, headers: { Urgency: urgency } }
        );
        delivered++;
        this.record(sub.endpoint, true, 201, undefined, payload);
      } catch (err) {
        const { prunable, statusCode } = classifyPushError(err);
        this.record(sub.endpoint, false, statusCode, (err as Error)?.message, payload);
        if (prunable) {
          this.subs = removeSubscription(this.subs, sub.endpoint);
          pruned++;
        } else {
          failed++;
        }
      }
    }
    if (pruned > 0) writeJson(SUBS_FILE, { subscriptions: this.subs });
    return { ok: delivered > 0 || failed === 0, delivered, failed, pruned };
  }

  schedule(id: string, fireAtMs: number, payloadInput: any): boolean {
    const payload = this.normalizePayload(payloadInput);
    if (!payload || !id || !Number.isFinite(fireAtMs)) return false;
    this.schedules = [
      ...this.schedules.filter((s) => s.id !== id),
      { id: String(id).slice(0, 120), fireAt: fireAtMs, payload },
    ].slice(0, 100);
    writeJson(SCHEDULE_FILE, { schedules: this.schedules });
    return true;
  }

  cancelSchedule(id: string): boolean {
    const before = this.schedules.length;
    this.schedules = this.schedules.filter((s) => s.id !== id);
    writeJson(SCHEDULE_FILE, { schedules: this.schedules });
    return this.schedules.length < before;
  }

  listSchedules(): ScheduledPush[] {
    return this.schedules;
  }

  /** Fire due scheduled pushes; drop ones too old to still matter. */
  async tick(now = Date.now()): Promise<void> {
    if (!this.enabled || this.schedules.length === 0) return;
    const due = selectDueSchedules(this.schedules, now);
    if (due.length === 0) return;
    this.schedules = this.schedules.filter((s) => !due.some((d) => d.id === s.id));
    writeJson(SCHEDULE_FILE, { schedules: this.schedules });
    for (const s of due) {
      // One retry for transient failures keeps reminder delivery honest
      // without ever blocking the next tick.
      let result = await this.send(s.payload);
      if (!result.ok && !result.skippedNoSubscription && result.failed > 0) {
        await new Promise((r) => setTimeout(r, 2000));
        result = await this.send(s.payload);
      }
      if (!result.ok && result.skippedNoSubscription) break;
    }
  }

  /** Drop subscriptions unused for 60 days (stale devices). */
  pruneStale(maxAgeDays = 60): number {
    const cutoff = Date.now() - maxAgeDays * 86400000;
    const before = this.subs.length;
    this.subs = this.subs.filter((s) => new Date(s.createdAt).getTime() > cutoff);
    if (this.subs.length !== before) writeJson(SUBS_FILE, { subscriptions: this.subs });
    return before - this.subs.length;
  }

  private record(
    endpoint: string,
    ok: boolean,
    statusCode: number | undefined,
    error: string | undefined,
    payload: PushPayloadShape
  ): void {
    this.log = appendDeliveryLog(this.log, {
      endpoint: truncateEndpoint(endpoint),
      ok,
      statusCode,
      error: error?.slice(0, 160),
      pruned: false,
      title: payload.title,
    });
    writeJson(LOG_FILE, { entries: this.log.slice(0, 50) });
  }
}

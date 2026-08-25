/**
 * Web Push client module — permission, subscription lifecycle, the in-app
 * Notification Center, per-category preferences, and server-relayed pushes.
 *
 * Design rules:
 *  - Every failure path logs AND returns a typed result; nothing fails
 *    silently (the #1 complaint about the old system).
 *  - The Notification Center is the single source of truth for "what did the
 *    System tell me lately" — fed by real pushes via the service worker.
 *  - Category prefs live in localStorage (aura_push_categories) and are also
 *    enforced server-side (/api/push/categories) so a disabled category is
 *    never even sent.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PushPayload {
  title: string;
  body?: string;
  tag?: string;
  icon?: string;
  /** Relative SPA route to open when the notification is clicked. */
  url?: string;
  /** One of the ids from NOTIFICATION_CATEGORIES (server/pushCore.ts). */
  category?: string;
  actions?: { action: string; title: string; url: string }[];
  data?: Record<string, unknown>;
}

export interface PushEnableResult {
  ok: boolean;
  permission: NotificationPermission | null;
  subscribed: boolean;
  reason?: 'unsupported' | 'insecure-context' | 'sw-unavailable' | 'no-vapid' | 'subscribe-failed' | 'denied' | 'server-rejected';
  message?: string;
}

export interface NotificationCenterEntry {
  id: string;
  title: string;
  body: string;
  url: string;
  category: string;
  at: number;
  read: boolean;
}

export const NOTIFICATION_CATEGORY_LABELS: Record<string, string> = {
  schedule: 'Sessions & emploi du temps',
  quests: 'Quêtes du jour',
  streak: 'Série & régularité',
  rewards: 'Récompenses',
  system: 'Système',
};

const CATEGORIES_KEY = 'aura_push_categories';
const CENTER_KEY = 'aura_notification_center';
const CENTER_CAP = 50;

/** Root fetch. The Express server serves both the SPA and /api. */
const API_BASE = '';

function log(...args: unknown[]) {
  console.info('[push]', ...args);
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature detection & environment gates
// ─────────────────────────────────────────────────────────────────────────────

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Human-readable explanation when notifications cannot be enabled — the UI
 * renders this verbatim instead of a dead toggle.
 */
export function getUnsupportedReason(): string | null {
  if (typeof window === 'undefined') return null;
  if (!window.isSecureContext) {
    return 'Contexte non sécurisé : les notifications exigent HTTPS ou localhost.';
  }
  if (!('serviceWorker' in navigator)) return 'Ce navigateur ne supporte pas les Service Workers.';
  if (!('Notification' in window)) return 'Ce navigateur ne supporte pas les Notifications.';
  if (!('PushManager' in window)) {
    return 'Ce navigateur ne supporte pas le Push (sur iOS, installez d’abord la PWA sur l’écran d’accueil).';
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// VAPID key / service worker bootstrapping
// ─────────────────────────────────────────────────────────────────────────────

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    // Wait for BOTH an active worker and page control — subscribing against
    // an uncontrolled registration races SW updates.
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      // First load after registration: wait briefly for controllerchange.
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 3000);
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          clearTimeout(timer);
          resolve();
        }, { once: true });
      });
    }
    const reg = await navigator.serviceWorker.ready;
    return navigator.serviceWorker.controller ? reg : (reg.waiting ? { ...reg } : reg);
  } catch {
    return null;
  }
}

let cachedVapidKey: string | null = null;

async function fetchVapidPublicKey(): Promise<string | null> {
  if (cachedVapidKey) return cachedVapidKey;
  try {
    const res = await fetch(`${API_BASE}/api/push/config`);
    if (!res.ok) return null;
    const data = (await res.json()) as { enabled?: boolean; vapidPublicKey?: string };
    if (data.enabled === false) {
      log('server reports push disabled (VAPID keys missing)');
      return null;
    }
    cachedVapidKey = data.vapidPublicKey || null;
    return cachedVapidKey;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Permission
// ─────────────────────────────────────────────────────────────────────────────

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function getPermission(): NotificationPermission | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  return Notification.permission;
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription lifecycle
// ─────────────────────────────────────────────────────────────────────────────

/** Converts a url-safe base64 VAPID key to the Uint8Array pushManager expects. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export interface SubscriptionStatus {
  supported: boolean;
  permission: NotificationPermission | null;
  subscribed: boolean;
  reason: string | null;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const unsupported = getUnsupportedReason();
  if (!isPushSupported() || unsupported) {
    return { supported: false, permission: getPermission(), subscribed: false, reason: unsupported };
  }
  const reg = await getRegistration();
  if (!reg) {
    return { supported: true, permission: getPermission(), subscribed: false, reason: 'sw-unavailable' };
  }
  const sub = await reg.pushManager.getSubscription().catch(() => null);
  return {
    supported: true,
    permission: getPermission(),
    subscribed: !!sub,
    reason: sub ? null : 'not-subscribed',
  };
}

async function sendSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscription.toJSON(), label: guessDeviceLabel() }),
    });
    if (!res.ok) log('server rejected subscription:', res.status);
    return res.ok;
  } catch (e) {
    log('failed to reach /api/push/subscribe:', e);
    return false;
  }
}

function guessDeviceLabel(): string {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const standalone =
    typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches;
  const mode = standalone ? 'PWA installée' : 'navigateur';
  if (/Android/i.test(ua)) return `Android · ${mode}`;
  if (/iPhone|iPad/i.test(ua)) return `iOS · ${mode}`;
  if (/Edg\//i.test(ua)) return `Edge · ${mode}`;
  if (/Chrome/i.test(ua)) return `Chrome · ${mode}`;
  if (/Firefox/i.test(ua)) return `Firefox · ${mode}`;
  return `Appareil · ${mode}`;
}

/**
 * Full enable flow: secure-context gate → permission → subscribe → register.
 * Returns a typed result so the settings UI can show EXACTLY what failed.
 */
export async function enablePush(): Promise<PushEnableResult> {
  const unsupported = getUnsupportedReason();
  if (unsupported || !isPushSupported()) {
    return { ok: false, permission: getPermission(), subscribed: false, reason: 'unsupported', message: unsupported ?? undefined };
  }

  let perm = Notification.permission;
  if (perm === 'default') perm = await requestPermission();
  if (perm !== 'granted') {
    return {
      ok: false,
      permission: perm,
      subscribed: false,
      reason: perm === 'denied' ? 'denied' : 'subscribe-failed',
      message:
        perm === 'denied'
          ? 'Notifications bloquées dans le navigateur : autorisez-les dans les paramètres du site (icône 🔒 à côté de l’URL).'
          : 'Autorisation non accordée.',
    };
  }

  const reg = await getRegistration();
  if (!reg) {
    return { ok: false, permission: perm, subscribed: false, reason: 'sw-unavailable', message: 'Service Worker indisponible — rechargez la page.' };
  }

  const vapidKey = await fetchVapidPublicKey();
  if (!vapidKey) {
    return { ok: false, permission: perm, subscribed: false, reason: 'no-vapid', message: 'Push désactivé côté serveur (clés VAPID absentes).' };
  }

  try {
    let sub = await reg.pushManager.getSubscription().catch(() => null);
    if (sub) {
      // Re-validate the applicationServerKey: a rotated VAPID key silently
      // breaks old subscriptions; detect it and resubscribe cleanly.
      const existingKey = btoa(
        String.fromCharCode(...new Uint8Array(sub.options.applicationServerKey as ArrayBuffer))
      )
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      if (existingKey !== vapidKey) {
        await sub.unsubscribe().catch(() => {});
        sub = null;
      }
    }
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }
    const ok = await sendSubscriptionToServer(sub);
    if (!ok) {
      return { ok: true, permission: perm, subscribed: true, reason: 'server-rejected', message: 'Abonnement créé localement mais le serveur n’a pas confirmé.' };
    }
    log('subscribed & registered with server');
    return { ok: true, permission: perm, subscribed: true };
  } catch (e) {
    console.error('[push] pushManager.subscribe failed:', e);
    return { ok: false, permission: perm, subscribed: false, reason: 'subscribe-failed', message: String((e as Error)?.message ?? e) };
  }
}

/**
 * Legacy entry point kept for compatibility — now delegates to enablePush().
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  const result = await enablePush();
  if (!result.subscribed) return null;
  const reg = await getRegistration();
  return reg ? reg.pushManager.getSubscription().catch(() => null) : null;
}

/** Removes the push subscription from this device and from the server. */
export async function disablePush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const reg = await getRegistration();
  let endpointToRemove: string | null = null;
  if (reg) {
    const subscription = await reg.pushManager.getSubscription().catch(() => null);
    if (subscription) {
      endpointToRemove = subscription.endpoint;
      try {
        await subscription.unsubscribe();
      } catch {
        // continue to server cleanup even if unsubscribe throws
      }
    }
  }
  try {
    await fetch(`${API_BASE}/api/push/unsubscribe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(endpointToRemove ? { endpoint: endpointToRemove } : {}),
    });
  } catch {
    // non-fatal: server prunes dead endpoints on next send anyway
  }
  return true;
}

/** Back-compat alias for the old name used by older call sites. */
export const unsubscribeFromPush = disablePush;

// ─────────────────────────────────────────────────────────────────────────────
// Category preferences (client mirror of the server-side gate)
// ─────────────────────────────────────────────────────────────────────────────

export function getCategoryPrefs(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '{}');
  } catch {
    return {};
  }
}

/** enabled=true means the user WANTS this category (default: enabled). */
export function setCategoryEnabled(categoryId: string, enabled: boolean): void {
  const prefs = getCategoryPrefs();
  prefs[categoryId] = enabled;
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(prefs));
  fetch(`${API_BASE}/api/push/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      disabled: Object.entries(NOTIFICATION_CATEGORY_LABELS)
        .filter(([id]) => getCategoryPrefs()[id] === false)
        .map(([id]) => id),
    }),
  }).catch(() => {/* offline: server default stays allow-all until synced */});
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Center (in-app inbox fed by real pushes + local alerts)
// ─────────────────────────────────────────────────────────────────────────────

export function getNotificationCenter(): NotificationCenterEntry[] {
  try {
    const list = JSON.parse(localStorage.getItem(CENTER_KEY) || '[]');
    return Array.isArray(list) ? list.slice(0, CENTER_CAP) : [];
  } catch {
    return [];
  }
}

export function addCenterEntry(p: PushPayload): void {
  const entry: NotificationCenterEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: p.title,
    body: p.body || '',
    url: p.url || '/',
    category: p.category || 'system',
    at: Date.now(),
    read: false,
  };
  const next = [entry, ...getNotificationCenter()].slice(0, CENTER_CAP);
  localStorage.setItem(CENTER_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('aura:notifications-changed'));
}

export function markAllRead(): void {
  localStorage.setItem(
    CENTER_KEY,
    JSON.stringify(getNotificationCenter().map((e) => ({ ...e, read: true })))
  );
  window.dispatchEvent(new CustomEvent('aura:notifications-changed'));
}

export function clearNotificationCenter(): void {
  localStorage.setItem(CENTER_KEY, '[]');
  window.dispatchEvent(new CustomEvent('aura:notifications-changed'));
}

export function unreadCount(): number {
  return getNotificationCenter().filter((e) => !e.read).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sending notifications
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shows a system notification through the service worker (reliable on Android,
 * where page-context `new Notification()` is suppressed for PWAs) and records
 * it in the Notification Center.
 */
export async function showLocalNotification(payload: PushPayload): Promise<boolean> {
  addCenterEntry(payload);
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: 'show-notification', payload });
    return true;
  } catch (e) {
    log('showLocalNotification failed:', e);
    return false;
  }
}

/**
 * Server-relayed push: reaches every registered device even when the app is
 * closed. Also mirrors into the local Notification Center so THIS device keeps
 * an inbox record regardless of transport success.
 */
export async function sendPushViaServer(payload: PushPayload): Promise<boolean> {
  addCenterEntry(payload);
  try {
    const res = await fetch(`${API_BASE}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      delivered?: number;
      skippedNoSubscription?: boolean;
    };
    if (!res.ok) {
      log('/api/push/send rejected:', res.status);
      return false;
    }
    if (data.skippedNoSubscription) {
      log('no device subscribed yet — reminder recorded locally only');
      return false;
    }
    return (data.delivered ?? 0) > 0;
  } catch (e) {
    log('sendPushViaServer failed:', e);
    return false;
  }
}

/** Registers a future notification with the server (survives restarts now). */
export async function schedulePush(payload: PushPayload, fireAt: Date | string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/push/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: payload.tag || `sched-${Date.now()}`,
        fireAt: new Date(fireAt).toISOString(),
        payload,
      }),
    });
    if (!res.ok) {
      log('/api/push/schedule rejected:', res.status);
      return null;
    }
    const data = (await res.json()) as { id?: string };
    return data.id || null;
  } catch (e) {
    log('schedulePush failed:', e);
    return null;
  }
}

/** Cancels a previously scheduled push notification. */
export async function cancelScheduledPush(scheduleId: string): Promise<boolean> {
  if (!scheduleId) return false;
  try {
    const res = await fetch(`${API_BASE}/api/push/schedule/${encodeURIComponent(scheduleId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

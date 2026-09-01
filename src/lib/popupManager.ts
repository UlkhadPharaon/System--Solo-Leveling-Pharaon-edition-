/**
 * Popup notification manager — the missing "popup" layer.
 *
 * Two surfaces, one preference store:
 *  1) System popup  — Web Notification via the service worker (visible even when
 *     the tab is hidden / phone locked, if permission granted)
 *  2) In-app popup  — a pharaoh-styled toast overlay that fires even when
 *     permission is denied, so no hunter ever misses a nudge because they
 *     blocked the browser prompt.
 *
 * Quiet hours, per-category toggles, and frequency caps are enforced HERE so
 * every call site (streak rescue, quest reminder, session start) gets them for
 * free. Preferences live in `aura_popup_prefs` (local-only, not cloud synced
 * — notification UX is device-specific).
 */

import { addCenterEntry, showLocalNotification, sendPushViaServer } from './pushNotifications';
import { haptic } from './haptics';
import { playSfx } from './sfx';

// ── Types & storage ─────────────────────────────────────────────────────────

export type PopupCategory = 'session' | 'quest' | 'streak' | 'reward' | 'system' | 'ritual';

export interface PopupPrefs {
  enabled: boolean;               // master kill switch
  inAppEnabled: boolean;          // show the overlay toast
  systemEnabled: boolean;         // show the OS notification
  categories: Record<PopupCategory, boolean>;
  quietHours: { enabled: boolean; start: string; end: string }; // "22:00" - "07:00"
  frequencyCapMinutes: number;    // suppress duplicates within this window
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export const POPUP_PREFS_KEY = 'aura_popup_prefs';
const LAST_FIRE_KEY = 'aura_popup_last_fire';

const DEFAULT_PREFS: PopupPrefs = {
  enabled: true,
  inAppEnabled: true,
  systemEnabled: true,
  categories: {
    session: true,
    quest: true,
    streak: true,
    reward: true,
    system: true,
    ritual: true,
  },
  quietHours: { enabled: false, start: '22:00', end: '07:00' },
  frequencyCapMinutes: 5,
  soundEnabled: true,
  hapticsEnabled: true,
};

export function loadPopupPrefs(): PopupPrefs {
  try {
    const raw = localStorage.getItem(POPUP_PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      categories: { ...DEFAULT_PREFS.categories, ...(parsed.categories || {}) },
      quietHours: { ...DEFAULT_PREFS.quietHours, ...(parsed.quietHours || {}) },
    };
  } catch { return { ...DEFAULT_PREFS }; }
}

export function savePopupPrefs(p: PopupPrefs): void {
  localStorage.setItem(POPUP_PREFS_KEY, JSON.stringify(p));
  window.dispatchEvent(new CustomEvent('aura:popup-prefs-changed', { detail: p }));
}

// ── Quiet hours & frequency helpers ─────────────────────────────────────────

function isInQuietHours(prefs: PopupPrefs, now = new Date()): boolean {
  if (!prefs.quietHours.enabled) return false;
  const toMins = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  };
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = toMins(prefs.quietHours.start);
  const end = toMins(prefs.quietHours.end);
  if (start === end) return false;
  if (start < end) return cur >= start && cur < end;
  return cur >= start || cur < end; // overnight span
}

function isFrequencyCapped(tag: string | undefined, capMinutes: number): boolean {
  if (!tag || capMinutes <= 0) return false;
  try {
    const map: Record<string, number> = JSON.parse(localStorage.getItem(LAST_FIRE_KEY) || '{}');
    const last = map[tag];
    if (last && Date.now() - last < capMinutes * 60 * 1000) return true;
  } catch {}
  return false;
}
function stampFrequency(tag: string | undefined): void {
  if (!tag) return;
  try {
    const map: Record<string, number> = JSON.parse(localStorage.getItem(LAST_FIRE_KEY) || '{}');
    map[tag] = Date.now();
    // GC: keep at most 50 tags
    const entries = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,50);
    localStorage.setItem(LAST_FIRE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {}
}

// ── In-app popup (overlay toast) event ──────────────────────────────────────

export interface PopupRequest {
  title: string;
  body?: string;
  category?: PopupCategory;
  tag?: string;
  url?: string;
  icon?: string;
  actions?: { action: string; title: string; url: string }[];
  /** Force the in-app toast even if prefs would suppress system notification */
  forceInApp?: boolean;
}

export interface InAppPopup {
  id: string;
  title: string;
  body: string;
  category: PopupCategory;
  tag?: string;
  url: string;
  at: number;
}

type PopupListener = (popup: InAppPopup) => void;
const inAppListeners = new Set<PopupListener>();

export function onPopup(fn: PopupListener): () => void {
  inAppListeners.add(fn);
  return () => inAppListeners.delete(fn);
}

function emitInApp(popup: InAppPopup): void {
  inAppListeners.forEach(fn => fn(popup));
  window.dispatchEvent(new CustomEvent('aura:popup', { detail: popup }));
}

// ── Public fire function ─────────────────────────────────────────────────────

/**
 * Fire a popup notification through every enabled surface.
 * Returns which surfaces actually fired.
 */
export async function firePopup(req: PopupRequest): Promise<{
  inApp: boolean;
  system: boolean;
  pushedViaServer: boolean;
  suppressedReason?: string;
}> {
  const prefs = loadPopupPrefs();
  const category: PopupCategory = req.category || 'system';

  if (!prefs.enabled) return { inApp: false, system: false, pushedViaServer: false, suppressedReason: 'disabled' };
  if (prefs.categories[category] === false) return { inApp: false, system: false, pushedViaServer: false, suppressedReason: 'category-off' };
  if (isInQuietHours(prefs)) return { inApp: false, system: false, pushedViaServer: false, suppressedReason: 'quiet-hours' };
  if (isFrequencyCapped(req.tag, prefs.frequencyCapMinutes)) return { inApp: false, system: false, pushedViaServer: false, suppressedReason: 'frequency-cap' };

  const url = req.url || '/';
  const body = req.body || '';
  const title = req.title || 'Le Système';
  const tag = req.tag || undefined;

  let inAppFired = false;
  let systemFired = false;
  let pushed = false;

  // In-app toast: always honored when inAppEnabled (or forced), independent of permission.
  const shouldInApp = (prefs.inAppEnabled || !!req.forceInApp) && prefs.enabled;
  if (shouldInApp) {
    const popup: InAppPopup = { id: `${Date.now()}-${Math.random().toString(36).slice(2,6)}`, title, body, category, tag, url, at: Date.now() };
    emitInApp(popup);
    addCenterEntry({ title, body, url, category });
    if (prefs.soundEnabled) playSfx('system-popup', 0.6);
    if (prefs.hapticsEnabled) haptic('tap');
    inAppFired = true;
  }

  // System notification: only if permission granted and tab hidden OR explicitly wanted
  if (prefs.systemEnabled) {
    // Visible tab heuristic: if document is visible and we already showed in-app toast,
    // we still fire the system notification but with lower urgency (no requireInteraction).
    // If tab is hidden, system notification is the ONLY surface the user will see.
    const needSystem = !inAppFired || document.visibilityState === 'hidden';
    if (needSystem) {
      // Prefer server-relayed push when possible (reaches phone even if tab killed)
      try {
        pushed = await sendPushViaServer({ title, body, tag: tag || '', url, icon: req.icon || '/icon-192.png', category });
        systemFired = pushed;
      } catch { /* fallback to local */ }
      if (!pushed) {
        try {
          systemFired = await showLocalNotification({ title, body, tag: tag || '', url, icon: req.icon || '/icon-192.png', category, actions: req.actions, data: {} });
        } catch {}
      }
    } else {
      // Tab visible: also mirror to system tray quietly (user may have OS in DND)
      try { systemFired = await showLocalNotification({ title, body, tag: tag || '', url, icon: req.icon || '/icon-192.png', category }); } catch {}
    }
  }

  if (inAppFired || systemFired) stampFrequency(tag);
  return { inApp: inAppFired, system: systemFired, pushedViaServer: pushed };
}

// Convenience wrappers for the common categories

export function notifySessionStart(blockTitle: string, startTime: string, minutesUntil: number, category: string = 'session'): Promise<any> {
  const body = `Début dans ${Math.max(1, minutesUntil)} min (${startTime}). Catégorie : ${category.replace('_',' ').toUpperCase()}`;
  return firePopup({ title: `Session à venir : ${blockTitle}`, body, category: 'session', tag: `session-${blockTitle}-${startTime}`, url: '/?tab=dashboard' });
}

export function notifyQuestReminder(remaining: number): Promise<any> {
  return firePopup({
    title: remaining === 1 ? '1 quête encore ouverte' : `${remaining} quêtes encore ouvertes`,
    body: `Le Système te rappelle : ${remaining} quête(s) t’attendent aujourd’hui.`,
    category: 'quest',
    tag: `quest-reminder-${new Date().toISOString().slice(0,10)}`,
    url: '/?tab=dashboard',
  });
}

export function notifyStreakAtRisk(streak: number): Promise<any> {
  return firePopup({
    title: 'Série en danger — ne romps pas la chaîne',
    body: `Ta série de ${streak} jours va se briser. Ouvre Ka Rise et valide une quête maintenant.`,
    category: 'streak',
    tag: `streak-rescue-${new Date().toISOString().slice(0,10)}`,
    url: '/?tab=dashboard',
  });
}

export function notifyLevelUp(level: number): Promise<any> {
  return firePopup({
    title: `Niveau ${level} atteint — le Système te salue`,
    body: `Félicitations, Chasseur. Tu as franchi le niveau ${level}.`,
    category: 'reward',
    tag: `levelup-${level}`,
    url: '/?tab=system_solo',
  });
}

export const CATEGORY_LABELS: Record<PopupCategory, string> = {
  session: 'Sessions & emploi du temps',
  quest: 'Quêtes du jour',
  streak: 'Série & régularité',
  reward: 'Récompenses',
  system: 'Système',
  ritual: 'Rituel quotidien',
};

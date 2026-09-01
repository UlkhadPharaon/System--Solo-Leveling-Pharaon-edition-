/**
 * Homescreen widget + PWA install helper.
 *
 * Captures the `beforeinstallprompt` event (the only browser-provided way to
 * trigger an "Add to Home Screen" sheet programmatically) and exposes a small
 * state machine the UI can read:
 *   - isInstallable() — the browser thinks this PWA can be installed
 *   - isInstalled()   — already in standalone mode
 *   - triggerInstall()— shows the native install sheet, resolves to outcome
 *   - getPlatformInstructions() — human instructions per OS for manual add
 *   - syncWidgetData() — pushes current app state to /api/widgets/data and to
 *                        the service worker cache so manifest `widgets[]`
 *                        render instantly offline.
 */

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable' | 'already-installed';

let deferredPrompt: any | null = null;
let installable = false;
const listeners = new Set<() => void>();

function notify() { listeners.forEach(fn => fn()); }

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent Chrome's automatic mini-infobar; we show our own richer sheet.
    e.preventDefault();
    deferredPrompt = e as any;
    installable = true;
    notify();
    console.info('[pwa] beforeinstallprompt captured — install is available');
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installable = false;
    notify();
    console.info('[pwa] appinstalled — now in standalone');
  });
}

export function isInstallable(): boolean {
  return installable && !!deferredPrompt;
}

export function isInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true
      || document.referrer.includes('android-app://');
  } catch { return false; }
}

export function onInstallAvailabilityChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function triggerInstall(): Promise<InstallOutcome> {
  if (isInstalled()) return 'already-installed';
  if (!deferredPrompt) return 'unavailable';
  try {
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice as { outcome: 'accepted'|'dismissed' };
    const outcome = choice.outcome as InstallOutcome;
    deferredPrompt = null;
    installable = false;
    notify();
    return outcome;
  } catch {
    return 'dismissed';
  }
}

export type Platform = 'android' | 'ios' | 'desktop' | 'unknown';
export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator as any).platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isAndroid = /Android/.test(ua);
  if (isIOS) return 'ios';
  if (isAndroid) return 'android';
  if (/Windows|Mac|Linux/.test(ua)) return 'desktop';
  return 'unknown';
}

export function getPlatformInstructions(platform: Platform = detectPlatform()): {
  title: string;
  steps: string[];
  note?: string;
} {
  if (platform === 'ios') {
    return {
      title: 'Ajouter Ka Rise à l’écran d’accueil — iPhone / iPad',
      steps: [
        'Ouvrez Ka Rise dans Safari (pas Chrome).',
        'Appuyez sur l’icône Partager ⎙ en bas de l’écran.',
        'Faites défiler et choisissez « Sur l’écran d’accueil ».',
        'Confirmez avec « Ajouter ». L’icône dorée apparaît avec vos autres apps.',
      ],
      note: 'Sur iOS les vraies notifications push nécessitent d’avoir ajouté la PWA à l’écran d’accueil — ensuite autorisez-les depuis Personnaliser.',
    };
  }
  if (platform === 'android') {
    return {
      title: 'Ajouter à l’écran d’accueil — Android',
      steps: [
        'Ouvrez Ka Rise dans Chrome.',
        'Si la bannière « Installer » apparaît, appuyez sur Installer.',
        'Sinon : menu ⋮ en haut à droite → « Installer l’application » ou « Ajouter à l’écran d’accueil ».',
        'Confirmez. Le widget et les raccourcis (Quêtes, Focus, Notes) apparaissent sur l’écran d’accueil.',
      ],
      note: 'Sur Android 13+ le système propose aussi les widgets PWA : appui long sur l’icône Ka Rise → Widgets → choisissez Statut / Aujourd’hui / Objectifs Hebdo.',
    };
  }
  if (platform === 'desktop') {
    return {
      title: 'Installer Ka Rise — Ordinateur (PWA)',
      steps: [
        'Ouvrez Ka Rise dans Chrome ou Edge.',
        'Cherchez l’icône Installer ⊞ dans la barre d’adresse (à droite).',
        'Cliquez sur Installer — Ka Rise s’ouvre comme une vraie fenêtre, épinglable à la barre des tâches.',
        'Pour le « widget » bureau : Chrome/Edge 116+ → ouvrez la fenêtre PiP Déportée depuis le futur Atelier Widgets (bientôt).',
      ],
    };
  }
  return {
    title: 'Ajouter Ka Rise à l’écran d’accueil',
    steps: [
      'Ouvrez Ka Rise dans votre navigateur principal.',
      'Cherchez l’option Installer / Ajouter à l’écran d’accueil dans le menu du navigateur.',
      'Confirmez l’installation.',
    ],
  };
}

// ── Widget data sync ────────────────────────────────────────────────────────

export interface WidgetSyncPayload {
  player: { level: number; rank: string; xp: number; xpToNextLevel: number; gold: number };
  streakDays: number;
  today: { date: string; sessions: { title: string; start: string; end: string; done: boolean }[]; completedSessions: number; totalSessions: number };
  weeklyTargets: { label: string; hours: number; target: number }[];
  focus?: { minutesToday: number; sessionsTotal: number };
  notes?: number;
  generatedAt: string;
}

const WIDGET_SYNC_DEBOUNCE_MS = 3000;
let syncTimer: number | null = null;
let lastSyncJson = '';

export function syncWidgetData(payload: WidgetSyncPayload): void {
  const json = JSON.stringify(payload);
  if (json === lastSyncJson) return; // no change
  lastSyncJson = json;
  if (syncTimer) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => doSync(payload), WIDGET_SYNC_DEBOUNCE_MS) as unknown as number;
}

async function doSync(payload: WidgetSyncPayload) {
  const tags = ['ka-rise-status', 'ka-rise-today', 'ka-rise-weekly'] as const;
  // 1) Mirror into CacheStorage via service worker so widgets paint offline instantly
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      for (const tag of tags) {
        navigator.serviceWorker.controller.postMessage({ type: 'widget-data-update', tag, payload });
      }
    }
  } catch {}
  // 2) POST to server so the OS widget runtime (which fetches /api/widgets/data) sees it
  for (const tag of tags) {
    fetch(`/api/widgets/data?tag=${encodeURIComponent(tag)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag, payload }),
    }).catch(() => {});
  }
}

// Periodic background sync registration helper (best-effort)
export async function registerPeriodicWidgetRefresh(): Promise<boolean> {
  try {
    const reg: any = await navigator.serviceWorker?.ready;
    if (reg?.periodicSync && typeof reg.periodicSync.register === 'function') {
      await reg.periodicSync.register('widget-refresh', { minInterval: 15 * 60 * 1000 });
      return true;
    }
  } catch {}
  return false;
}

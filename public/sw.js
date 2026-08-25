const CACHE_NAME = 'ka-rise-v10';
// logo.webp (192 KB) replaces logo-complet.png (1.4 MB) in the pre-cache:
// the old shell made every fresh install download ~1.5 MB of logo alone.
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/favicon.ico', '/favicon.svg', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png', '/logo.webp'];
const DEFAULT_ICON = '/icon-192.png';
const DEFAULT_BADGE = '/icon-192.png';

// Install Event - Caching the app shell + tous les bundles hashés référencés
// par index.html (JS/CSS générés par Vite) pour un offline complet dès
// la première installation.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[Service Worker] Caching App Shell');
      await cache.addAll(APP_SHELL).catch(() => {});
      try {
        const indexResp = await fetch('/index.html', { cache: 'no-store' });
        const html = await indexResp.text();
        // Extrait les URLs des assets (script src=, link href=)
        const urls = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css|woff2|png|jpg|webp|svg))"/g)]
          .map((m) => m[1])
          .filter((u) => !u.startsWith('http') || u.includes('fonts.g'));
        if (urls.length) await cache.addAll(urls).catch(() => {});
        // Google Fonts CSS (nécessite les woff2 référencés — cachés via fetch runtime opaque)
        const fontCss = [...html.matchAll(/href="(https:\/\/fonts\.googleapis\.com[^"]+)"/g)].map((m) => m[1]);
        for (const css of fontCss) {
          try {
            const resp = await fetch(css);
            await cache.put(css, resp);
            const cssText = await resp.clone().text();
            const fonts = [...cssText.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map((m) => m[1]);
            await Promise.all(fonts.map(async (f) => {
              try { const fr = await fetch(f); await cache.put(f, fr); } catch { /* ignore */ }
            }));
          } catch { /* offline : les polices système prendront le relais */ }
        }
      } catch (e) {
        console.warn('[Service Worker] Pre-cache étendu ignoré', e);
      }
    })()
  );
  self.skipWaiting();
});

// Activate Event - Cleaning up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.map((c) => c !== CACHE_NAME ? caches.delete(c) : null))
    ).then(() => self.clients.claim())
  );
});

// Fetch Event — strategy per request kind.
//   • Navigations & same-origin dev/source files: NETWORK-FIRST so shipped UI
//     fixes actually reach installed devices; the cache only serves as the
//     offline fallback. (Everything used to be cache-first with a frozen
//     cache name, which pinned phones to an old broken build forever.)
//   • Hashed Vite bundles (/assets/…): cache-first — content-hashed names
//     make a cache hit always the right immutable file. Lazy-loaded tab
//     chunks (React.lazy) are cached on first visit of their tab; after the
//     user has opened every tab once, the whole app works offline.
//   • Google Fonts CDNs: cache-first with network fallback.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isHashedAsset = sameOrigin && url.pathname.startsWith('/assets/');
  const isFontCdn = url.hostname.includes('fonts.g');

  const putInCache = (response) => {
    if (response && response.status === 200) {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
    }
    return response;
  };
  const offlineFallback = () =>
    event.request.mode === 'navigate'
      ? caches.match('/index.html')
      : undefined;

  if (isHashedAsset || isFontCdn) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached ||
        fetch(event.request).then(putInCache).catch(() => offlineFallback())
      )
    );
    return;
  }

  // Network-first for HTML pages and dev-server source modules.
  event.respondWith(
    fetch(event.request)
      .then(putInCache)
      .catch(() =>
        caches.match(event.request).then((cached) => cached || offlineFallback())
      )
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Push Notifications
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonical payload (server/pushManager.ts normalizePayload):
 *   { title, body, tag, icon, badge, url, category, actions?, data }
 * Every field is defensively defaulted so a malformed push can never crash
 * the handler — a crashed push handler makes Chrome report delivery failure
 * and eventually kill the subscription.
 */
self.addEventListener('push', (event) => {
  let data = { title: 'Le Système', body: '', tag: '', url: '/', icon: DEFAULT_ICON, badge: DEFAULT_BADGE, actions: [], extras: {} };
  try {
    if (event.data) {
      const parsed = typeof event.data.json === 'function' ? event.data.json() : JSON.parse(event.data.text());
      if (parsed && typeof parsed === 'object') {
        data = {
          title: typeof parsed.title === 'string' && parsed.title ? parsed.title : data.title,
          body: typeof parsed.body === 'string' ? parsed.body : '',
          tag: typeof parsed.tag === 'string' ? parsed.tag : '',
          url: typeof parsed.url === 'string' ? parsed.url : '/',
          icon: typeof parsed.icon === 'string' ? parsed.icon : DEFAULT_ICON,
          badge: typeof parsed.badge === 'string' ? parsed.badge : DEFAULT_BADGE,
          actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 3) : [],
          extras: parsed.data && typeof parsed.data === 'object' ? parsed.data : {},
        };
      }
    }
  } catch (e) {
    // Malformed payload — show a generic fallback rather than nothing:
    // userVisibleOnly subscriptions REQUIRE a visible notification per push.
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag || undefined,
    renotify: !!data.tag,
    timestamp: Date.now(),
    requireInteraction: false,
    vibrate: [80, 40, 80],
    data: { url: data.url, category: data.category || 'system', ...data.extras },
    ...(data.actions.length ? { actions: data.actions } : {}),
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options).catch((err) => {
      console.error('[SW] showNotification failed:', err);
      // Last-resort generic notification so the push is never silently lost.
      return self.registration.showNotification('Le Système', {
        body: 'Nouvelle alerte — ouvrez l’application.',
        icon: DEFAULT_ICON,
        badge: DEFAULT_BADGE,
      });
    })
  );
});

// Handles in-app local notifications relayed from the client tab via postMessage.
self.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'show-notification' && msg.payload) {
    const p = msg.payload || {};
    event.waitUntil(
      self.registration.showNotification(String(p.title || 'Le Système'), {
        body: typeof p.body === 'string' ? p.body : '',
        icon: typeof p.icon === 'string' ? p.icon : DEFAULT_ICON,
        badge: DEFAULT_BADGE,
        tag: typeof p.tag === 'string' && p.tag ? p.tag : undefined,
        renotify: !!p.tag,
        vibrate: [80, 40, 80],
        data: { url: typeof p.url === 'string' ? p.url : '/' },
      }).catch(() => {})
    );
  }

  // Skip-waiting request from an updated page (future update UX).
  if (msg.type === 'skip-waiting') {
    self.skipWaiting();
  }
});

// Notification click — open (or focus) the PWA on the route encoded in the
// payload. Matching rule: same ORIGIN first (any route), because query-string
// matching (?tab=…) breaks on SPA boot URLs; then fall back to openWindow.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = new URL(
    (event.notification.data && event.notification.data.url) || '/',
    self.location.origin
  );
  const action = event.action; // undefined for plain clicks

  // Action buttons deep-link to their own routes when provided as data.
  const actionUrl =
    action && event.notification.data && event.notification.data.actionUrls &&
    event.notification.data.actionUrls[action];
  const finalUrl = actionUrl ? new URL(actionUrl, self.location.origin) : targetUrl;

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // 1. Any window of this origin → focus it and tell it where to navigate.
      for (const client of allClients) {
        if (client.url.startsWith(self.location.origin)) {
          await client.focus();
          client.postMessage({ type: 'navigate', url: finalUrl.href });
          return;
        }
      }
      // 2. No window → open one at the exact deep link.
      try {
        await self.clients.openWindow(finalUrl.href);
      } catch {
        await self.clients.openWindow('/');
      }
    })()
  );
});

// The page asks which route a focused window should land on after boot from
// a notification (defensive duplicate of the postMessage above kept simple).
self.addEventListener('notificationclose', (event) => {
  // Hook available for future analytics — intentionally silent today.
});

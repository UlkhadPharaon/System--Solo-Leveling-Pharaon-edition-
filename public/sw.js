const CACHE_NAME = 'ka-rise-v11';
// logo.webp (192 KB) replaces logo-complet.png (1.4 MB) in the pre-cache:
// the old shell made every fresh install download ~1.5 MB of logo alone.
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/favicon.ico', '/favicon.svg', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png', '/logo.webp', '/widgets/status-template.html', '/widgets/today-template.html', '/widgets/weekly-template.html', '/widgets/status-template.json', '/widgets/today-template.json', '/widgets/weekly-template.json'];
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

// ─────────────────────────────────────────────────────────────────────────────
// PWA Homescreen Widgets — Adaptive Cards runtime
// ─────────────────────────────────────────────────────────────────────────────
// Chrome 113+ (Desktop/ Android) dispatches `widgetinstall` when the user pins
// one of the manifest `widgets[]` entries to the OS homescreen. We render the
// card from the latest `localStorage`-backed widget data mirrored via
// /api/widgets/data, with a cache-first strategy so the widget paints even
// offline. `widgetclick` routes verb clicks back into the PWA deep link.
//
// In browsers that don't support the widget API the handlers simply never fire
// — no harm; the installed PWA + its shortcuts still provide a widget-like
// surface on every platform.

self.addEventListener('widgetinstall', (event) => {
  event.waitUntil((async () => {
    try {
      const tag = event.widget?.definition?.tag || 'ka-rise-status';
      const dataUrl = `/api/widgets/data?tag=${encodeURIComponent(tag)}`;
      let data = null;
      try {
        const fetched = await fetch(dataUrl).then((r) => r.ok ? r.json() : null).catch(() => null);
        data = fetched;
      } catch {}
      if (!data) {
        const cached = await caches.match(dataUrl).then((r) => r ? r.json().catch(() => null) : null).catch(() => null);
        data = cached;
      }
      if (data && event.widget && typeof event.widget.updateByTag === 'function') {
        // Template is resolved by the browser from manifest.widgets[].msAcTemplate
        // We supply just the data payload
        await event.widget.updateByTag(tag, JSON.stringify(data)).catch(() => {});
      }
    } catch (e) {
      console.warn('[SW] widgetinstall failed', e);
    }
  })());
});

self.addEventListener('widgetclick', (event) => {
  const verb = event.action || '';
  const widgetTag = event.widget?.definition?.tag || '';
  let targetUrl = '/';
  if (widgetTag === 'ka-rise-today' || verb === 'today') targetUrl = '/?tab=dashboard';
  else if (widgetTag === 'ka-rise-weekly' || verb === 'weekly') targetUrl = '/?tab=weekly_targets';
  else if (verb === 'focus') targetUrl = '/?tab=focus_timer';
  else if (verb === 'notepad') targetUrl = '/?tab=notepad';
  else targetUrl = '/?tab=system_solo';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if (client.url.startsWith(self.location.origin)) {
          await client.focus();
          client.postMessage({ type: 'navigate', url: new URL(targetUrl, self.location.origin).href });
          return;
        }
      }
      try { await self.clients.openWindow(new URL(targetUrl, self.location.origin).href); } catch {}
    })()
  );
});

// Periodic Background Sync for widget data refresh (where supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'widget-refresh') {
    event.waitUntil((async () => {
      try {
        const tags = ['ka-rise-status', 'ka-rise-today', 'ka-rise-weekly'];
        for (const tag of tags) {
          try {
            const res = await fetch(`/api/widgets/data?tag=${tag}`, { cache: 'no-store' });
            if (res.ok) {
              const cache = await caches.open(CACHE_NAME);
              await cache.put(`/api/widgets/data?tag=${tag}`, res.clone());
              // If widget API exists, push update
              if (self.widgets && typeof self.widgets.updateByTag === 'function') {
                const data = await res.clone().json().catch(() => null);
                if (data) await self.widgets.updateByTag(tag, JSON.stringify(data)).catch(() => {});
              }
            }
          } catch {}
        }
      } catch {}
    })());
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Popup notification helpers — in-app + system coalesced
// ─────────────────────────────────────────────────────────────────────────────
// The app can request a "popup" style notification that should:
//  1. Show as a system notification if the tab is hidden/backgrounded
//  2. Show as an in-app toast if visible (so user doesn't miss it behind)
// We handle both via the same showNotification path with `requireInteraction`
// hints for important categories.
self.addEventListener('message', (event) => {
  // Already have a message handler above; this is merged via fallthrough
  // Keep for widget data mirroring from the app
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;
  if (msg.type === 'widget-data-update' && msg.tag && msg.payload) {
    event.waitUntil(
      (async () => {
        try {
          const dataUrl = `/api/widgets/data?tag=${msg.tag}`;
          const blob = new Blob([JSON.stringify(msg.payload)], { type: 'application/json' });
          const resp = new Response(blob, { headers: { 'Content-Type': 'application/json' } });
          const cache = await caches.open(CACHE_NAME);
          await cache.put(dataUrl, resp);
          if (self.widgets && typeof self.widgets.updateByTag === 'function') {
            await self.widgets.updateByTag(msg.tag, JSON.stringify(msg.payload)).catch(() => {});
          }
        } catch {}
      })()
    );
  }
});

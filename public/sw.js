const CACHE_NAME = 'pharaoh-system-v7';
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/favicon.ico', '/favicon.svg', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png', '/logo-complet.png'];
const DEFAULT_ICON = '/icon-192.png';

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
        const urls = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css|woff2|png|jpg|svg))"/g)]
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
//     make a cache hit always the right immutable file.
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

// Receives server-relayed pushes (delivered even when the app/browser is closed)
// and surfaces them as system notifications on the device.
self.addEventListener('push', (event) => {
  let data = { title: 'Le Système', body: '', tag: '', url: '/', icon: DEFAULT_ICON, extras: {} };
  try {
    if (event.data) {
      const parsed = typeof event.data.json === 'function' ? event.data.json() : JSON.parse(event.data.text());
      if (parsed && typeof parsed === 'object') {
        data = {
          title: parsed.title || data.title,
          body: parsed.body || '',
          tag: parsed.tag || '',
          url: parsed.url || '/',
          icon: parsed.icon || DEFAULT_ICON,
          extras: parsed.data || {},
        };
      }
    }
  } catch (e) {
    // Malformed payload — show a generic fallback.
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: DEFAULT_ICON,
    tag: data.tag,
    renotify: !!data.tag,
    data: { url: data.url, ...data.extras },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handles in-app local notifications relayed from the client tab via postMessage.
self.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg && msg.type === 'show-notification' && msg.payload) {
    const p = msg.payload || {};
    event.waitUntil(
      self.registration.showNotification(p.title || 'Le Système', {
        body: p.body || '',
        icon: p.icon || DEFAULT_ICON,
        badge: DEFAULT_ICON,
        tag: p.tag || '',
        renotify: !!p.tag,
        data: { url: p.url || '/' },
      })
    );
  }
});

// Notification click — open (or focus) the app on the route encoded in the payload.
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  notification.close();

  const targetUrl = (notification.data && notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        // Focus an existing tab pointing at the desired route.
        if (client.url.includes(targetUrl)) {
          await client.focus();
          return;
        }
      }
      // Otherwise open a new window for the route, falling back to the app root.
      try {
        await self.clients.openWindow(targetUrl);
      } catch {
        await self.clients.openWindow('/');
      }
    })()
  );
});

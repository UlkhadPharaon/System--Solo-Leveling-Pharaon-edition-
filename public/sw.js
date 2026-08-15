const CACHE_NAME = 'pharaoh-system-v3';
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/icon.jpg'];

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

// Fetch Event - Cache-first, fallback réseau, fallback navigation
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        // On cache les réponses 200 (basic = même origine, opaque = CDN fonts)
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

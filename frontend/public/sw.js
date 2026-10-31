const CACHE_NAME = 'musify-cache-v8';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.html',
  '/manifest.json',
  '/icons/musify-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cross-origin requests: let pass through untouched (do not intercept)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Same-origin audio stream requests: pass straight to network without caching or buffering
  if (url.pathname.startsWith('/api/stream')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Non-stream API calls bypass service worker cache (handled by in-memory / IndexedDB API cache)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-first for navigation requests to ensure fresh bundles
  if (event.request.mode === 'navigate') {
    const isApp = url.pathname === '/app' || url.pathname.startsWith('/app/');
    const fallbackHtml = isApp ? '/app.html' : '/index.html';
    event.respondWith(
      fetch(event.request).catch(() => caches.match(fallbackHtml))
    );
    return;
  }

  // Cache-first with network fallback for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          const isApp = url.pathname === '/app' || url.pathname.startsWith('/app/');
          return caches.match(isApp ? '/app.html' : '/index.html');
        }
      });
    })
  );
});

const CACHE_NAME = 'musify-cache-v6';
const AUDIO_CACHE = 'musify-audio-cache-v1';
const MAX_AUDIO_ITEMS = 20;

const STATIC_ASSETS = [
  '/',
  '/index.html',
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
          if (key !== CACHE_NAME && key !== AUDIO_CACHE) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Helper to handle Range Requests for cached audio (HTTP 206 Partial Content)
async function handleAudioRangeRequest(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const cacheKey = new Request(request.url);
  const cachedResponse = await cache.match(cacheKey);

  // If cached audio found and range header requested
  const rangeHeader = request.headers.get('Range');
  if (cachedResponse && rangeHeader) {
    const arrayBuffer = await cachedResponse.arrayBuffer();
    const totalBytes = arrayBuffer.byteLength;
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalBytes - 1;

    if (start >= totalBytes || end >= totalBytes) {
      return new Response(null, {
        status: 416,
        statusText: 'Range Not Satisfiable',
        headers: { 'Content-Range': `bytes */${totalBytes}` }
      });
    }

    const chunk = arrayBuffer.slice(start, end + 1);
    return new Response(chunk, {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': cachedResponse.headers.get('Content-Type') || 'audio/webm',
        'Content-Range': `bytes ${start}-${end}/${totalBytes}`,
        'Content-Length': String(chunk.byteLength),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  }

  if (cachedResponse && !rangeHeader) {
    return cachedResponse;
  }

  // Fallback to network
  try {
    const networkResponse = await fetch(request);
    // If full 200 response, cache for offline playback
    if (networkResponse.status === 200) {
      const clone = networkResponse.clone();
      cache.put(cacheKey, clone).then(async () => {
        // Enforce max audio items cache limit
        const keys = await cache.keys();
        if (keys.length > MAX_AUDIO_ITEMS) {
          cache.delete(keys[0]);
        }
      });
    }
    return networkResponse;
  } catch (err) {
    if (cachedResponse) return cachedResponse;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle audio stream requests with Range support
  if (url.pathname.startsWith('/api/stream')) {
    event.respondWith(handleAudioRangeRequest(event.request));
    return;
  }

  // Non-stream API calls bypass service worker cache (handled by in-memory / IndexedDB API cache)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-first for navigation requests to ensure fresh bundles
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
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
          return caches.match('/index.html');
        }
      });
    })
  );
});

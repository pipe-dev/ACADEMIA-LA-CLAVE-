const CACHE_NAME = 'afinapp-v35';
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/duck.png',
  '/trollface.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      // Wipe ALL caches to destroy old stale JS chunks
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // For navigation requests, always go to network
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request));
    return;
  }

  // Check if we are in a production environment with immutable hashed assets
  const isLocalOrTunnelDev = url.hostname === 'localhost' || 
                             url.hostname === '127.0.0.1' || 
                             url.hostname.includes('trycloudflare.com');

  // Next.js static assets with immutable content hashes (/next/static/chunks/...)
  // In production (300k users): CACHE-FIRST for instant 0ms offline performance.
  // In dev / live pair-programming: NETWORK-FIRST so edits reflect immediately.
  if (url.pathname.startsWith('/_next/static/')) {
    if (isLocalOrTunnelDev) {
      event.respondWith(
        fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        }).catch(() => caches.match(request))
      );
      return;
    }

    // Production: Cache-First (Hashed filenames never change)
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Next.js dynamic / hot-reload scripts: Always Network-First
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // For sound files, use Cache-first with runtime caching
  if (url.pathname.startsWith('/sounds/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // For static media assets (images, fonts), use Stale-While-Revalidate
  if (
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default: Network first, fallback to cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

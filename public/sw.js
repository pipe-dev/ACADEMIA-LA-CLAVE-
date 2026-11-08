/**
 * AfinApp - Anti-Cache Self-Destruct Worker
 * Unregisters any active service worker and deletes all caches permanently.
 */
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});

// Pass-through without any caching
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});

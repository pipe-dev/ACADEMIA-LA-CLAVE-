/**
 * AfinApp Service Worker - Zero Cache & Push Notification Engine
 * All HTTP caching is disabled so users immediately receive code updates.
 */
const CACHE_NAME = 'afinapp-nocache-v43';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      // Force delete EVERY SINGLE CACHE from previous versions
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// PASS-THROUGH ONLY: Zero caching for all requests
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// Background Practice Reminder Scheduler
let reminderTimeoutId = null;

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SCHEDULE_PRACTICE_REMINDER') {
    const { delayMs, title, body } = data;
    if (reminderTimeoutId) {
      clearTimeout(reminderTimeoutId);
      reminderTimeoutId = null;
    }

    if (delayMs > 0 && delayMs < 2147483647) {
      reminderTimeoutId = setTimeout(() => {
        self.registration.showNotification(title || 'Academia La Clave', {
          body: body || '¡Hora de cantar y proteger tu racha diaria!',
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          vibrate: [200, 100, 200],
          tag: 'practice-reminder',
          data: { url: '/' },
        });
      }, delayMs);
    }
  } else if (data.type === 'CANCEL_PRACTICE_REMINDER') {
    if (reminderTimeoutId) {
      clearTimeout(reminderTimeoutId);
      reminderTimeoutId = null;
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

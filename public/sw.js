// Service Worker Oficial de Huellitas PWA
const CACHE_NAME = 'huellitas-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
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
    ).then(() => self.clients.claim())
  );
});

// Estrategia Network-First para garantizar datos en tiempo real y soporte PWA
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || req.url.includes('/api/v1/')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        return networkRes;
      })
      .catch(() => {
        return caches.match(req).then((cachedRes) => cachedRes || caches.match('/index.html'));
      })
  );
});

// ============================================================
// Web Push (Notificaciones con la app cerrada)
// Bloque aditivo: no altera el caché ni la estrategia de red anterior.
// ============================================================
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Huellitas', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Huellitas';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    image: data.image || undefined,
    tag: data.tag || undefined,
    renotify: !!data.tag,
    vibrate: [120, 60, 120],
    data: { url: data.url || '/' },
  };

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const visibleClient = clientList.find(
          (c) => c.visibilityState === 'visible' && c.focused
        );
        if (visibleClient) {
          // La app está abierta y enfocada: la UI muestra su propio aviso.
          clientList.forEach((c) =>
            c.postMessage({
              type: 'PUSH_FOREGROUND',
              title,
              body: options.body,
              url: options.data.url,
            })
          );
          return;
        }
        return self.registration.showNotification(title, options);
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.postMessage({ type: 'PUSH_NAVIGATE', url: targetUrl });
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
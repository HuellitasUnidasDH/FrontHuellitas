// Service Worker Oficial de Huellitas PWA
const CACHE_NAME = 'huellitas-pwa-v1';
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

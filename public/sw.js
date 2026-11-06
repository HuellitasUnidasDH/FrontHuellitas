// Service Worker Oficial de Huellitas PWA
const CACHE_NAME = 'huellitas-pwa-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/sounds/iphone-bell.wav'
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
  const targetUrl = data.url || '/';

  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    // badge se omite deliberadamente para evitar que Windows 11 o Android
    // conviertan imágenes a color en siluetas negras distorsionadas.
    image: data.image || undefined,
    // Tag único por mensaje para que Windows/Android siempre reproduzca sonido y saque el banner
    tag: data.tag ? `${data.tag}-${Date.now()}` : `huellitas-${Date.now()}`,
    renotify: true,
    requireInteraction: false,
    silent: false,
    sound: '/sounds/iphone-bell.wav',
    vibrate: [200, 100, 200],
    data: { url: targetUrl },
  };

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 1. Notificar siempre a cualquier cliente abierto para refrescar contadores en la UI
        clientList.forEach((c) =>
          c.postMessage({
            type: 'PUSH_FOREGROUND',
            title,
            body: options.body,
            url: targetUrl,
          })
        );

        // 2. Comprobar si el usuario está activamente en esa misma ventana y pantalla
        const isActivelyChatting = clientList.some((c) => {
          if (c.visibilityState !== 'visible' || !c.focused) return false;
          if (!targetUrl || targetUrl === '/') return false;
          try {
            const clientUrl = new URL(c.url);
            const target = new URL(targetUrl, clientUrl.origin);
            return (
              clientUrl.pathname === target.pathname &&
              (!target.search || clientUrl.search === target.search)
            );
          } catch {
            return false;
          }
        });

        // Si el usuario ya está viendo esa misma conversación en primer plano, no saturar con el banner del SO
        if (isActivelyChatting) {
          return;
        }

        // Si la app está minimizada, en segundo plano, en otra pestaña o cerrada:
        // Se emite siempre la notificación nativa del sistema operativo con sonido.
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
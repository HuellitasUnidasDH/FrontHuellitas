// Capture beforeinstallprompt before Angular bootstraps so the install banner never misses it.
window.__deferredPwaPrompt = null;
window.addEventListener('beforeinstallprompt', function (event) {
  event.preventDefault();
  window.__deferredPwaPrompt = event;
  window.dispatchEvent(new CustomEvent('huellitas-pwa-ready'));
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {
      // Service Worker registration failure must not block initial rendering.
    });
  });
}

const CACHE_NAME = 'devuelvememivida-v1';

const ASSETS = [
  'index.html',
  'objetivos.html',
  'estadisticas.html',
  'style.css',
  'objetivos.js',
  'manifest.json',
  'favicon.ico',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(claves =>
      Promise.all(claves.filter(clave => clave !== CACHE_NAME).map(clave => caches.delete(clave)))
    )
  );
  self.clients.claim();
});

// Cache-first con actualización en segundo plano (stale-while-revalidate).
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(cacheado => {
      const peticionRed = fetch(event.request)
        .then(respuestaRed => {
          if (respuestaRed && respuestaRed.status === 200) {
            const copia = respuestaRed.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia));
          }
          return respuestaRed;
        })
        .catch(() => cacheado);

      return cacheado || peticionRed;
    })
  );
});

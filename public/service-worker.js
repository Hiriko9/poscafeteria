const CACHE_VERSION = __CACHE_VERSION__;
const PRECACHE_URLS = __PRECACHE_URLS__;
const CACHE_PREFIX = 'pos-cafe-';
const CACHE_NAME = CACHE_VERSION;

// No se activa la versión nueva hasta que el usuario la confirme.
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nombres) =>
        Promise.all(
          nombres
            .filter((nombre) => nombre.startsWith(CACHE_PREFIX) && nombre !== CACHE_NAME)
            .map((nombre) => caches.delete(nombre))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (evento) => {
  if (evento.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (evento) => {
  const solicitud = evento.request;
  const url = new URL(solicitud.url);
  if (solicitud.method !== 'GET' || url.origin !== self.location.origin) return;

  if (solicitud.mode === 'navigate') {
    evento.respondWith(
      fetch(solicitud)
        .then(async (respuesta) => {
          if (respuesta.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put('/index.html', respuesta.clone());
          }
          return respuesta;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const pagina = await cache.match('/index.html');
          if (pagina) return pagina;
          return Response.error();
        })
    );
    return;
  }

  // Los recursos estáticos usan caché primero y guardan las respuestas nuevas.
  evento.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const guardada = await cache.match(solicitud);
      if (guardada) return guardada;

      const respuesta = await fetch(solicitud);
      if (respuesta.ok && respuesta.type === 'basic') {
        await cache.put(solicitud, respuesta.clone());
      }
      return respuesta;
    })
  );
});
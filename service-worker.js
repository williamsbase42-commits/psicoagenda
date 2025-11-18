const CACHE_NAME = "psicoagenda-v4";
const FILES_TO_CACHE = [
  "/",
  "index.html",
  "manifest.json"
];

// Instalar — cachea App Shell
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Activar — borra caches antiguas
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar peticiones
self.addEventListener("fetch", event => {
  const request = event.request;

  // Solo GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // ► 1. Navegaciones (SPA) — Network First con fallback a cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("index.html", clone));
          return response;
        })
        .catch(() => caches.match("index.html"))
    );
    return;
  }

  // ► 2. HTML directo (index.html, etc.)
  if (url.pathname.endsWith(".html")) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then(r => r || caches.match("index.html")))
    );
    return;
  }

  // ► 3. Otros archivos — Cache First
  event.respondWith(
    caches.match(request).then(cacheRes => {
      return (
        cacheRes ||
        fetch(request)
          .then(response => response)
          .catch(() => undefined)
      );
    })
  );
});

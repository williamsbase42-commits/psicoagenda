const CACHE_NAME = 'psicoagenda-v1';
// Archivos esenciales del "App Shell"
const FILES_TO_CACHE = [
  'index.html',
  'manifest.json'
  // Nota: CSS y JS están integrados en index.html, por lo que no se listan aquí.
  // Los iconos se cargan desde una URL externa (placeholder), por lo que no se cachean aquí.
];

// 1. Instalación del Service Worker: Cachear los archivos del App Shell
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Cacheando archivos del App Shell');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        self.skipWaiting(); // Forzar la activación inmediata
      })
  );
});

// 2. Activación del Service Worker: Limpiar cachés antiguos
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activando...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Eliminando caché antiguo:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim(); // Tomar control inmediato de las páginas
});

// 3. Interceptación de peticiones (Fetch): Estrategia Cache-First (Offline-First)
self.addEventListener('fetch', (event) => {
  // Solo manejar peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Estrategia: Cache-First
  // 1. Intenta responder desde el caché.
  // 2. Si no está en caché, intenta ir a la red (fetch).
  // 3. (Opcional) Si la petición de red tiene éxito, se puede cachear la respuesta.
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // 1. Encontrado en caché
          // console.log(`[ServiceWorker] Sirviendo desde caché: ${event.request.url}`);
          return response;
        }
        
        // 2. No está en caché, ir a la red
        // console.log(`[ServiceWorker] Sirviendo desde red: ${event.request.url}`);
        return fetch(event.request)
          .then((networkResponse) => {
            
            // (Opcional) Si queremos cachear nuevas peticiones dinámicamente
            // Hay que tener cuidado de no cachear todo (ej. APIs externas)
            // Por ahora, solo nos importa el App Shell, que ya está en el 'install'.
            
            return networkResponse;
          })
          .catch(() => {
            // Error al ir a la red (offline y no está en caché)
            // Aquí podríamos devolver una página "offline.html" genérica si la tuviéramos
            console.warn(`[ServiceWorker] Fallo al cargar: ${event.request.url}`);
          });
      })
  );
});
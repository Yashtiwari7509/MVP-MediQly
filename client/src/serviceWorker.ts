const CACHE_NAME = 'health-app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Add other static assets paths
];

const API_CACHE_NAME = 'api-cache-v1';
const API_ROUTES = [
  '/api/symptoms',
  '/api/medicine',
  '/api/health-tips',
  '/api/first-aid',
  '/api/emergency-contacts'
];

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(API_CACHE_NAME)
    ])
  );
});

self.addEventListener('fetch', (event: any) => {
  const request = event.request;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const clonedResponse = response.clone();
          caches.open(API_CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // If offline, try to get from cache
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            // If not in cache, return offline data
            return new Response(
              JSON.stringify({
                error: 'You are offline. This data was loaded from cache.',
                offline: true,
                timestamp: new Date().toISOString()
              }),
              {
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).then((fetchResponse) => {
        // Clone and cache new static assets
        const clonedResponse = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, clonedResponse);
        });
        return fetchResponse;
      });
    })
  );
}); 
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/styles.css',
  'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@2.8.0',
];

const BUDGET_PRECACHE = 'budget-precache-v1';
const RUNTIME_CACHE = 'runtime';

// instaling service worker
self.addEventListener('install', (evt) => {
  // pre-caching budget data
  evt.waitUntil(
    caches
      .open(BUDGET_PRECACHE)
      .then((cache) => {
        console.log('Your files were pre-cached successfully');
        return cache.addAll(FILES_TO_CACHE);
      })
      // activating service-worker after install
      .then(self.skipWaiting())
  );
});

// activating service worker and cleaning up old cache
self.addEventListener('active', (evt) => {
  evt.waitUntil(
    // delete any caches that are not pre-defined
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== BUDGET_PRECACHE && key !== RUNTIME_CACHE) {
            console.log('Removing old cache data', key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// fetching cached data
self.addEventListener('fetch', function (evt) {
  if (evt.request.url.includes('/api/')) {
    evt.respondWith(
      caches
        .open(RUNTIME_CACHE)
        .then((cache) => {
          return fetch(evt.request)
            .then((response) => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }

              return response;
            })
            .catch((err) => {
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            });
        })
        .catch((err) => console.log(err))
    );

    return;
  }

  evt.respondWith(
    caches.open(BUDGET_PRECACHE).then((cache) => {
      return cache.match(evt.request).then((response) => {
        return response || fetch(evt.request);
      });
    })
  );
});

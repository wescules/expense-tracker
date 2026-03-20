const CACHE_NAME = 'v1';
const ASSETS = [
  '/expense-tracker/',
  '/expense-tracker/index.html',
  '/expense-tracker/js/index.js',
  '/expense-tracker/js/helper/functions.js',
  '/expense-tracker/js/helper/database.js',
  '/expense-tracker/js/helper/renderCharts.js',
  '/expense-tracker/js/helper/renderTables.js',
  '/expense-tracker/js/externalLibraries/cal-heatmap.min.js',
  '/expense-tracker/js/externalLibraries/chart.min.js',
  '/expense-tracker/js/externalLibraries/chartjs-adapter-luxon.js',
  '/expense-tracker/js/externalLibraries/d3.v7.min.js',
  '/expense-tracker/js/externalLibraries/luxon.min.js',
  '/expense-tracker/js/externalLibraries/popper.js',
  '/expense-tracker/js/externalLibraries/tooltip.js',
  '/expense-tracker/css/style.css',
  '/expense-tracker/css/fa.min.css',
  '/expense-tracker/manifest.json',
  '/expense-tracker/pwa/icon-192.png',
  '/expense-tracker/pwa/icon-512.png',
  '/expense-tracker/assets/wes.webp',
  '/expense-tracker/assets/abbie.webp',
];

// Install → cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Activate → clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
});

// Fetch → serve from cache first
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
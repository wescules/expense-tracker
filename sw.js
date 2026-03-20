const CACHE_NAME = 'v5-order-matters';
// Order matters here - critical assets first, then non-critical ones. 
// Found out the hard way that if the JS files are cached before the HTML/CSS, the app can break on first load since it tries to fetch uncached HTML/CSS.
const ASSETS = [
  '/expense-tracker/',
  // html first for faster load
  '/expense-tracker/index.html',
  // css and fonts so it renders styled immediately
  '/expense-tracker/css/style.css',
  '/expense-tracker/css/fa.min.css',
  '/expense-tracker/webfonts/fa-brands-400.woff2',
  '/expense-tracker/webfonts/fa-regular-400.woff2',
  '/expense-tracker/webfonts/fa-solid-900.woff2',
  '/expense-tracker/webfonts/fa-v4compatibility.woff2',
  // JS files last since they are not critical for initial render
  '/expense-tracker/js/externalLibraries/cal-heatmap.min.js',
  '/expense-tracker/js/externalLibraries/chart.min.js',
  '/expense-tracker/js/externalLibraries/chartjs-adapter-luxon.js',
  '/expense-tracker/js/externalLibraries/d3.v7.min.js',
  '/expense-tracker/js/externalLibraries/luxon.min.js',
  '/expense-tracker/js/externalLibraries/popper.js',
  '/expense-tracker/js/externalLibraries/tooltip.js',
  // App code
  '/expense-tracker/js/helper/database.js',
  '/expense-tracker/js/helper/functions.js',
  '/expense-tracker/js/helper/categoryPicker.js',
  '/expense-tracker/js/helper/settings.js',
  '/expense-tracker/js/helper/renderCharts.js',
  '/expense-tracker/js/helper/renderTables.js',
  '/expense-tracker/js/index.js',
  // images and non-critical assets
  '/expense-tracker/manifest.json',
  '/expense-tracker/pwa/icon-192.png',
  '/expense-tracker/pwa/icon-512.png',
  '/expense-tracker/assets/wes.webp',
  '/expense-tracker/assets/abbie.webp',
];

// Install → cache critical assets
self.addEventListener('install', (event) => {
  self.skipWaiting(); // critical for iOS
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Activate → clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim(); // take control immediately
});

// Fetch → serve from cache first
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
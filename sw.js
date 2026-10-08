// Fishmen Tackle — minimal offline cache for Android/PWA testing.
// Cache-first for the app shell; does not intercept or alter any app behavior,
// data, or network calls the app itself makes (e.g. Google Fonts, marketplace CSV links).
const CACHE_NAME = 'fishmen-tackle-shell-v1';
const SHELL_FILES = ['./fishmen-tackle.html', './manifest.json', './icon.svg', './icon-maskable.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // Only handle same-origin GET requests for the app shell; everything else (fonts, CDN
  // libraries, any future external calls) passes straight through untouched.
  if(req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      return res;
    }).catch(() => cached))
  );
});

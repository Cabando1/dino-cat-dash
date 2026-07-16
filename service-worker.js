const CACHE = 'dino-cat-dash-v5';
const ASSETS = ["./", "./index.html", "./style.css", "./game-loader.js", "./manifest.webmanifest", "./game-part-01.txt", "./game-part-02.txt", "./game-part-03.txt", "./game-part-04.txt", "./game-part-05.txt", "./game-part-06.txt", "./game-part-07.txt", "./game-part-08.txt"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('./index.html'))));
});

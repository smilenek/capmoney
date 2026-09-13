const CACHE = 'capmoney-shell-v8';
const FILES = ['./', './index.html', './style.css', './pro.css', './ui.css', './profile.js', './location.js', './app.js', './finance.js', './media.js', './pro.js', './sharing.js', './manifest.json', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('capmoney-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api/')) return;
  event.respondWith(fetch(event.request).then(async response => {
    // A cache quota failure must never discard a successful network response.
    if(response.ok){try{const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());}catch{}}
    return response;
  }).catch(async () => (await caches.match(event.request)) || (event.request.mode === 'navigate' ? await caches.match('./index.html') : Response.error())));
});

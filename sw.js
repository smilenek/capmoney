const CACHE_PREFIX='capmoney-shell-'+encodeURIComponent(self.registration.scope)+'-';
const CACHE = CACHE_PREFIX+'v10';
const FILES = ['./', './index.html', './style.css', './pro.css', './ui.css', './profile.js', './location.js', './app.js', './finance.js', './media.js', './pro.js', './sharing.js', './backup-schedule.js', './scheduled-backup.js', './pwa.js', './manifest.json', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'];
const shell=new Set(FILES.map(file=>new URL(file,self.registration.scope).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 const cacheUrl=new URL(url.href);cacheUrl.search='';cacheUrl.hash='';
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/'))return;
 // One installed shell version. Cloud/auth responses never enter this cache.
 if(!shell.has(cacheUrl.href)&&!url.pathname.startsWith(new URL('./vendor/',self.registration.scope).pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),hit=await cache.match(cacheUrl.href);
  if(hit)return hit;
  const response=await fetch(event.request);
  if(response.ok)try{await cache.put(cacheUrl.href,response.clone());}catch{}
  return response;
 })());
});

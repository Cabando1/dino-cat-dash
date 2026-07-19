const CACHE='dino-cat-dash-v18-3.2.0';
const FALLBACK='./index.html?v=3.2.0';
const CORE=[
  FALLBACK,
  './style.css?v=3.1.0',
  './ipad-layout.css?v=3.1.0',
  './menu-customizer.css?v=3.1.0',
  './cutscenes.css?v=3.1.0',
  './viewport-lock.css?v=3.1.0',
  './cutscene-reliability.css?v=3.1.0',
  './cutscene-detail-upgrade.css?v=3.1.0',
  './gameplay-v3.css?v=3.1.0',
  './classic-mobile-cleanup.css?v=3.1.0',
  './remix-entry.css?v=3.2.0',
  './manifest.webmanifest?v=3.1.0',
  './js/config.js?v=3.1.0',
  './js/classic-preload.js?v=3.1.0',
  './js/audio.js?v=3.1.0',
  './js/render.js?v=3.1.0',
  './js/boss-visual-fix.js?v=3.1.0',
  './js/mechanics.js?v=3.1.0',
  './js/main.js?v=3.1.0',
  './js/menu-customizer.js?v=3.1.0',
  './js/adventure-upgrade.js?v=3.1.0',
  './js/gameplay-tuning.js?v=3.1.0',
  './js/viewport-lock.js?v=3.1.0',
  './js/cutscene-reliability.js?v=3.1.0',
  './js/jump-tuning.js?v=3.1.0',
  './js/cutscene-detail-upgrade.js?v=3.1.0',
  './js/gameplay-v3.js?v=3.1.0',
  './js/gameplay-v3-guard.js?v=3.1.0',
  './js/classic-mobile-cleanup.js?v=3.1.0',
  './js/remix-entry.js?v=3.2.0',
  './remix/index.html?v=0.1.0',
  './remix/remix.css?v=0.1.0',
  './remix/remix.js?v=0.1.0',
  './remix/manifest.webmanifest?v=0.1.0'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('message',event=>{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('dino-cat-dash')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const requestUrl=new URL(event.request.url);
  if(requestUrl.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    const fallback=requestUrl.pathname.includes('/remix/')?'./remix/index.html?v=0.1.0':FALLBACK;
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(fallback,copy));return response}).catch(()=>caches.match(fallback)));
    return;
  }
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match(event.request,{ignoreSearch:true}))));
});

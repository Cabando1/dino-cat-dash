const CACHE='dino-cat-dash-v15-2.3.0';
const FALLBACK='./index.html?v=2.3.0';
const CORE=[
  FALLBACK,
  './style.css?v=2.3.0',
  './ipad-layout.css?v=2.3.0',
  './menu-customizer.css?v=2.3.0',
  './cutscenes.css?v=2.3.0',
  './viewport-lock.css?v=2.3.0',
  './cutscene-reliability.css?v=2.3.0',
  './cutscene-detail-upgrade.css?v=2.3.0',
  './manifest.webmanifest?v=2.3.0',
  './js/config.js?v=2.3.0',
  './js/audio.js?v=2.3.0',
  './js/render.js?v=2.3.0',
  './js/boss-visual-fix.js?v=2.3.0',
  './js/mechanics.js?v=2.3.0',
  './js/main.js?v=2.3.0',
  './js/menu-customizer.js?v=2.3.0',
  './js/adventure-upgrade.js?v=2.3.0',
  './js/gameplay-tuning.js?v=2.3.0',
  './js/viewport-lock.js?v=2.3.0',
  './js/cutscene-reliability.js?v=2.3.0',
  './js/jump-tuning.js?v=2.3.0',
  './js/cutscene-detail-upgrade.js?v=2.3.0'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('message',event=>{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('dino-cat-dash')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const requestUrl=new URL(event.request.url);
  if(requestUrl.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(FALLBACK,copy));return response}).catch(()=>caches.match(FALLBACK)));
    return;
  }
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match(event.request,{ignoreSearch:true}))));
});
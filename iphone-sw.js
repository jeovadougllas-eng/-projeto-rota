/* iPhone web installation only. App, auth, API and customer data are always network-only. */
'use strict';
const SHELL='traxelo-iphone-offline-v1',OFFLINE='/iphone-offline.html';
self.addEventListener('install',event=>{event.waitUntil(caches.open(SHELL).then(cache=>cache.add(new Request(OFFLINE,{cache:'reload'}))));});
// Do not skipWaiting or reload running tabs: a route/visit may be in progress.
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('traxelo-iphone-offline-')&&key!==SHELL).map(key=>caches.delete(key)))));});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||request.mode!=='navigate'||url.origin!==self.location.origin||!['/','/index.html'].includes(url.pathname))return;
 event.respondWith(fetch(request).catch(async()=>{
  const fallback=await caches.match(OFFLINE,{cacheName:SHELL});
  return fallback||new Response('Conecte-se à internet e abra o Traxelo.IA novamente.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 }));
});

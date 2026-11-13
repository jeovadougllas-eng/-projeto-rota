/* Versioned public application shell. Personal data remains in the existing owner-scoped stores. */
'use strict';
const SHELL='rotamapa-app-shell-v1',OFFLINE='/iphone-offline.html';
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const response=await fetch('/assets/rotamapa-offline-files.json',{cache:'reload'});if(!response.ok)throw Error('Offline manifest unavailable');
 const paths=await response.json();if(!Array.isArray(paths)||!paths.includes('/'))throw Error('Invalid offline manifest');
 const cache=await caches.open(SHELL);
 try{for(let i=0;i<paths.length;i+=8)await Promise.all(paths.slice(i,i+8).map(async path=>{
  if(!(path==='/'||path===OFFLINE||path==='/iphone.webmanifest'||path.startsWith('/assets/'))||path.includes('..')||path.includes('?'))throw Error('Invalid offline asset');
  const r=await fetch(path,{cache:'reload',credentials:'omit'});if(!r.ok)throw Error('Offline asset unavailable');await cache.put(path,r);
 }));const tabs=await self.clients.matchAll({includeUncontrolled:true});for(const tab of tabs)tab.postMessage({type:'rotamapa:offline-ready'});}catch(e){await caches.delete(SHELL);throw e;}
})()));
// New shell waits for all old tabs to close. Never reload an active order or route.
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();await Promise.all(keys.filter(k=>(k.startsWith('rotamapa-app-shell-')||k.startsWith('traxelo-iphone-offline-'))&&k!==SHELL).map(k=>caches.delete(k)));
})()));
self.addEventListener('fetch',event=>{
 const r=event.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==self.location.origin)return;
 if(r.mode==='navigate'){
  const launchQuery=[...u.searchParams].every(([key,value])=>key==='source'&&['iphone-pwa','pwa'].includes(value))&&[...u.searchParams].length<=1;
  if(!['/','/index.html'].includes(u.pathname)||!launchQuery||u.hash)return;
  event.respondWith(caches.open(SHELL).then(async c=>(await c.match('/'))||fetch(r).catch(async()=>await c.match(OFFLINE))));return;
 }
 if(!u.pathname.startsWith('/assets/')&&u.pathname!=='/iphone.webmanifest')return;
 // Only explicitly installed assets are read. Never cache API, auth or map provider traffic.
 event.respondWith(caches.open(SHELL).then(async c=>(await c.match(u.pathname))||fetch(r)));
});

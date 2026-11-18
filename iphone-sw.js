/* Versioned public application shell. Personal data remains in the existing owner-scoped stores. */
'use strict';
const SHELL='rotamapa-app-shell-v1',OFFLINE='/iphone-offline.html';
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const response=await fetch('/assets/rotamapa-offline-files.json',{cache:'reload'});if(!response.ok)throw Error('Offline manifest unavailable');
 const manifest=await response.json(),paths=manifest.files;if(manifest.version!==SHELL.slice('rotamapa-app-shell-'.length)||!Array.isArray(paths)||!paths.some(f=>f.path==='/'))throw Error('Invalid offline manifest');
 const cache=await caches.open(SHELL);
 try{for(let i=0;i<paths.length;i+=4)await Promise.all(paths.slice(i,i+4).map(async ({path,sha256})=>{
  if(!(path==='/'||path===OFFLINE||path==='/iphone.webmanifest'||path.startsWith('/assets/'))||path.includes('..')||path.includes('?'))throw Error('Invalid offline asset');
  const r=await fetch(path,{cache:'reload',credentials:'omit'});if(!r.ok)throw Error('Offline asset unavailable');const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await r.clone().arrayBuffer())),v=>v.toString(16).padStart(2,'0')).join('');if(digest!==sha256)throw Error('Offline version mismatch');await cache.put(path,r);
 }));const tabs=await self.clients.matchAll({includeUncontrolled:true});for(const tab of tabs)tab.postMessage({type:'rotamapa:offline-ready'});}catch(e){await caches.delete(SHELL);throw e;}
})()));
// Natural activation still waits for old tabs. Explicit activation requires every open app
// to acknowledge that it is safe, then each consenting page reloads itself. Existing pages keep their controller until navigation.
const appClient=c=>{try{const u=new URL(c.url);return u.origin===self.location.origin&&['/','/index.html','/iphone-offline.html'].includes(u.pathname);}catch{return false;}};
let approval=null;
async function activateOnRequest(source,id){
 if(!source||!appClient(source)||typeof id!=='string'||id.length>100)return;
 if(approval){source.postMessage({type:'rotamapa:update-result',id,reason:'busy'});return;}
 const clients=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(appClient);
 if(!clients.some(c=>c.id===source.id))return;if(approval){source.postMessage({type:'rotamapa:update-result',id,reason:'busy'});return;}
 let finish;const decision=new Promise(resolve=>finish=resolve),pending=new Set(clients.map(c=>c.id));
 const current={id,pending,finish,failed:null};approval=current;
 const timer=setTimeout(()=>finish('timeout'),8000);
 try{
  for(const c of clients)c.postMessage({type:'rotamapa:update-prepare',id,version:SHELL});
  const reason=await decision;
  if(reason){for(const c of clients)c.postMessage({type:'rotamapa:update-result',id,reason:c.id===source.id?reason:'other'});return;}
  const latest=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(appClient);
  if(latest.some(c=>!clients.some(old=>old.id===c.id))){for(const c of clients)c.postMessage({type:'rotamapa:update-result',id,reason:'other'});return;}
  // This is the only forced activation path: all current app windows are locked and safe.
  await self.skipWaiting();
 }catch{for(const c of clients)c.postMessage({type:'rotamapa:update-result',id,reason:'other'});}
 finally{clearTimeout(timer);if(approval===current)approval=null;}
}
self.addEventListener('message',event=>{
 const data=event.data,source=event.source;if(!data||!source||!appClient(source))return;
 if(data.type==='rotamapa:apply-update')event.waitUntil(activateOnRequest(source,data.id));
 else if(data.type==='rotamapa:update-ready'&&approval?.id===data.id&&approval.pending.has(source.id)){
  approval.pending.delete(source.id);if(data.ok!==true){approval.failed='other';approval.finish(approval.failed);}else if(!approval.pending.size&&!approval.failed)approval.finish(null);
 }
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const tabs=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(appClient);
 // Keep old public shells while any old page might still need them (including a new
 // window opened during the handshake). Retire them on activation with no app windows.
 if(!tabs.length){const keys=await caches.keys();await Promise.all(keys.filter(k=>(k.startsWith('rotamapa-app-shell-')||k.startsWith('traxelo-iphone-offline-'))&&k!==SHELL).map(k=>caches.delete(k)));}
 for(const tab of tabs)tab.postMessage({type:'rotamapa:update-activated',version:SHELL});
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

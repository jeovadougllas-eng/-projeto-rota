import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export async function pwaUpdateServer(){
 let version=1,broken=false;const root=new URL('../../',import.meta.url),files={};
 for(const name of ['rotamapa-pwa-updates.js','rotamapa-pwa-updates.css','rotamapa-commerce-model.js','rotamapa-commerce-store.js'])files['/assets/'+name]=await readFile(new URL('assets/'+name,root));
 const worker=await readFile(new URL('iphone-sw.js',root),'utf8');
 const html=()=>Buffer.from(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/rotamapa-pwa-updates.css"></head><body><h1>V${version}</h1><button id="openEditor" onclick="document.getElementById('editor').showModal()">Editar</button><dialog id="editor"><input id="draft" aria-label="Rascunho"><button id="closeEditor" onclick="this.closest('dialog').close()">Fechar edição</button></dialog><script src="/assets/rotamapa-commerce-model.js"></script><script src="/assets/rotamapa-commerce-store.js"></script><script>window.RotaMapaSales={getStore:()=>window.store};window.store=RotaMapaCommerceStore.create('owner-update-test');window.TraxeloNavigation={state:()=>({tracking:!!window.routeActive,stops:window.routeActive?[{id:'local-stop'}]:[]})};window.offlineErrors=0;addEventListener('rotamapa:offline-shell-error',()=>window.offlineErrors++);</script><script src="/assets/rotamapa-pwa-updates.js"></script></body></html>`);
 const server=createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),path=u.pathname;res.setHeader('Cache-Control','no-store');let data,type='application/javascript';
  if(path==='/'){type='text/html';data=u.searchParams.has('legacy')?Buffer.from('<!doctype html><h1>Janela antiga</h1>'):html();}
  else if(path==='/iphone-sw.js')data=worker.replace("rotamapa-app-shell-v1","rotamapa-app-shell-test-v"+version);
  else if(path==='/assets/rotamapa-offline-files.json'){type='application/json';data=JSON.stringify({version:'test-v'+version,files:Object.entries({'/':html(),...files}).map(([path,data])=>({path,sha256:broken&&path==='/'?'0'.repeat(64):createHash('sha256').update(data).digest('hex')}))});}
  else if(files[path]){data=files[path];if(path.endsWith('.css'))type='text/css';}
  else{res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});res.end(data);
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return{url:'http://127.0.0.1:'+server.address().port,next:()=>version++,breakNext:()=>{version++;broken=true;},close:()=>new Promise(resolve=>server.close(resolve))};
}

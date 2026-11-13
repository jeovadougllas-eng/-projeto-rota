/* One loaded document belongs to one portfolio. Switching starts a fresh document. */
(function(root){
'use strict';
const DEFAULT='00000000-0000-4000-8000-000000000000',uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const read=k=>{try{return root.localStorage.getItem(k);}catch{return null;}};
function active(owner){const id=owner&&read('rotamapa.portfolio.active.v1:'+owner);return uuid.test(id||'')?id:DEFAULT;}
const loadedOwner=read('traxio_sync_owner_v29'),loadedId=active(loadedOwner);
function key(base,owner){const id=active(owner);return base+(id===DEFAULT?'':':portfolio:'+id);}
root.RotaMapaPortfolioScope={DEFAULT,active,key,loadedId,loadedOwner,headers:()=>({'x-rotamapa-portfolio':loadedId}),clientsKey:()=>loadedId===DEFAULT?'projeto_rota_mapa_v1':'rotamapa.clients.v1:'+loadedOwner+':'+loadedId};
})(globalThis);

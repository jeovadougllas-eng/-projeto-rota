/* Map-centred customer location workflow. Uses existing IDs, account auth and revision-safe sync. */
(function(){
'use strict';
const el=id=>document.getElementById(id),P=TraxioPlanner;
function node(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
const nav=document.querySelector('nav.tabs'),header=document.querySelector('body>header'),main=document.querySelector('body>main');
// Fixed navigation must not be clipped/stacked by the scrolling content (notably WebKit).
nav.id='primaryNavigation';document.body.insertBefore(nav,main);
const menu=node('button','☰','mobile-nav-toggle');menu.id='mobileNavToggle';menu.type='button';menu.setAttribute('aria-label','Abrir menu de navegação');menu.setAttribute('aria-controls',nav.id);menu.setAttribute('aria-expanded','false');header.prepend(menu);
const shade=node('button',null,'nav-backdrop');shade.type='button';shade.hidden=true;shade.setAttribute('aria-label','Fechar menu de navegação');document.body.append(shade);
function closeMenu(restore=false){if(document.body.classList.contains('nav-expanded'))document.body.classList.remove('nav-expanded');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menu de navegação');shade.hidden=true;main.inert=false;if(restore)menu.focus();}
menu.onclick=()=>{if(document.body.classList.contains('nav-expanded'))closeMenu(true);else{document.body.classList.add('nav-expanded');menu.setAttribute('aria-expanded','true');menu.setAttribute('aria-label','Fechar menu de navegação');shade.hidden=false;main.inert=true;nav.querySelector('button').focus();}};
shade.onclick=()=>closeMenu(true);
nav.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{closeMenu();if(adjustingPin){directPin=false;endPin();showNotice('Ajuste cancelado ao mudar de aba. A posição do cliente não foi alterada.');}}));
document.addEventListener('keydown',e=>{if(!document.body.classList.contains('nav-expanded'))return;if(e.key==='Escape'){e.preventDefault();closeMenu(true);}else if(e.key==='Tab'){const items=[menu,...nav.querySelectorAll('button[data-tab]')],first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
matchMedia('(max-width:650px)').addEventListener('change',()=>closeMenu());
new MutationObserver(()=>{if(document.body.classList.contains('auth-locked'))closeMenu();}).observe(document.body,{attributes:true,attributeFilter:['class']});

// One status surface describes local durability separately from confirmed cloud synchronization.
const notice=node('div',null,'location-save-notice');notice.id='locationSaveNotice';notice.hidden=true;notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
const noticeText=node('span');noticeText.id='locationSaveMessage';const syncNow=node('button','Tentar sincronizar','secondary');syncNow.id='syncLocationNow';syncNow.type='button';syncNow.hidden=true;const dismiss=node('button','×','secondary');dismiss.type='button';dismiss.setAttribute('aria-label','Fechar aviso de localização');dismiss.onclick=()=>notice.hidden=true;notice.append(noticeText,syncNow,dismiss);main.prepend(notice);
let cloudSequence=0,lastSavedId=null;
function showNotice(message,retry=false){notice.hidden=false;noticeText.textContent=message;syncNow.hidden=!retry;}
async function flushLocation(id){
 const seq=++cloudSequence;lastSavedId=id;
 if(!navigator.onLine){showNotice('Posição salva neste aparelho. Sem conexão: o envio à sua conta está pendente.',true);return;}
 showNotice('Posição salva neste aparelho. Sincronizando com sua conta…');
 try{
  const identity=await authClient?.auth.getUser();if(identity?.error||!identity?.data?.user)throw Error('Entre na sua conta para enviar a posição.');
  const owner=identity.data.user.id,known=localStorage.getItem('traxio_sync_owner_v29');if(known&&known!==owner)throw Error('Este aparelho está associado a outra carteira. A posição permanece protegida localmente.');
  const deadline=Date.now()+20000;
  while((traxioSyncRunning||cloudBusy)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,100));
  if(traxioSyncRunning||cloudBusy)throw Error('A sincronização anterior ainda está em andamento.');
  await traxioAutoSync();
  if(seq!==cloudSequence)return;
  const current=clients.find(c=>String(c.id)===String(id)),baseline=traxioReadBase(owner)[String(id)];
  const latestIdentity=await authClient.auth.getUser();if(latestIdentity.data?.user?.id!==owner)throw Error('A conta mudou durante a sincronização.');
  if(current&&baseline?.hash===cloudCanonical(current)){showNotice('Posição de '+current.name+' salva neste aparelho e sincronizada com sua conta.');return;}
  throw Error('Envio pendente ou conflito protegido. Nenhum cadastro da nuvem foi sobrescrito.');
 }catch(e){if(seq===cloudSequence)showNotice('Salvo neste aparelho. '+e.message,true);}
}
syncNow.onclick=()=>lastSavedId!=null&&flushLocation(lastSavedId);
window.addEventListener('online',()=>{if(lastSavedId!=null&&!document.body.classList.contains('auth-locked'))flushLocation(lastSavedId);});

// A dedicated map confirmation never reconstructs the customer's imported address.
const pinPanel=node('section',null,'pin-confirm-panel');pinPanel.id='pinConfirmPanel';pinPanel.hidden=true;pinPanel.setAttribute('aria-label','Confirmar localização do cliente');
const pinTitle=node('strong');pinTitle.id='pinClientName';const pinHelp=node('p','Arraste o pin laranja até a entrada da loja ou toque no mapa. Depois confirme para salvar.');pinHelp.id='pinHelp';
const pinActions=node('div',null,'row'),confirm=el('backToClient'),cancel=node('button','Cancelar ajuste','secondary');cancel.id='cancelClientPin';cancel.type='button';confirm.textContent='Confirmar posição e salvar';confirm.type='button';pinActions.append(confirm,cancel);pinPanel.append(pinTitle,pinHelp,pinActions);document.body.append(pinPanel);
let directPin=false,pinStart=null;
function pinStatus(){
 if(!adjustingPin)return;pinPanel.hidden=false;const c=clients.find(c=>String(c.id)===String(editingClientId));pinTitle.textContent=c?'Conferir localização · '+c.name:'Conferir localização do novo cliente';confirm.disabled=!valid(num(el('lat').value),num(el('lon').value));
}
const adjustOriginal=el('adjustPin').onclick;
el('adjustPin').onclick=()=>{
 const active=clients.find(c=>String(c.id)===String(editingClientId));pinStart=active?{id:active.id,lat:active.lat,lon:active.lon}:null;
 adjustOriginal();if(!adjustingPin)return;document.activeElement?.blur();el('clientEditDialog')?.close();pinStatus();setTimeout(()=>{map?.resize();showDraftMarker();el('map').scrollIntoView({block:'center',behavior:'instant'});},180);
};
function endPin(){adjustingPin=false;document.body.classList.remove('pin-mode');draftMarker?.remove();draftMarker=null;pinPanel.hidden=true;render();renderMarkers();}
window.traxeloPinController=true;
confirm.onclick=()=>{
 const lat=num(el('lat').value),lon=num(el('lon').value);
 if(!valid(lat,lon)){el('mapStatus').textContent='Escolha um ponto válido no mapa antes de confirmar.';pinHelp.textContent=el('mapStatus').textContent;return;}
 let record;
 const original=editingClientId!==null?clients.find(c=>String(c.id)===String(editingClientId)):null;
 if(pinStart&&!original){pinHelp.textContent='Este cliente não está mais na carteira. Cancele o ajuste e atualize a lista.';return;}
 if(original){
  record={...original,lat,lon,locationVerification:'manual_reviewed',locationSource:'manual_confirmation',locationConfirmedAt:new Date().toISOString()};delete record.locationCandidate;delete record.locationEvidence;
  const next=clients.map(c=>String(c.id)===String(record.id)?record:c);
  try{localStorage.setItem(KEY,JSON.stringify(next));}catch{const message='Não foi possível salvar a posição neste aparelho. Libere espaço e tente novamente.';pinHelp.textContent=message;el('mapStatus').textContent=message;return;}
  clients=next;geoCandidates.delete(record.id);searchSequence++;searchController?.abort();clearTimeout(searchTimer);traxioScheduleSync(200);
 }else{selectedPrecision='manual';record=saveClientRecord({keepForm:true});if(!record){pinHelp.textContent=el('saveStatus').textContent;el('mapStatus').textContent=pinHelp.textContent;return;}}
 selectedPrecision='manual';endPin();el('mapStatus').textContent='Posição de '+record.name+' confirmada e salva neste aparelho.';
 if(directPin){directPin=false;switchTab('mapa');}else{switchTab('clientes');el('clientEditDialog')?.showModal();el('saveStatus').textContent='Posição confirmada e salva. Não é necessário salvar o cadastro novamente.';}
 flushLocation(record.id);refreshSearch();
};
cancel.onclick=()=>{const toMap=directPin;directPin=false;endPin();if(pinStart){el('lat').value=pinStart.lat??'';el('lon').value=pinStart.lon??'';}el('mapStatus').textContent='Ajuste cancelado. A posição do cliente não foi alterada.';if(!toMap){switchTab('clientes');el('clientEditDialog')?.showModal();}else switchTab('mapa');};
window.traxeloReviewClient=id=>{
 const c=clients.find(c=>String(c.id)===String(id));if(!c)return;
 const candidate=geoCandidates.get(c.id)||c.locationCandidate,point=valid(candidate?.lat,candidate?.lon)?candidate:valid(c.lat,c.lon)?c:null;
 directPin=false;openClientLocation(c.id,point?{...point,lat:Number(point.lat),lon:Number(point.lon)}:null);
 if(point){directPin=true;el('adjustPin').click();}else{el('saveStatus').textContent='Busque o endereço. Ao escolher uma sugestão, você poderá confirmar o pin no mapa.';}
};
// Offer the direct map action immediately after choosing an approximate search result.
const suggestionsObserver=new MutationObserver(()=>{
 if(!valid(num(el('lat').value),num(el('lon').value))||el('suggestions').querySelector('.confirm-suggested-pin'))return;
 if(!el('suggestions').textContent.includes('Sugestão selecionada'))return;
 const b=node('button','Confirmar pin no mapa','confirm-suggested-pin');b.type='button';b.onclick=()=>{directPin=false;el('adjustPin').click();};el('suggestions').append(b);
});suggestionsObserver.observe(el('suggestions'),{childList:true,subtree:true});

// An explicit batch lookup lives in Mapa e Rotas, independent of the route selection.
const search=node('details',null,'card client-location-search');search.id='clientLocationSearch';
search.innerHTML='<summary>📍 Buscar localizações dos clientes</summary><p>Localize os endereços cadastrados. Imóveis identificados com segurança são salvos; pontos aproximados precisam de confirmação no mapa. A entrada física da loja pode exigir conferência.</p><div class="location-search-controls"><label>Clientes<select id="locationSearchScope"><option value="pending">Todos os não confirmados</option><option value="selected">Somente os selecionados</option><option value="filtered">Resultados dos filtros atuais</option></select></label><label>Serviço de busca<select id="locationSearchProvider"><option value="comparison">Geoapify + TomTom</option><option value="current">Busca atual (OpenStreetMap)</option></select></label><button type="button" id="startClientLocationSearch">Buscar e salvar localizações</button><button type="button" id="stopClientLocationSearch" class="secondary" hidden>Parar busca</button></div><p id="clientLocationSearchProgress" role="status" aria-live="polite">Escolha os clientes e inicie a busca.</p><p id="clientLocationSearchCounts"></p><div class="row"><button type="button" id="showLocatedClients" class="secondary">Enquadrar confirmados no mapa</button><button type="button" id="showLocationReviews" class="secondary">Revisar aproximações</button></div><div id="locationSearchReviewList"></div>';
document.querySelector('#mapa .workspace').before(search);
let searching=false,stopping=false;
function visibleClients(){const q=norm(el('mapClientSearch').value);return clients.filter(c=>(activePriorityFilter==='all'||String(c.priority||2)===activePriorityFilter)&&regionMatches(c)&&(!q||norm(c.name+' '+c.address+' '+(c.importFields||[]).map(f=>f.value).join(' ')).includes(q)));}
function refreshSearch(){
 const ready=clients.filter(c=>P.location(c).ready).length,review=clients.filter(c=>!P.location(c).ready&&(valid(c.lat,c.lon)||valid((geoCandidates.get(c.id)||c.locationCandidate)?.lat,(geoCandidates.get(c.id)||c.locationCandidate)?.lon))).length;
 el('clientLocationSearchCounts').textContent=ready+' confirmados · '+review+' pontos para conferir · '+(clients.length-ready-review)+' sem ponto disponível';
 el('showLocatedClients').disabled=!ready;
 const list=el('locationSearchReviewList');list.replaceChildren();
 for(const c of clients.filter(c=>!P.location(c).ready)){
  const candidate=geoCandidates.get(c.id)||c.locationCandidate,hasPoint=valid(c.lat,c.lon)||valid(candidate?.lat,candidate?.lon);
  if(!hasPoint&&!candidate?.error)continue;
  const row=node('article',null,'location-search-review');row.dataset.clientId=String(c.id);row.append(node('strong',c.name),node('p',hasPoint?'Localização aproximada: confira a entrada no mapa.':candidate.error));
  const action=node('button',hasPoint?'Confirmar pin no mapa':'Corrigir endereço','secondary');action.type='button';action.onclick=()=>window.traxeloReviewClient(c.id);row.append(action);list.append(row);
 }
}
const originalMarkers=renderMarkers;
renderMarkers=function(){
 originalMarkers();if(!map)return;
 for(const c of visibleClients().filter(c=>P.location(c).ready&&!selectedIds.has(c.id))){
  const b=node('button','●','traxelo-saved-pin');b.type='button';b.title='Cliente confirmado: '+c.name;b.setAttribute('aria-label',b.title);b.onclick=()=>viewClient(c.id);
  markers.push(new maplibregl.Marker({element:b}).setLngLat([Number(c.lon),Number(c.lat)]).addTo(map));
 }
};
const previousWorkspace=renderWorkspace;
renderWorkspace=function(){
 previousWorkspace();refreshSearch();
 for(const tile of el('mapClientList').querySelectorAll('.client-tile')){
  const c=clients.find(c=>String(c.id)===tile.dataset.clientId);if(!c)continue;const candidate=geoCandidates.get(c.id)||c.locationCandidate;
  for(const b of tile.querySelectorAll('.tile-actions button'))if(['Conferir pin sugerido','Conferir ponto','Localizar cliente'].includes(b.textContent)){
   const hasPoint=valid(c.lat,c.lon)||valid(candidate?.lat,candidate?.lon);b.textContent=hasPoint?'Confirmar pin no mapa':'Localizar cliente';b.onclick=()=>window.traxeloReviewClient(c.id);
  }
 }
};
function fitConfirmed(){initMap();const ready=visibleClients().filter(c=>P.location(c).ready);if(!map||!ready.length)return;renderMarkers();const bounds=new maplibregl.LngLatBounds();ready.forEach(c=>bounds.extend([Number(c.lon),Number(c.lat)]));map.fitBounds(bounds,{padding:55,maxZoom:16});}
el('showLocatedClients').onclick=fitConfirmed;
el('showLocationReviews').onclick=()=>{el('locationSearchReviewList').hidden=false;el('locationSearchReviewList').scrollIntoView({block:'nearest'});};
el('stopClientLocationSearch').onclick=()=>{stopping=true;el('clientLocationSearchProgress').textContent='Encerrando a consulta em andamento. Os resultados já salvos serão preservados.';};
class SearchFailure extends Error{}
async function comparisonLookup(c,{token}={}){
 if(!token)throw new SearchFailure('Entre novamente na conta para consultar Geoapify e TomTom.');
 const q={...TraxioGeo.parse(c),name:c.name};delete q.country;
 const r=await fetch((window.TraxioNative?.apiBase||'')+'/api/geolocation-benchmark',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(q),signal:AbortSignal.timeout(35000)});
 const data=await r.json();if(!r.ok)throw new SearchFailure(data.error||'Serviço de busca indisponível.');
 const results=Object.values(data.results||{}),denied=results.find(p=>p.attempts?.some(a=>[401,403,429].includes(a.httpStatus)));
 if(denied)throw new SearchFailure(denied.provider+': chave recusada, permissão ausente ou cota atingida. Confira a configuração ou escolha a busca atual.');
 const geo=data.results?.geoapify;
 // TomTom address records have no rooftop-confidence metadata; do not silently promote them.
 if(data.combined==='compatible'&&geo?.status==='compatible'&&geo.best?.precisionEvidence==='building_record'&&!geo.best.interpolated)return {status:'matched',best:geo.best,candidates:geo.candidates,query:data.query};
 const candidates=results.flatMap(p=>p.candidates||[]),best=results.find(p=>p.best)?.best||candidates.find(p=>valid(p.lat,p.lon));
 if(!best&&results.every(p=>p.status==='error'))throw new SearchFailure('Os dois serviços falharam. Verifique a conexão e tente novamente.');
 return {status:best?'review':'not_found',best,candidates,query:data.query,reason:data.combined==='conflict'?'Os serviços discordam da posição. Confira o pin no mapa.':best?'Ponto aproximado ou sem precisão de imóvel comprovada. Confirme o pin no mapa.':'Endereço não encontrado nos dois serviços.'};
}
window.TraxeloLocations={comparisonLookup,flushLocation};
el('startClientLocationSearch').onclick=async()=>{
 if(searching)return;
 const scope=el('locationSearchScope').value,selected=new P.IdSet(selectedIds),pool=scope==='selected'?clients.filter(c=>selected.has(c.id)):scope==='filtered'?visibleClients():clients;
 const ids=pool.filter(c=>!P.location(c).ready).map(c=>c.id);
 if(!ids.length){el('clientLocationSearchProgress').textContent=pool.length?'Todos estes clientes já possuem localização confirmada.':'Nenhum cliente corresponde ao grupo escolhido.';return;}
 searching=true;stopping=false;el('startClientLocationSearch').disabled=true;el('stopClientLocationSearch').hidden=false;el('locationSearchScope').disabled=true;el('locationSearchProvider').disabled=true;
 const provider=el('locationSearchProvider').value,lookup=provider==='comparison'?comparisonLookup:null;let processed=0,failure=null;
 try{
  for(const id of ids){
   if(stopping)break;const c=clients.find(c=>String(c.id)===String(id));if(!c||P.location(c).ready)continue;
   el('clientLocationSearchProgress').textContent='Buscando '+(processed+1)+' de '+ids.length+': '+c.name;
   const existing=geoJobs.get(String(id));if(existing)await existing.promise;
   if(P.location(clients.find(c=>String(c.id)===String(id))||{}).ready)continue;
   let fatal=null;const wrapped=lookup?async(...args)=>{try{return await lookup(...args);}catch(e){if(e instanceof SearchFailure)fatal=e;throw e;}}:null;
   await queueClientGeocode([id],{force:true,lookup:wrapped});processed++;refreshSearch();renderMarkers();
   if(fatal){failure=fatal.message;break;}
   if(provider==='comparison'&&processed<ids.length&&!stopping)await new Promise(resolve=>setTimeout(resolve,3500));
  }
 }catch(e){failure=e.message;}
 finally{
  searching=false;el('startClientLocationSearch').disabled=false;el('stopClientLocationSearch').hidden=true;el('locationSearchScope').disabled=false;el('locationSearchProvider').disabled=false;
  refreshSearch();renderMarkers();if(!lastRoute&&!routeBusy&&!adjustingPin)fitConfirmed();
  el('clientLocationSearchProgress').textContent=(failure?'Busca interrompida: '+failure:stopping?'Busca interrompida pelo usuário.':'Busca terminada.')+' '+processed+' de '+ids.length+' consultados. Confirmados salvos neste aparelho; revise os pins aproximados abaixo.';
  const changed=ids.map(id=>clients.find(c=>String(c.id)===String(id))).find(c=>c&&P.location(c).ready);if(changed)flushLocation(changed.id);
 }
};
// Changing account ends future batch submissions; existing synchronization guards remain authoritative.
new MutationObserver(()=>{if(document.body.classList.contains('auth-locked')){stopping=true;cloudSequence++;notice.hidden=true;}}).observe(document.body,{attributes:true,attributeFilter:['class']});
refreshSearch();renderWorkspace();
})();

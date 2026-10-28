/* Map-centred customer location workflow. Uses existing IDs, account auth and revision-safe sync. */
(function(){
'use strict';
const el=id=>document.getElementById(id),P=TraxioPlanner;
function node(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
const nav=document.querySelector('nav.tabs'),main=document.querySelector('body>main');
// Fixed navigation must not be clipped/stacked by the scrolling content (notably WebKit).
nav.id='primaryNavigation';document.body.insertBefore(nav,main);
// The permanent sidebar is the sole page navigator. Keep pin/review cancellation on tab changes.
nav.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{if(reviewQueue){finishReview();}else if(adjustingPin){directPin=false;endPin();showNotice('Ajuste cancelado ao mudar de aba. A posição do cliente não foi alterada.');}}));

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
let directPin=false,pinStart=null,reviewQueue=null;
const pinAddress=node('p');pinAddress.id='pinClientAddress';pinTitle.after(pinAddress);
const queueControls=node('div',null,'row'),queueNext=node('button','Próximo cliente'),queueSkip=node('button','Pular por enquanto','secondary');queueNext.id='pinReviewNext';queueSkip.id='pinReviewSkip';queueNext.type=queueSkip.type='button';queueNext.hidden=queueSkip.hidden=true;queueControls.append(queueNext,queueSkip);pinPanel.append(queueControls);
function finishReview(){const q=reviewQueue;reviewQueue=null;directPin=false;document.body.classList.remove('pin-review-active');confirm.hidden=false;queueNext.hidden=queueSkip.hidden=true;cancel.textContent='Cancelar ajuste';endPin();if(q)showNotice('Revisão encerrada: '+q.saved+' posição(ões) confirmada(s) neste aparelho; '+q.skipped+' pulada(s). Confira os avisos de envio à conta.');}
function openQueuedPin(){
 if(!reviewQueue)return;const q=reviewQueue;
 while(q.index<q.ids.length){const c=clients.find(c=>String(c.id)===q.ids[q.index]);if(c&&!P.location(c).ready&&P.hasSavedPoint(c))break;q.index++;}
 if(q.index>=q.ids.length){finishReview();return;}
 q.savedCurrent=false;confirm.hidden=false;queueNext.hidden=true;queueSkip.hidden=false;window.traxeloReviewClient(q.ids[q.index]);pinTitle.textContent='Cliente '+(q.index+1)+' de '+q.ids.length+' · '+(clients.find(c=>String(c.id)===q.ids[q.index])?.name||'');cancel.textContent='Encerrar revisão';
}
function beginReview(ids){const selected=new P.IdSet(ids),items=clients.filter(c=>selected.has(c.id)&&!P.location(c).ready&&P.hasSavedPoint(c));if(!items.length){showNotice('Selecione clientes com pontos salvos para conferir no mapa.');return;}reviewQueue={ids:items.map(c=>String(c.id)),index:0,saved:0,skipped:0,savedCurrent:false};document.body.classList.add('pin-review-active');openQueuedPin();}
queueNext.onclick=()=>{if(reviewQueue){reviewQueue.index++;openQueuedPin();}};
queueSkip.onclick=()=>{if(reviewQueue){reviewQueue.skipped++;endPin();reviewQueue.index++;openQueuedPin();}};

function pinStatus(){
 if(!adjustingPin)return;pinPanel.hidden=false;const c=clients.find(c=>String(c.id)===String(editingClientId));pinTitle.textContent=c?'Conferir localização · '+c.name:'Conferir localização do novo cliente';pinAddress.textContent=c?.address||el('address').value;pinHelp.textContent='Arraste o pin laranja até a entrada da loja ou toque no mapa. Depois confirme para salvar.';if(reviewQueue)pinTitle.textContent='Cliente '+(reviewQueue.index+1)+' de '+reviewQueue.ids.length+' · '+(c?.name||'');confirm.disabled=!valid(num(el('lat').value),num(el('lon').value));
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
 if(reviewQueue){reviewQueue.saved++;reviewQueue.savedCurrent=true;directPin=false;switchTab('mapa');pinPanel.hidden=false;confirm.hidden=true;queueSkip.hidden=true;queueNext.hidden=false;queueNext.textContent=reviewQueue.index+1>=reviewQueue.ids.length?'Concluir revisão':'Próximo cliente';pinHelp.textContent='Posição confirmada e salva neste aparelho. A sincronização com a conta é informada no aviso.';}else if(directPin){directPin=false;switchTab('mapa');}else{switchTab('clientes');el('clientEditDialog')?.showModal();el('saveStatus').textContent='Posição confirmada e salva. Não é necessário salvar o cadastro novamente.';}
 flushLocation(record.id);refreshSearch();
};
cancel.onclick=()=>{if(reviewQueue){finishReview();return;}const toMap=directPin;directPin=false;endPin();if(pinStart){el('lat').value=pinStart.lat??'';el('lon').value=pinStart.lon??'';}el('mapStatus').textContent='Ajuste cancelado. A posição do cliente não foi alterada.';if(!toMap){switchTab('clientes');el('clientEditDialog')?.showModal();}else switchTab('mapa');};
window.traxeloReviewClient=id=>{
 const c=clients.find(c=>String(c.id)===String(id));if(!c)return;
 const cached=geoCandidates.get(c.id),candidate=valid(cached?.lat,cached?.lon)?cached:c.locationCandidate,point=valid(candidate?.lat,candidate?.lon)?candidate:valid(c.lat,c.lon)?c:null;
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
search.innerHTML='<summary>📍 Buscar localizações dos clientes</summary><p>Localize os endereços cadastrados. Imóveis identificados com segurança são salvos; pontos aproximados precisam de confirmação no mapa. A entrada física da loja pode exigir conferência.</p><div class="location-search-controls"><label>Clientes<select id="locationSearchScope"><option value="pending">Todos os não confirmados</option><option value="missing">Sem ponto disponível</option><option value="selected">Somente os selecionados</option><option value="filtered">Resultados dos filtros atuais</option></select></label><label>Serviço de busca<select id="locationSearchProvider"><option value="comparison">Geoapify + TomTom</option><option value="current">Busca atual (OpenStreetMap)</option></select></label><button type="button" id="startClientLocationSearch">Buscar e salvar localizações</button><button type="button" id="resumeClientLocationSearch" class="secondary" hidden>Retomar busca</button><button type="button" id="stopClientLocationSearch" class="secondary" hidden>Parar busca</button></div><p id="clientLocationSearchProgress" role="status" aria-live="polite">Escolha os clientes e inicie a busca.</p><p id="clientLocationSearchCounts"></p><div class="row"><button type="button" id="showLocatedClients" class="secondary">Enquadrar confirmados no mapa</button><button type="button" id="showLocationReviews" class="secondary">Revisar aproximações</button></div><div id="locationSearchReviewList"></div>';
document.querySelector('#mapa .workspace').before(search);
let searching=false,stopping=false;
function visibleClients(){const q=norm(el('mapClientSearch').value);return clients.filter(c=>(activePriorityFilter==='all'||String(c.priority||2)===activePriorityFilter)&&regionMatches(c)&&(!q||norm(c.name+' '+c.address+' '+(c.importFields||[]).map(f=>f.value).join(' ')).includes(q)));}
function refreshSearch(){
 const ready=clients.filter(c=>P.location(c).ready).length,review=clients.filter(c=>!P.location(c).ready&&P.hasSavedPoint(c)).length;
 el('clientLocationSearchCounts').textContent=ready+' confirmados · '+review+' pontos para conferir · '+(clients.length-ready-review)+' sem ponto disponível';
 el('showLocatedClients').disabled=!ready;
 const list=el('locationSearchReviewList');list.replaceChildren();
 for(const c of clients.filter(c=>!P.location(c).ready)){
  const candidate=geoCandidates.get(c.id)||c.locationCandidate,hasPoint=P.hasSavedPoint(c);
  if(!hasPoint&&!candidate?.error)continue;
  const row=node('article',null,'location-search-review');row.dataset.clientId=String(c.id);row.append(node('strong',c.name),node('p',hasPoint?'Localização aproximada: confira a entrada no mapa.':candidate.error));
  const action=node('button',hasPoint?'Confirmar pin no mapa':'Corrigir endereço','secondary');action.type='button';action.onclick=()=>window.traxeloReviewClient(c.id);row.append(action);list.append(row);
 }
}
const originalMarkers=renderMarkers;
renderMarkers=function(){
 originalMarkers();if(!map)return;
 for(const c of visibleClients().filter(c=>P.location(c).ready&&!selectedIds.has(c.id))){
  const b=node('button','●','traxelo-saved-pin');b.type='button';b.title='Cliente confirmado: '+c.name;b.setAttribute('aria-label',b.title);b.onclick=()=>window.TraxeloMapActions?.showClient(c.id,{fly:false});
  markers.push(new maplibregl.Marker({element:b}).setLngLat([Number(c.lon),Number(c.lat)]).addTo(map));
 }
};
const previousWorkspace=renderWorkspace;
renderWorkspace=function(){
 previousWorkspace();refreshSearch();
 for(const tile of el('mapClientList').querySelectorAll('.client-tile')){
  const c=clients.find(c=>String(c.id)===tile.dataset.clientId);if(!c)continue;const candidate=geoCandidates.get(c.id)||c.locationCandidate;
  let offeredPin=false;for(const b of tile.querySelectorAll('.tile-actions button'))if(['Conferir pin sugerido','Conferir ponto','Localizar cliente'].includes(b.textContent)){
   const hasPoint=P.hasSavedPoint(c);if(hasPoint&&offeredPin){b.hidden=true;continue;}if(hasPoint)offeredPin=true;b.textContent=hasPoint?'Confirmar pin no mapa':'Localizar cliente';b.onclick=()=>window.traxeloReviewClient(c.id);
  }
 }
};
function fitConfirmed(){initMap();const ready=visibleClients().filter(c=>P.location(c).ready);if(!map||!ready.length)return;renderMarkers();const bounds=new maplibregl.LngLatBounds();ready.forEach(c=>bounds.extend([Number(c.lon),Number(c.lat)]));map.fitBounds(bounds,{padding:55,maxZoom:16});}
el('showLocatedClients').onclick=fitConfirmed;
el('showLocationReviews').onclick=()=>{el('locationSearchReviewList').hidden=false;el('locationSearchReviewList').scrollIntoView({block:'nearest'});};
const R=TraxeloGeoRecovery,{SearchFailure}=R;
let batchController=null,checkpoint=null,checkpointOwner=null,accountEpoch=0;
async function account(){const response=await authClient?.auth.getSession(),user=response?.data?.session?.user;if(response?.error||!user?.id||user.is_anonymous||document.body.classList.contains('auth-locked'))throw R.httpFailure(401);const known=localStorage.getItem('traxio_sync_owner_v29');if(known&&known!==user.id)throw new SearchFailure('Este aparelho está associado a outra carteira. Sincronize a conta correta antes de buscar.',{code:'account'});return user.id;}
async function refreshResume(){
 const epoch=accountEpoch;try{const owner=await account();if(epoch!==accountEpoch)return;if(owner!==checkpointOwner){checkpointOwner=owner;checkpoint=R.checkpoint(owner);}
  const remaining=checkpoint.remaining(clients);el('resumeClientLocationSearch').hidden=searching||!remaining.length;el('resumeClientLocationSearch').textContent='Retomar busca ('+remaining.length+' pendentes)';
 }catch{el('resumeClientLocationSearch').hidden=true;}
}
el('stopClientLocationSearch').onclick=()=>{stopping=true;batchController?.abort();el('clientLocationSearchProgress').textContent='Busca pausada. Os resultados já salvos serão preservados.';};
async function comparisonLookup(c,{token,signal}={}){
 if(!token)throw R.httpFailure(401);
 const q={...TraxioGeo.parse(c),name:c.name};delete q.country;
 let response,data;
 try{response=await fetch((window.TraxioNative?.apiBase||'')+'/api/geolocation-benchmark',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(q),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(40000)]):AbortSignal.timeout(40000)});}
 catch(e){if(signal?.aborted)throw e;throw new SearchFailure(e.name==='TimeoutError'?'A consulta excedeu o tempo de espera.':'A comunicação com o servidor foi interrompida.',{code:e.name==='TimeoutError'?'timeout':'network',retryable:true});}
 try{data=await response.json();}catch{if(!response.ok)throw R.httpFailure(response.status,{requestId:response.headers.get('x-traxelo-request-id')});throw new SearchFailure('O servidor enviou uma resposta inválida.',{code:'invalid_response',requestId:response.headers.get('x-traxelo-request-id'),retryable:true});}
 if(!response.ok)throw R.httpFailure(response.status,data);
 if(!data.results||typeof data.results!=='object')throw new SearchFailure('O servidor não retornou os resultados esperados.',{code:'invalid_response',requestId:data.requestId,retryable:true});
 const results=Object.values(data.results),denied=results.find(p=>p.attempts?.some(a=>[401,403,429].includes(a.httpStatus)));
 if(denied){const status=denied.attempts.find(a=>[401,403,429].includes(a.httpStatus)).httpStatus;throw new SearchFailure(denied.provider+': '+(status===429?'cota ou limite de consultas atingido. Aguarde e retome a busca.':'chave recusada ou sem permissão para este produto. Confira as chaves no servidor.'),{code:status===429?'quota':'provider_permission',httpStatus:status,requestId:data.requestId});}
 const geo=data.results.geoapify;
 // TomTom address records do not prove rooftop precision. Preserve them for manual review.
 if(data.combined==='compatible'&&geo?.status==='compatible'&&geo.best?.precisionEvidence==='building_record'&&!geo.best.interpolated)return {status:'matched',best:geo.best,candidates:geo.candidates,query:data.query};
 const candidates=results.flatMap(p=>p.candidates||[]),best=results.find(p=>p.best)?.best||candidates.find(p=>valid(p.lat,p.lon));
 if(!best&&results.length&&results.every(p=>p.status==='error'))throw new SearchFailure('Geoapify e TomTom não concluíram a consulta. Os resultados anteriores permanecem salvos.',{code:'providers_unavailable',requestId:data.requestId,retryable:true});
 return {status:best?'review':'not_found',best,candidates,query:data.query,reason:data.combined==='conflict'?'Os serviços discordam da posição. Confira o pin no mapa.':best?'Ponto aproximado ou sem precisão de imóvel comprovada. Confirme o pin no mapa.':'Endereço não encontrado nos dois serviços.'};
}
async function runBatch(resume=false){
 if(searching)return;let owner,ids,provider;
 try{
  owner=await account();checkpointOwner=owner;checkpoint=R.checkpoint(owner);
  if(resume){const state=checkpoint.read();if(!state)throw Error('Nenhuma busca pendente nesta conta.');provider=state.provider;ids=checkpoint.remaining(clients);el('locationSearchProvider').value=provider;}
  else{const scope=el('locationSearchScope').value,selected=new P.IdSet(selectedIds),pool=scope==='selected'?clients.filter(c=>selected.has(c.id)):scope==='filtered'?visibleClients():clients;ids=pool.filter(c=>!P.location(c).ready&&(scope!=='missing'||!P.hasSavedPoint(c))).map(c=>String(c.id));provider=el('locationSearchProvider').value;if(ids.length)checkpoint.start(ids,provider);}
  if(!ids.length){el('clientLocationSearchProgress').textContent='Nenhum cliente pendente neste grupo. Os pontos já salvos foram preservados.';await refreshResume();return;}
 }catch(e){el('clientLocationSearchProgress').textContent=e.message;return;}
 searching=true;stopping=false;batchController=new AbortController();el('startClientLocationSearch').disabled=true;el('resumeClientLocationSearch').hidden=true;el('stopClientLocationSearch').hidden=false;el('locationSearchScope').disabled=true;el('locationSearchProvider').disabled=true;
 let processed=0,failure=null;const epoch=accountEpoch;
 try{
  for(const id of ids){
   if(stopping||epoch!==accountEpoch)break;if(await account()!==owner)throw new SearchFailure('A conta mudou. Retome a busca ao entrar na conta original.',{code:'account'});
   let c=clients.find(c=>String(c.id)===String(id));if(!c||P.location(c).ready)continue;
   const name=c.name;el('clientLocationSearchProgress').textContent='Buscando '+(processed+1)+' de '+ids.length+': '+name;
   const existing=geoJobs.get(String(id));if(existing){geocodeControllers.get(String(id))?.abort();await existing.promise;}
   if(stopping||epoch!==accountEpoch)break;c=clients.find(c=>String(c.id)===String(id));if(!c||P.location(c).ready)continue;
   const print=R.fingerprint(c),lookup=(row,options)=>{const signal=AbortSignal.any([options.signal,batchController.signal]);return R.retry(()=>provider==='comparison'?comparisonLookup(row,{...options,signal}):TraxioGeo.locate(row,{...options,signal}),{signal,onRetry:(n,e)=>{el('clientLocationSearchProgress').textContent=e.message+' Tentativa adicional '+n+' de 2 para '+name+'.';}});};
   const [outcome]=await queueClientGeocode([id],{force:true,lookup});if(stopping||epoch!==accountEpoch)break;
   if(outcome?.status==='error'&&outcome.error?.code!=='invalid_query')throw outcome.error;
   if(['stale','cancelled'].includes(outcome?.status))throw new SearchFailure('O cadastro mudou durante a consulta. Retome a busca para usar o endereço atualizado.',{code:'stale'});
   checkpoint.complete(id,print,outcome?.error?.code==='invalid_query'?'invalid_query':outcome?.status||'skipped');processed++;refreshSearch();renderMarkers();
   if(provider==='comparison'&&processed<ids.length)await R.wait(3500,batchController.signal);
  }
 }catch(e){if(!stopping&&epoch===accountEpoch)failure=e;}
 finally{
  searching=false;batchController=null;el('startClientLocationSearch').disabled=false;el('stopClientLocationSearch').hidden=true;el('locationSearchScope').disabled=false;el('locationSearchProvider').disabled=false;
  if(epoch===accountEpoch){refreshSearch();renderMarkers();if(!lastRoute&&!routeBusy&&!adjustingPin)fitConfirmed();const left=checkpoint.remaining(clients).length,total=checkpoint.read().ids.length;el('clientLocationSearchProgress').textContent=(failure?'Busca pausada: '+failure.message:stopping?'Busca pausada pelo usuário.':'Busca terminada.')+' '+(total-left)+' de '+total+' concluídos; '+left+' pendentes. Os resultados salvos foram preservados.'+(failure?.requestId?' Código de atendimento: '+failure.requestId+'.':'')+(left?' Use Retomar busca para continuar.':' Revise as aproximações no mapa.');const changed=ids.map(id=>clients.find(c=>String(c.id)===String(id))).find(c=>c&&P.location(c).ready);if(changed)flushLocation(changed.id);await refreshResume();}
 }
}
window.TraxeloLocations={comparisonLookup,flushLocation,beginReview,refreshSearch,visibleClients,fitConfirmed,refreshResume};
el('startClientLocationSearch').onclick=()=>runBatch(false);el('resumeClientLocationSearch').onclick=()=>runBatch(true);
const priorUnlock=window.authUnlock;window.authUnlock=function(user){if(checkpointOwner&&user?.id!==checkpointOwner){accountEpoch++;stopping=true;batchController?.abort();checkpoint=null;checkpointOwner=null;}const value=priorUnlock?.apply(this,arguments);refreshResume();return value;};
refreshResume();
// Changing account ends future batch submissions; existing synchronization guards remain authoritative.
new MutationObserver(()=>{if(document.body.classList.contains('auth-locked')){if(reviewQueue)finishReview();accountEpoch++;stopping=true;batchController?.abort();el('resumeClientLocationSearch').hidden=true;for(const controller of geocodeControllers.values())controller.abort();cloudSequence++;notice.hidden=true;}}).observe(document.body,{attributes:true,attributeFilter:['class']});
refreshSearch();renderWorkspace();
})();

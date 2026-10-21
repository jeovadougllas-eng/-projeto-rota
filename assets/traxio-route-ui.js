/* One controller for client selection, readiness, origins and road-route transactions. */
'use strict';
document.addEventListener('DOMContentLoaded',()=>{
 const el=id=>document.getElementById(id), P=TraxioPlanner;
 let generation=0,controller=null,manualOrigin=null,manualDraft=null,checking=false,selectionKey=null,lastSignature='',consentResolve=null;
 const state={phase:'awaiting-selection',excluded:[]};
 const labels={'awaiting-selection':'Aguardando seleção','awaiting-origin':'Aguardando origem','checking-locations':'Verificando localizações','calculating':'Calculando rota','calculated':'Rota calculada','partial':'Rota parcialmente calculada','location-error':'Falha de localização','communication-error':'Falha de comunicação','impossible':'Nenhuma rota possível','review':'Revisão necessária'};
 function node(tag,id,text){const n=document.createElement(tag);if(id)n.id=id;if(text)n.textContent=text;return n;}
 const workspace=document.querySelector('#mapa .workspace'),side=document.querySelector('.workspace-side'),planner=document.querySelector('.workspace-route'),mapPanel=document.querySelector('.workspace-map');
 const panel=node('details','routePlannerPanel'),summary=node('summary',null,'Planejar visitas');panel.open=true;panel.append(summary,side,planner);workspace.prepend(panel);
 const steps=node('p','routeSteps','Selecionar clientes → Definir origem → Escolher critério → Calcular → Conferir rota → Iniciar navegação');summary.after(steps);
 const badge=node('p','plannerState');badge.setAttribute('role','status');badge.setAttribute('aria-live','polite');el('routeResult').before(badge);
 el('routeResult').setAttribute('role','status');el('routeResult').setAttribute('aria-live','polite');
 el('selectAllClients').textContent='Selecionar resultados filtrados';
 const all=node('button','selectEntirePortfolio','Selecionar toda a carteira');all.type='button';all.className='secondary';el('selectNoClients').after(all);
 all.onclick=()=>{for(const c of clients)selectedIds.add(c.id);syncRouteChoices();renderWorkspace();refresh();};
 const readiness=node('div','routeReadiness');readiness.setAttribute('role','status');el('selectedCount').after(readiness);
 const review=node('details','locationReview'),reviewSummary=node('summary',null,'Revisar localizações'),reviewList=node('div','locationReviewList');
 const retry=node('button','retrySelectedLocations','Tentar localizar pendentes novamente');retry.type='button';retry.className='secondary';
 review.append(reviewSummary,reviewList,retry);side.append(review);
 const secondary=node('details','adHocDisclosure'),adHocSummary=node('summary',null,'Destino avulso');secondary.append(adHocSummary);el('traxioAvulso').before(secondary);secondary.append(el('traxioAvulso'));
 el('traxioAvulso').querySelector('h3').textContent='Destino avulso';
 const trace=document.querySelector('.approved-trace-route');
 if(trace){trace.onclick=()=>{el('calcRoute').click();};trace.hidden=true;}
 el('origin').add(new Option('Endereço ou ponto no mapa','manual'));
 const originForm=node('div','manualOriginFields');
 originForm.hidden=true;
 originForm.innerHTML='<label for="routeOriginAddress">Endereço da origem</label><div class="row"><input id="routeOriginAddress" placeholder="Rua, número, bairro, cidade, UF" autocomplete="street-address"><button type="button" id="findRouteOrigin">Buscar origem</button><button type="button" id="pickRouteOrigin" class="secondary">Marcar origem no mapa</button></div><p id="routeOriginStatus" role="status">Informe o endereço completo ou confirme um ponto no mapa.</p><div id="routeOriginSuggestions"></div><button type="button" id="confirmRouteOrigin" hidden>Confirmar este ponto como origem</button>';
 el('origin').after(originForm);
 const citySearch=node('input','regionCitySearch');citySearch.type='search';citySearch.placeholder='Buscar cidade';citySearch.setAttribute('aria-label','Buscar cidade');el('regionCity').before(citySearch);
 const districtSearch=node('input','regionNeighborhoodSearch');districtSearch.type='search';districtSearch.placeholder='Buscar bairro';districtSearch.setAttribute('aria-label','Buscar bairro');el('regionNeighborhoods').before(districtSearch);
 function applyRegionSearch(){const cq=norm(citySearch.value),dq=norm(districtSearch.value);for(const o of el('regionCity').options)o.hidden=o.value!=='all'&&o.value!==el('regionCity').value&&!norm(o.textContent).includes(cq);for(const label of el('regionNeighborhoods').children)label.hidden=!norm(label.textContent).includes(dq);}
 citySearch.oninput=applyRegionSearch;districtSearch.oninput=applyRegionSearch;
 new MutationObserver(applyRegionSearch).observe(el('regionNeighborhoods'),{childList:true});
 function originSignature(){return JSON.stringify([el('origin').value,manualOrigin]);}
 function signature(){return P.signature(clients,selectedIds,originSignature());}
 function current(run){return run===generation&&!controller?.signal.aborted;}
 function phase(name,message){state.phase=name;badge.textContent=labels[name]||name;badge.dataset.phase=name;el('mapa').dataset.routeState=name;if(message)el('routeResult').textContent=message;const busy=['calculating','checking-locations'].includes(name);el('calcRoute').disabled=busy;el('generateSuggestion').disabled=busy;el('roadRoute').disabled=busy||!lastRoute;planner.setAttribute('aria-busy',String(busy));}
 function cancel(message){
  generation++;controller?.abort();controller=null;routeBusy=false;routeLookupBusy=false;
  if(consentResolve){consentResolve(false);consentResolve=null;}if(dialog.open)dialog.close();
  window.traxioResetNavigation?.();lastRoute=null;window.traxioPendingTrip=null;
  el('saveCompletedRoute')?.remove();clearRouteVisual();el('routeOrder').replaceChildren();
  phase(selectedIds.size?'awaiting-origin':'awaiting-selection',message||'Planejamento alterado. Confira a origem e calcule novamente.');
 }
 function selectedInOrder(){const byId=new Map(clients.map(c=>[String(c.id),c]));return [...selectedIds].map(id=>byId.get(String(id))).filter(Boolean);}
 function persist(){
  if(!selectionKey)return;
  try{localStorage.setItem(selectionKey,JSON.stringify([...selectedIds]));}catch{el('mapStatus').textContent='Não foi possível salvar a seleção neste dispositivo.';}
 }
 async function hydrate(){
  const response=await authClient?.auth.getSession();const user=response?.data?.session?.user;
  if(!user)return;
  const key='traxio.route.selection.v1:'+user.id;
  if(selectionKey===key)return;
  selectionKey=key;let stored=null;try{stored=JSON.parse(localStorage.getItem(key)||'null');}catch{}
  if(Array.isArray(stored)){selectedIds=new P.IdSet(stored);selectionInitialized=true;syncRouteChoices();renderWorkspace();}
  lastSignature=signature();refresh();
 }
 const authObserver=new MutationObserver(()=>{if(document.body.classList.contains('auth-locked')){selectionKey=null;selectedIds.clear();cancel('Entre na sua conta para planejar as visitas.');}else hydrate().catch(()=>{});});
 authObserver.observe(document.body,{attributes:true,attributeFilter:['class']});hydrate().catch(()=>{});
 function refresh(){
  const fingerprint=signature();
  if(lastSignature&&fingerprint!==lastSignature&&(routeBusy||lastRoute||dialog.open))cancel('Seleção, endereço ou origem alterados. Calcule o trajeto atualizado.');
  lastSignature=fingerprint;persist();
  const result=P.partition(clients,selectedIds);
  readiness.textContent=result.total+' selecionados · '+result.ready.length+' aptos · '+result.unverified.length+' não verificados · '+result.blocked.length+' pendentes'+(result.unloaded.length?' · '+result.unloaded.length+' aguardando sincronização':'');
  summary.textContent='Planejar visitas · '+result.total+' selecionados · '+result.ready.length+' aptos';
  const shouldBuild=JSON.stringify([...result.blocked,...result.unverified].map(c=>[c.id,c.locationCandidate?.error,geoCandidates.get(c.id)?.error,c.locationVerification]));
  if(reviewList.dataset.content!==shouldBuild){
   reviewList.dataset.content=shouldBuild;reviewList.replaceChildren();
   for(const c of [...result.blocked,...result.unverified]){
    const row=node('article');row.className='location-review-row';const status=P.location(c);
    row.append(node('strong',null,c.name),node('p',null,(status.kind==='unverified'?'Coordenadas importadas ou não verificadas.':geoCandidates.get(c.id)?.error||c.locationCandidate?.error||'Sem localização exata confirmada.')+' '+(c.address||'Endereço ausente')));
    const edit=node('button',null,'Corrigir endereço / confirmar no mapa');edit.type='button';edit.className='secondary';edit.onclick=()=>openClientLocation(c.id,c.locationCandidate||geoCandidates.get(c.id));row.append(edit);reviewList.append(row);
   }
   for(const id of result.unloaded)reviewList.append(node('p',null,'Cliente '+id+': aguardando registro da sincronização. A seleção foi preservada.'));
  }
  reviewSummary.textContent='Revisar localizações ('+(result.blocked.length+result.unverified.length+result.unloaded.length)+')';
  retry.disabled=checking||!result.blocked.length;
  if(!selectedIds.size&&!routeBusy&&!lastRoute)phase('awaiting-selection','Selecione clientes para começar.');
  renderMarkers();
 }
 new MutationObserver(refresh).observe(el('selectedCount'),{childList:true,characterData:true,subtree:true});
 const originalRenderWorkspace=renderWorkspace;
 renderWorkspace=function(){originalRenderWorkspace();refresh();};
 const originalRender=render;
 render=function(){originalRender();refresh();};
 // Review is explicit; geocoder candidates never silently become verified clients.
 retry.onclick=async()=>{
  if(checking)return;checking=true;const ids=P.partition(clients,selectedIds).blocked.map(c=>c.id);
  for(const id of ids){geoCandidates.delete(id);const c=clients.find(c=>String(c.id)===String(id));if(c)delete c.locationCandidate;}
  phase('checking-locations','Consultando CEP, logradouro e número. As buscas respeitam os limites do serviço.');
  refresh();try{await queueClientGeocode(ids);}finally{checking=false;phase('review','Verificação terminada. Confira os aptos e as pendências antes de calcular.');refresh();}
 };
 const dialog=node('dialog','partialRouteDialog');dialog.setAttribute('aria-labelledby','partialRouteTitle');
 dialog.innerHTML='<h2 id="partialRouteTitle">Conferir clientes da rota</h2><p id="partialRouteMessage"></p><ul id="partialRouteClients"></ul><div class="row"><button type="button" id="confirmPartialRoute">Calcular com os clientes indicados</button><button type="button" id="cancelPartialRoute" class="secondary">Corrigir localizações</button></div>';
 document.body.append(dialog);
 dialog.addEventListener('cancel',()=>{consentResolve?.(false);consentResolve=null;});
 function confirmSubset(report){
  phase('review','Há localizações que exigem revisão. Confirme os clientes que serão usados na rota.');
  el('partialRouteMessage').textContent=report.ready.length+' com localização confirmada; '+report.unverified.length+' com coordenadas não verificadas; '+(report.blocked.length+report.unloaded.length)+' serão excluídos. Coordenadas não verificadas podem estar incorretas. Usá-las não altera sua classificação no cadastro.';
  el('partialRouteClients').replaceChildren();
  for(const c of [...report.blocked,...report.unverified]){const li=node('li',null,c.name+': '+(P.location(c).consent?'coordenadas não verificadas, incluídas somente com sua confirmação':'sem localização confirmada, excluído'));el('partialRouteClients').append(li);}
  for(const id of report.unloaded)el('partialRouteClients').append(node('li',null,id+': registro ainda não carregado, excluído'));
  el('confirmPartialRoute').disabled=!report.ready.length&&!report.unverified.length;
  dialog.showModal();
  return new Promise(resolve=>{consentResolve=resolve;});
 }
 el('confirmPartialRoute').onclick=()=>{const done=consentResolve;consentResolve=null;dialog.close();done?.(true);};
 el('cancelPartialRoute').onclick=()=>{const done=consentResolve;consentResolve=null;dialog.close();review.open=true;done?.(false);review.scrollIntoView({block:'nearest'});};
 function manualChanged(){manualOrigin=null;manualDraft=null;el('confirmRouteOrigin').hidden=true;cancel('Confirme a nova origem e calcule novamente.');lastSignature=signature();}
 el('routeOriginAddress').oninput=manualChanged;
 el('origin').addEventListener('change',()=>{originForm.hidden=el('origin').value!=='manual';cancel('Origem alterada. Confira os dados e calcule novamente.');lastSignature=signature();});
 el('findRouteOrigin').onclick=async()=>{
  manualChanged();const q=el('routeOriginAddress').value.trim();if(q.length<8){el('routeOriginStatus').textContent='Informe rua, número, cidade e UF.';return;}
  el('routeOriginStatus').textContent='Buscando a origem…';const text=q,run=generation;
  try{
   const result=await TraxioGeo.locate({address:q},{token:await geoToken()});
   if(run!==generation||text!==el('routeOriginAddress').value.trim())return;
   const p=result.best;
   if(!p){el('routeOriginStatus').textContent=result.reason||'Origem não encontrada. Confira os dados ou marque o ponto no mapa.';return;}
   manualDraft={lat:p.lat,lon:p.lon,name:q};el('routeOriginStatus').textContent=result.status==='matched'?'Número encontrado. Confirme esta origem.':'Sugestão aproximada. Confira o marcador no mapa antes de confirmar a origem.';
   initMap();if(map&&window.maplibregl){originMarker?.remove();originMarker=new maplibregl.Marker({color:'#f97316',draggable:true}).setLngLat([p.lon,p.lat]).addTo(map);originMarker.on('dragend',()=>{const p=originMarker.getLngLat();manualDraft={lat:p.lat,lon:p.lng,name:q};});map.flyTo({center:[p.lon,p.lat],zoom:17});}
   el('confirmRouteOrigin').hidden=false;el('routeOriginAddress').blur();
  }catch(e){if(run===generation)el('routeOriginStatus').textContent='Falha ao buscar origem: '+e.message;}
 };
 let originMarker=null;
 el('pickRouteOrigin').onclick=()=>{
  initMap();if(!map){el('routeOriginStatus').textContent='Mapa indisponível. Confira a conexão.';return;}
  manualChanged();window.traxioPickingOrigin=true;el('routeOriginStatus').textContent='Toque na entrada do local no mapa e confirme a origem.';mapPanel.scrollIntoView({block:'nearest'});
 };
 const originMapInit=initMap;
 initMap=function(){originMapInit();if(map&&!map.__traxioOrigin){map.__traxioOrigin=true;map.on('click',e=>{if(!window.traxioPickingOrigin)return;manualDraft={lat:e.lngLat.lat,lon:e.lngLat.lng,name:'Origem confirmada no mapa'};originMarker?.remove();originMarker=new maplibregl.Marker({color:'#f97316'}).setLngLat([manualDraft.lon,manualDraft.lat]).addTo(map);el('confirmRouteOrigin').hidden=false;el('routeOriginStatus').textContent='Ponto selecionado. Confirme para usá-lo como origem.';});}};
 el('confirmRouteOrigin').onclick=()=>{if(!manualDraft)return;manualOrigin={...manualDraft};window.traxioPickingOrigin=false;cancel('Origem confirmada. Organize as visitas.');lastSignature=signature();el('routeOriginStatus').textContent='Origem confirmada: '+manualOrigin.lat.toFixed(6)+', '+manualOrigin.lon.toFixed(6);el('confirmRouteOrigin').hidden=true;};
 el('myLocation').onclick=async()=>{
  phase('awaiting-origin','Obtendo sua localização…');const run=generation;
  try{const point=await requestGPS();if(run!==generation)return;el('origin').value='gps';originForm.hidden=true;cancel('Origem por GPS definida. Organize as visitas.');lastSignature=signature();initMap();map?.flyTo({center:[point.lon,point.lat],zoom:15});}
  catch(e){phase('awaiting-origin','GPS indisponível: '+e.message+'. Autorize a localização ou escolha uma origem manual.');}
 };
 async function waitForGeometry(geometry,signal){
  initMap();if(!map||!window.maplibregl)throw Error('Mapa indisponível. Confira a conexão e tente novamente.');
  if(!map.isStyleLoaded())await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>finish(Error('O mapa não terminou de carregar.')),20000);
   function ready(){finish();}function aborted(){finish(new DOMException('Cancelado','AbortError'));}
   function finish(error){clearTimeout(timeout);map.off?.('style.load',ready);map.off?.('load',ready);signal.removeEventListener('abort',aborted);error?reject(error):resolve();}
   map.once('style.load',ready);map.once('load',ready);signal.addEventListener('abort',aborted,{once:true});if(signal.aborted)aborted();
  });
  signal.throwIfAborted();displayRoadGeometry(geometry);
  if(!map.getSource('route')||!map.getLayer('route-line'))throw Error('Não foi possível renderizar o itinerário no mapa.');
 }
 async function calculate(strategy='distance',{existing=null}={}){
  if(routeBusy||checking){el('mapStatus').textContent='Já há uma operação em andamento. Aguarde ou limpe o trajeto para cancelar.';return;}
  cancel('Verificando os clientes selecionados…');const run=generation;controller=new AbortController();const signal=controller.signal;
  routeBusy=true;phase('checking-locations','Verificando as localizações antes de calcular…');
  try{
   let report=P.partition(selectedInOrder(),selectedIds);
   if(!report.total){phase('awaiting-selection','Selecione pelo menos um cliente.');return;}
   let consent=false;
   if(report.blocked.length||report.unverified.length||report.unloaded.length){consent=await confirmSubset(report);if(!current(run))return;if(!consent){phase('location-error','Corrija as localizações indicadas ou confirme uma rota com os clientes aptos.');return;}}
   report=P.partition(selectedInOrder(),selectedIds,{allowUnverified:consent});
   const points=report.ready;
   if(!points.length){review.open=true;phase('location-error','Nenhum cliente selecionado possui localização utilizável. Corrija os endereços ou confirme os pontos no mapa.');return;}
   state.excluded=[...report.blocked.map(c=>String(c.id)),...report.unloaded];
   const snapshot=signature();let start;phase('awaiting-origin','Verificando a origem da rota…');
   if(existing)start=existing.start;
   else if(el('origin').value==='manual'){if(!manualOrigin){phase('awaiting-origin','Busque e confirme o endereço ou marque a origem no mapa.');return;}start={...manualOrigin};}
   else if(el('origin').value==='gps'){try{start=await requestGPS();}catch(e){phase('awaiting-origin','GPS indisponível: '+e.message+'. Autorize a localização ou escolha uma origem manual.');return;}}
   else start=points[0];
   if(!current(run)||snapshot!==signature())return;
   const nodes=existing?[start,...existing.points]:[start,...points.filter(c=>!(start.id!==undefined&&String(c.id)===String(start.id)))];
   if(nodes.length<2){phase('impossible','A origem já é o único cliente selecionado. Escolha GPS ou uma origem manual para traçar o percurso.');return;}
   phase('calculating','Calculando sequência e trajeto pelas ruas…');
   const matrix=existing?null:await roadMatrix(nodes,{signal});if(!current(run))return;
   const arranged=existing?existing.points:optimizeStrategy(nodes,matrix,strategy).slice(1).map(i=>nodes[i]);
   const road=await fetchRoadRoute([start,...arranged],{signal});
   if(!current(run)||snapshot!==signature())return;
   await waitForGeometry(road.geometry,signal);if(!current(run))return;
   lastRoute={start,points:arranged,excluded:[...state.excluded],strategy};showOrder(arranged);renderMarkers();
   window.traxioBeginNavigation?.(arranged,road.geometry);
   const partial=state.excluded.length>0;
   phase(partial?'partial':'calculated','Trajeto por ruas: '+(road.distance/1000).toFixed(1)+' km · '+Math.round(road.duration/60)+' min estimados · '+arranged.length+' paradas'+(start.id!==undefined?' + cliente de origem':'')+'. '+(partial?state.excluded.length+' clientes excluídos com sua confirmação. ':'')+(consent?'Coordenadas não verificadas incluídas com sua confirmação. ':'')+'Sem trânsito em tempo real.');
   window.traxioPendingTrip={distanceKm:road.distance/1000,durationMin:Math.round(road.duration/60),names:arranged.map(c=>c.name),strategy,at:new Date().toISOString(),excluded:[...state.excluded]};
   window.traxioShowSaveTrip?.();map?.resize();mapPanel.scrollIntoView({block:'nearest',behavior:'smooth'});
  }catch(e){
   if(!current(run)||signal.aborted)return;
   window.traxioResetNavigation?.();lastRoute=null;clearRouteVisual();el('routeOrder').replaceChildren();
   const impossible=/ligação|ligacao|rodoviário não encontrado|rodoviario|origem e um destino/i.test(e.message);
   phase(impossible?'impossible':'communication-error','Rota não calculada: '+e.message+'. Confira a conexão e tente novamente. Nenhum itinerário foi confirmado.');
  }finally{if(current(run)){routeBusy=false;controller=null;el('calcRoute').disabled=false;el('generateSuggestion').disabled=false;el('roadRoute').disabled=!lastRoute;}}
 }
 el('clearRoute').onclick=()=>{cancel('Trajeto limpo. A seleção de clientes foi preservada.');lastSignature=signature();};
 // Manual stop ordering invalidates street geometry until explicitly retraced.
 const originalSwap=swapStops;
 swapStops=function(a,b){originalSwap(a,b);window.traxioResetNavigation?.();el('liveNavigation').hidden=true;phase('awaiting-origin','Ordem ajustada. Toque em Traçar pelas ruas para confirmar o novo itinerário.');};
 window.TraxioRouteUI={calculate,retrace:()=>{const existing=lastRoute;if(!existing){phase('impossible','Calcule uma rota antes de atualizar o trajeto.');return;}return calculate(existing.strategy||'distance',{existing});},state,refresh};
 // Keep keyboard-driven fields visible for any browser implementing VisualViewport.
 let viewportFrame=0;
 function viewportChanged(){cancelAnimationFrame(viewportFrame);viewportFrame=requestAnimationFrame(()=>{const viewport=window.visualViewport;document.documentElement.style.setProperty('--route-visible-height',(viewport?.height||innerHeight)+'px');const focused=document.activeElement;if(focused?.matches('#mapa input,#mapa select'))focused.scrollIntoView({block:'nearest',inline:'nearest'});map?.resize();});}
 visualViewport?.addEventListener('resize',viewportChanged);visualViewport?.addEventListener('scroll',viewportChanged);
 document.querySelector('#mapa').addEventListener('focusin',viewportChanged);window.addEventListener('resize',viewportChanged);
 panel.addEventListener('toggle',()=>map?.resize());viewportChanged();lastSignature=signature();refresh();
});

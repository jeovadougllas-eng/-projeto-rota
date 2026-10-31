(function(){
const $=id=>document.getElementById(id),N=TraxeloNavigationModel;
let watch=null,car=null,route=null,arrivedSince=0,previousPosition=null;let rerouteBusy=false,lastRerouteAt=0,offRouteSince=null,activeGeometry=null,offRouteSamples=0,navGeneration=0,rerouteController=null;
let activeLeg=null,latestFix=null,trackingRequested=false,retryTimer=null,watchRetryTimer=null,retryCount=0;
let originalMapParent=null,originalMapNext=null,originalPanelParent=null,originalPanelNext=null;
let following=true,course=null,courseAnchor=null,cameraMap=null,carAngle=0;
function syncCarDirection(){
 if(!car)return;
 const screenAngle=(course??0)-(map?.getBearing?.()||0);
 carAngle+=N.bearingDelta(carAngle,screenAngle);
 car.getElement().style.setProperty('--car-bearing',carAngle+'deg');
}
function syncRecenter(){const button=$('navigationRecenter');if(button)button.hidden=!trackingRequested||following;}
function cameraFollow({resetZoom=false}={}){
 if(!following||!trackingRequested||!map||!latestFix||Date.now()-latestFix.at>20000||document.hidden)return;
 const current=map.getBearing?.()||0,bearing=current+N.bearingDelta(current,course??current);
 map.easeTo({center:latestFix.coord,bearing,pitch:0,zoom:resetZoom?16:Math.max(map.getZoom?.()||16,15),duration:500},{rotamapaFollow:true});
 syncCarDirection();
}
function browseMap(event){
 if(!trackingRequested||(!event?.originalEvent&&event?.type!=='dragstart'))return;
 following=false;syncRecenter();
}
function bindCamera(){
 if(!map||cameraMap===map)return;
 if(cameraMap){for(const event of ['movestart','zoomstart','rotatestart','pitchstart','dragstart'])cameraMap.off(event,browseMap);cameraMap.off('rotate',syncCarDirection);}
 cameraMap=map;
 for(const event of ['movestart','zoomstart','rotatestart','pitchstart','dragstart'])map.on(event,browseMap);
 map.on('rotate',syncCarDirection);
 const mapEl=$('map');
 if(!$('navigationRecenter')){
  const button=document.createElement('button');button.id='navigationRecenter';button.type='button';button.hidden=true;button.setAttribute('aria-label','Recentralizar navegação');
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 7 17-7-4-7 4Z"/></svg><span>Recentralizar</span>';
  button.onclick=()=>{
   if(!trackingRequested)return;
   following=true;syncRecenter();
   if(latestFix&&Date.now()-latestFix.at<=20000){cameraFollow({resetZoom:true});return;}
   status('Aguardando posição atual para recentralizar…');const generation=navGeneration;
   navigator.geolocation.getCurrentPosition(p=>{if(generation===navGeneration&&trackingRequested)position(p);},watchError,{enableHighAccuracy:true,maximumAge:0,timeout:18000});
  };
  mapEl.append(button);
  // NavigationControl's zoom/compass buttons may animate without originalEvent.
  mapEl.addEventListener('click',event=>{if(event.target.closest('.maplibregl-ctrl button'))browseMap({originalEvent:event});},true);
 }
 syncRecenter();
}

function enterNav(){
const overlay=$('traxioNavOverlay'),mapEl=$('map'),panel=$('liveNavigation');
if(!mapEl||!map||!panel)return;
overlay.classList.remove('traxio-mini');
if(!originalMapParent){originalMapParent=mapEl.parentNode;originalMapNext=mapEl.nextSibling;originalPanelParent=panel.parentNode;originalPanelNext=panel.nextSibling}
$('traxioNavMapHost').appendChild(mapEl);$('traxioNavControls').appendChild(panel);
overlay.hidden=false;if(typeof overlay.showPopover==='function'){overlay.setAttribute('popover','manual');if(!overlay.matches(':popover-open'))try{overlay.showPopover();}catch{}}$('traxioNavExpand').hidden=true;document.body.classList.add('traxio-navigating');
bindCamera();setTimeout(()=>{map.resize();cameraFollow()},80);
}
function exitNav(){
const overlay=$('traxioNavOverlay');if(overlay.hidden)return;
const mapEl=$('map'),panel=$('liveNavigation');
if(originalMapParent){originalMapParent.insertBefore(mapEl,originalMapNext?.parentNode===originalMapParent?originalMapNext:null);originalPanelParent.insertBefore(panel,originalPanelNext?.parentNode===originalPanelParent?originalPanelNext:null)}
if(typeof overlay.hidePopover==='function'&&overlay.matches(':popover-open'))overlay.hidePopover();overlay.hidden=true;overlay.classList.remove('traxio-mini');$('traxioNavExpand').hidden=watch===null;document.body.classList.remove('traxio-navigating');setTimeout(()=>map?.resize(),80);
}
$('traxioNavMinimize').onclick=()=>{const o=$('traxioNavOverlay');o.classList.add('traxio-mini');document.body.classList.remove('traxio-navigating');setTimeout(()=>map?.resize(),90)};
const restore=document.createElement('button');restore.type='button';restore.className='traxio-mini-restore';restore.textContent='⛶ Ampliar';restore.onclick=()=>{const o=$('traxioNavOverlay');o.classList.remove('traxio-mini');document.body.classList.add('traxio-navigating');setTimeout(()=>map?.resize(),90)};$('traxioNavMinimize').parentNode.prepend(restore);$('traxioNavClose').onclick=exitNav;$('traxioNavExpand').onclick=enterNav;

window.traxioVisitedIds=new Set();window.traxioSetActiveGeometry=g=>{activeGeometry=g;activeLeg=N.firstLeg(g,route?.legs,next());};
function status(msg){$('liveGPSState').textContent=msg}
function stops(){return route?.stops||[]}
function next(){return stops().find(x=>!x.visited)}
function render(){
const destination=next(),apple=$('openAppleMaps');$('confirmVisit').disabled=!destination;
for(const provider of ['google','waze']){const link=$(provider==='google'?'openGoogleMaps':'openWaze');if(destination){const pair=destination.lat+','+destination.lon;const url=new URL(provider==='google'?'https://www.google.com/maps/dir/':'https://waze.com/ul');if(provider==='google'){url.searchParams.set('api','1');url.searchParams.set('destination',pair);url.searchParams.set('travelmode','driving');url.searchParams.set('dir_action','navigate');}else{url.searchParams.set('ll',pair);url.searchParams.set('navigate','yes');url.searchParams.set('utm_source','traxio');}link.href=url.href;link.setAttribute('aria-disabled','false');}else{link.removeAttribute('href');link.setAttribute('aria-disabled','true');}}
if(destination){const url=new URL('https://maps.apple.com/');url.searchParams.set('daddr',destination.lat+','+destination.lon);url.searchParams.set('dirflg','d');apple.href=url.href;apple.setAttribute('aria-disabled','false');apple.title='Navegar até '+destination.name+' no Apple Maps';}else{apple.removeAttribute('href');apple.setAttribute('aria-disabled','true');}
const list=$('liveStopList');list.replaceChildren();
stops().forEach((stop,i)=>{const d=document.createElement('div');d.className='live-stop'+(stop.visited?' visited':next()===stop?' next':'');const icon=document.createElement('span');icon.textContent=stop.visited?'✓':String(i+1);const name=document.createElement('span');name.textContent=stop.name+(stop.visited?' · visitado':'');d.append(icon,name);list.append(d)});
$('liveNextStop').textContent=next()?'Próxima parada: '+next().name:route?'Todas as paradas foram registradas.':'Nenhuma rota em andamento.';
renderMarkers();
}
window.traxioResetNavigation=()=>{stopGPS();route=null;window.traxioVisitedIds.clear();$('liveNavigation').hidden=true;};
function stopGPS(){trackingRequested=false;following=true;course=null;courseAnchor=null;carAngle=0;syncRecenter();clearTimeout(retryTimer);clearTimeout(watchRetryTimer);retryCount=0;latestFix=null;activeLeg=null;navGeneration++;rerouteController?.abort();rerouteController=null;rerouteBusy=false;lastRerouteAt=0;offRouteSamples=0;exitNav();$('traxioNavExpand').hidden=true;activeGeometry=null;offRouteSince=null;if(watch!==null){navigator.geolocation.clearWatch(watch);watch=null}if(car){car.remove();car=null}previousPosition=null;arrivedSince=0;$('navigationRecalculate').disabled=true;$('liveStart').disabled=false;$('liveStart').hidden=false;$('liveStop').disabled=true;status('GPS desligado')}
function recordHistory(outcome){
const key=RotaMapaPortfolioScope.key('traxio.route.history.v1:'+(document.getElementById('authIdentity')?.textContent||'account'),RotaMapaPortfolioScope.loadedOwner);
let rows=[];try{rows=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(rows))rows=[]}catch{}
const visited=stops().filter(x=>x.visited),pending=stops().filter(x=>!x.visited);
const p=window.traxioPendingTrip||{};
rows.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),completedAt:new Date().toISOString(),names:visited.map(x=>x.name),pendingNames:pending.map(x=>x.name),distanceKm:0,durationMin:0,plannedDistanceKm:Number(p.distanceKm)||0,executionStatus:outcome,source:visited.some(s=>s.arrivalSource==='manual')?'manual-and-gps-visits':'gps-arrival',note:'Distância real não aferida pelo hodômetro; não somada aos quilômetros percorridos.'});
localStorage.setItem(key,JSON.stringify(rows));
}
function end(outcome){
if(!route)return;
stopGPS();recordHistory(outcome);
const done=stops().filter(x=>x.visited).length,total=stops().length;
route=null;window.traxioVisitedIds.clear();$('liveNavigation').hidden=true;
$('routeResult').textContent=(outcome==='completed'?'Rota concluída. ':'Rota encerrada antecipadamente. ')+done+' de '+total+' visitas registradas. Histórico atualizado; quilômetros reais não aferidos.';
const btn=$('saveCompletedRoute');if(btn)btn.remove();
renderMarkers();
}
$('confirmVisit').addEventListener('click',()=>{const stop=next();if(stop&&confirm('Confirmar que a visita a '+stop.name+' foi realizada?'))arrived(stop,'manual');});
function arrived(stop,source='gps'){
const arrivalTime=new Date().toISOString();
try{window.TraxeloVisits?.recordArrival(stop,source,arrivalTime,route?.id);}catch(e){status('Visita não registrada: '+e.message);return;}
clearTimeout(retryTimer);retryCount=0;rerouteController?.abort();rerouteController=null;rerouteBusy=false;if(route?.legs?.length)route.legs.shift();stop.visited=true;stop.arrivalSource=source;stop.arrivalTime=arrivalTime;window.traxioVisitedIds.add(String(stop.id));arrivedSince=0;render();
activeLeg=N.firstLeg(activeGeometry,route?.legs,next());if(!next())end('completed');else if(previousPosition)recalculate(previousPosition,true);
}
function routeDeviation(lat,lon){return N.deviation([lon,lat],activeLeg||activeGeometry);}
async function recalculate(coord,force=false){
 if(rerouteBusy||!route||!next()||!coord)return;
 if(!force&&lastRerouteAt&&Date.now()-lastRerouteAt<15000)return;
 const generation=navGeneration,controller=new AbortController();rerouteController=controller;
 rerouteBusy=true;lastRerouteAt=Date.now();status('Recalculando rota pelas ruas…');
 try{
  const remaining=stops().filter(x=>!x.visited),points=[{lon:coord[0],lat:coord[1]},...remaining];
  const road=await fetchRoadRoute(points,{signal:controller.signal});
  if(generation!==navGeneration||!route||controller.signal.aborted)return;
  route.legs=road.legs||[];activeGeometry=road.geometry;activeLeg=N.firstLeg(road.geometry,route.legs,next());displayRoadGeometry(road.geometry,{fit:false});
  $('routeResult').textContent='Rota atualizada · '+(road.distance/1000).toFixed(1)+' km · '+Math.round(road.duration/60)+' min restantes.';
  status('Nova rota calculada · '+(road.distance/1000).toFixed(1)+' km restantes');
  cameraFollow();
  clearTimeout(retryTimer);retryCount=0;offRouteSince=null;offRouteSamples=0;
 }catch(e){if(generation===navGeneration&&!controller.signal.aborted){console.warn('[Traxio GPS] Falha no recálculo:',e.message);status('Sem conexão para recalcular. Tentando novamente; você também pode tocar em Recalcular agora.');scheduleRetry();}}
 finally{if(generation===navGeneration&&rerouteController===controller){rerouteBusy=false;rerouteController=null;}}
}
function position(p){
if(!route)return;
const lat=p.coords.latitude,lon=p.coords.longitude,accuracy=p.coords.accuracy;
if(!valid(lat,lon)||!Number.isFinite(accuracy)||accuracy<0)return;
if(p.timestamp&&Date.now()-p.timestamp>20000){status('Sinal GPS antigo. Aguardando posição atual…');return;}
const coord=[lon,lat],fix={coord,at:p.timestamp||Date.now(),accuracy,heading:p.coords.heading,speed:p.coords.speed};
if(accuracy<=100){
 course=N.courseForFix(fix,courseAnchor,course,activeLeg||activeGeometry);
 if(!courseAnchor||fix.at-courseAnchor.at>20000||N.metres(courseAnchor.coord,coord)>=Math.max(8,Math.min(30,(accuracy+courseAnchor.accuracy)/2)))courseAnchor=fix;
 latestFix=fix;
}
bindCamera();
if(!car){
const el=document.createElement('div');el.className='traxio-car-marker';
el.innerHTML='<svg viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Carro visto de cima"><path d="M24 0L31 9H17Z" fill="#c5f744"/><rect x="10" y="9" width="28" height="43" rx="9" fill="#0876e9" stroke="white" stroke-width="3"/><rect x="5" y="17" width="6" height="12" rx="2" fill="#102b38"/><rect x="37" y="17" width="6" height="12" rx="2" fill="#102b38"/><rect x="5" y="38" width="6" height="11" rx="2" fill="#102b38"/><rect x="37" y="38" width="6" height="11" rx="2" fill="#102b38"/><path d="M15 20L18 14H30L33 20V27H15Z" fill="#d6f6ff"/><rect x="15" y="34" width="18" height="11" rx="3" fill="#143b57"/><path d="M14 49H19M29 49H34" stroke="#f9f0a0" stroke-width="3" stroke-linecap="round"/></svg>';
car=new maplibregl.Marker({element:el,anchor:'center'}).setLngLat(coord).addTo(map);
}else car.setLngLat(coord);
syncCarDirection();cameraFollow();previousPosition=coord;
if(!rerouteBusy)status(accuracy>100?'Sinal GPS impreciso · aguardando melhora (±'+Math.round(accuracy)+' m)':'GPS ativo · recálculo automático ligado · precisão ±'+Math.round(accuracy)+' m');
const target=next();if(!target)return;
const dist=km({lat,lon},target)*1000;
if(accuracy<=80&&dist<=100){if(!arrivedSince){arrivedSince=Date.now();status('Chegada detectada · verificando permanência')}else if(Date.now()-arrivedSince>=30000){arrived(target);return}}
else arrivedSince=0;
if(accuracy<=100){
 if(!activeGeometry?.coordinates?.length){recalculate(coord);return;}
 const deviation=routeDeviation(lat,lon),threshold=Math.max(35,accuracy*1.7);
 if(deviation>threshold){
  offRouteSamples++;if(offRouteSince===null)offRouteSince=Date.now();
  if(!rerouteBusy)status('Fora do trajeto · verificando desvio para recalcular…');
  if(offRouteSamples>=2&&Date.now()-offRouteSince>=3000)recalculate(coord);
 }else{offRouteSince=null;offRouteSamples=0;}
}else{offRouteSince=null;offRouteSamples=0;}

}

function scheduleRetry(){
 clearTimeout(retryTimer);if(!trackingRequested||retryCount>=3)return;
 const generation=navGeneration;retryCount++;retryTimer=setTimeout(()=>{
  if(generation!==navGeneration||!trackingRequested||!latestFix||Date.now()-latestFix.at>20000)return;
  recalculate(latestFix.coord,true);
 },Math.min(10000,3000*retryCount));
}
function pauseTracking(){
 arrivedSince=0;offRouteSince=null;offRouteSamples=0;courseAnchor=null;
 navGeneration++;$('navigationRecalculate').disabled=true;clearTimeout(retryTimer);clearTimeout(watchRetryTimer);rerouteController?.abort();rerouteController=null;rerouteBusy=false;
 if(watch!==null){navigator.geolocation.clearWatch(watch);watch=null;}
}
function watchError(error){
 if(!trackingRequested)return;status('Erro no GPS: '+error.message+(error.code===1?' Autorize a localização e toque em Iniciar navegação.':' Tentando obter um sinal atual…'));
 arrivedSince=0;offRouteSince=null;offRouteSamples=0;
 if(error.code===1){pauseTracking();trackingRequested=false;syncRecenter();$('liveStart').disabled=false;$('liveStart').hidden=false;$('navigationResume').hidden=false;return;}
 clearTimeout(watchRetryTimer);const generation=navGeneration;watchRetryTimer=setTimeout(()=>{if(generation===navGeneration&&trackingRequested&&!document.hidden){pauseTracking();startWatch(true);}},5000);
}
function startWatch(resuming=false){
 if(!route||watch!==null)return;
 if(!navigator.geolocation){status('GPS indisponível neste navegador');return;}
 trackingRequested=true;bindCamera();syncRecenter();const generation=navGeneration;
 const accept=positionValue=>{if(generation!==navGeneration||!trackingRequested)return;clearTimeout(watchRetryTimer);position(positionValue);};
 try{
  const id=navigator.geolocation.watchPosition(accept,watchError,{enableHighAccuracy:true,maximumAge:0,timeout:18000});
  if(!trackingRequested||generation!==navGeneration){navigator.geolocation.clearWatch(id);return;}
  watch=id;$('navigationResume').hidden=true;$('navigationRecalculate').disabled=false;$('liveStart').disabled=true;$('liveStart').hidden=true;$('liveStop').disabled=false;status(resuming?'Retomando navegação · aguardando GPS atual…':'Aguardando sinal GPS…');
  // A watch may stop delivering callbacks when an iPhone PWA goes to the background.
  // On return, explicitly reacquire a fresh fix and retrace the remaining stops.
  if(resuming)navigator.geolocation.getCurrentPosition(p=>{if(generation!==navGeneration||!trackingRequested)return;accept(p);if(latestFix&&Date.now()-latestFix.at<=20000)recalculate(latestFix.coord,true);},watchError,{enableHighAccuracy:true,maximumAge:0,timeout:18000});
 }catch(e){watchError({code:1,message:e.message});}
}
function startNavigation(){if(!route)return;activeGeometry=activeGeometry||routeGeo;activeLeg=N.firstLeg(activeGeometry,route.legs,next());enterNav();startWatch();}
$('liveStart').addEventListener('click',startNavigation);
const recalc=document.createElement('button');recalc.disabled=true;recalc.type='button';recalc.id='navigationRecalculate';recalc.className='secondary';recalc.textContent='Recalcular agora';recalc.onclick=()=>{
 if(!route||!next())return;
 navigator.geolocation.getCurrentPosition(p=>{if(!trackingRequested)return;position(p);if(latestFix&&Date.now()-latestFix.at<=20000)recalculate(latestFix.coord,true);},watchError,{enableHighAccuracy:true,maximumAge:0,timeout:18000});
};
const adjust=document.createElement('button');adjust.type='button';adjust.id='navigationAdjustPin';adjust.className='secondary';adjust.textContent='Ajustar pin da próxima parada';adjust.onclick=()=>{const stop=next();if(!stop)return;pauseTracking();trackingRequested=false;syncRecenter();exitNav();$('liveStart').disabled=false;$('liveStart').hidden=false;window.TraxeloMapActions?.showClient(stop.id);window.traxeloReviewClient?.(stop.id);};
const resume=document.createElement('button');resume.type='button';resume.id='navigationResume';resume.className='secondary';resume.textContent='Retomar GPS';resume.hidden=true;resume.onclick=startNavigation;$('liveStop').after(recalc,adjust,resume);
window.TraxeloNavigation={start:startNavigation,expand:enterNav,minimize:()=>$('traxioNavMinimize').click(),close:exitNav,finish:end,preparePinEdit:()=>{pauseTracking();trackingRequested=false;syncRecenter();exitNav();$('liveStart').disabled=false;$('liveStart').hidden=false;status('GPS pausado para ajustar o pin. Confirme a localização antes de retomar.');},isTracking:()=>trackingRequested,state:()=>({tracking:trackingRequested,following,course,watching:watch!==null,next:next()?.id,stops:stops().map(s=>({...s})),expanded:!$('traxioNavOverlay').hidden&&!$('traxioNavOverlay').classList.contains('traxio-mini')})};
document.addEventListener('visibilitychange',()=>{if(!trackingRequested||!route)return;if(document.hidden){pauseTracking();status('Navegação pausada em segundo plano. Será retomada ao voltar ao aplicativo.');}else startWatch(true);});
window.addEventListener('pageshow',()=>{if(trackingRequested&&route&&!document.hidden)startWatch(true);});
$('liveStop').addEventListener('click',()=>{if(confirm('Encerrar esta rota agora? As visitas restantes ficarão pendentes no histórico.'))end('partial')});
window.traxioBeginNavigation=function(points,geometry=routeGeo,options={}){
if(!Array.isArray(points)||!points.length)return;
stopGPS();
route={id:uid(),legs:options.legs||[],stops:points.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon)).map(x=>({id:x.id,name:x.name,lat:x.lat,lon:x.lon,visited:false}))};
window.traxioVisitedIds.clear();routeGeo=geometry;activeGeometry=geometry;activeLeg=N.firstLeg(geometry,route.legs,next());offRouteSince=null;offRouteSamples=0;$('liveNavigation').hidden=false;$('navigationRecalculate').disabled=true;$('liveStart').disabled=false;$('liveStart').hidden=false;$('liveStop').disabled=true;status('GPS desligado');render();
};
$('clearRoute').addEventListener('click',()=>{if(route){stopGPS();route=null;window.traxioVisitedIds.clear();$('liveNavigation').hidden=true;renderMarkers()}});
window.addEventListener('pagehide',()=>{if(trackingRequested)pauseTracking();});
new MutationObserver(()=>{if(document.body.classList.contains('auth-locked'))window.traxioResetNavigation();}).observe(document.body,{attributes:true,attributeFilter:['class']});
})();

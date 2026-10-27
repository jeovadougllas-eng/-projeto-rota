/* A focused customer pin always exposes the same visit and location actions. */
document.addEventListener('DOMContentLoaded',()=>{
'use strict';
const el=id=>document.getElementById(id),P=TraxioPlanner;let focusId=null;
const panel=document.createElement('section');panel.id='focusedClientActions';panel.hidden=true;panel.setAttribute('aria-label','Ações do cliente no mapa');
panel.innerHTML='<strong id="focusedClientName"></strong><p id="focusedClientStatus" role="status"></p><div class="row"><button type="button" id="focusedClientNavigate">Iniciar navegação</button><button type="button" id="focusedClientAdjust" class="secondary">Ajustar pin</button><button type="button" id="focusedClientDetails" class="secondary">Ver cadastro</button></div>';
el('map').after(panel);
const client=()=>clients.find(c=>String(c.id)===focusId);
function refresh(){const c=client();panel.hidden=!c;if(!c)return;el('focusedClientName').textContent=c.name;el('focusedClientStatus').textContent=P.location(c).ready?'Destino individual · localização confirmada.':'Confira e confirme a localização antes de iniciar a navegação.';el('focusedClientNavigate').textContent=P.location(c).ready?'Iniciar navegação':'Confirmar ponto para navegar';el('focusedClientNavigate').disabled=routeBusy;}
function showClient(id,{fly=true}={}){
 const c=clients.find(c=>String(c.id)===String(id));if(!c)return;
 focusId=String(c.id);refresh();switchTab('mapa');initMap();renderMarkers();
 if(!valid(c.lat,c.lon)){window.traxeloReviewClient?.(c.id);return;}
 if(window.TraxeloNavigation?.state().expanded||el('traxioNavOverlay').classList.contains('traxio-mini'))window.TraxeloNavigation.close();
 if(fly)map?.flyTo({center:[Number(c.lon),Number(c.lat)],zoom:16});
 setTimeout(()=>{if(focusId!==String(id)||adjustingPin)return;map?.resize();panel.scrollIntoView({block:'nearest'});},220);
}
el('focusedClientNavigate').onclick=async()=>{const c=client();if(!c)return;const started=await window.TraxioRouteUI.singleClient(c.id);refresh();if(!started&&P.location(c).ready)el('focusedClientStatus').textContent=el('routeResult').textContent;};
el('focusedClientAdjust').onclick=()=>{const c=client();if(c){window.TraxeloNavigation?.preparePinEdit();window.traxeloReviewClient?.(c.id);}};
el('focusedClientDetails').onclick=()=>{const c=client();if(c)viewClient(c.id);};
const saveAndGo=document.createElement('button');saveAndGo.type='button';saveAndGo.id='pinSaveAndNavigate';saveAndGo.className='secondary';saveAndGo.textContent='Salvar posição e navegar';
el('backToClient').after(saveAndGo);saveAndGo.onclick=async()=>{
 const previous=editingClientId;el('backToClient').click();if(adjustingPin)return;const id=editingClientId??previous;
 const c=clients.find(c=>String(c.id)===String(id));if(!c||!P.location(c).ready)return;focusId=String(id);refresh();await window.TraxioRouteUI.singleClient(id);
};
const baseRender=renderMarkers;renderMarkers=function(){
 baseRender();refresh();const c=client();if(!map||!c||adjustingPin||!valid(c.lat,c.lon))return;
 const b=document.createElement('button');b.type='button';b.className='traxelo-saved-pin traxelo-focused-pin';b.textContent='●';b.setAttribute('aria-label','Destino individual: '+c.name);b.onclick=()=>showClient(c.id,{fly:false});
 markers.push(new maplibregl.Marker({element:b}).setLngLat([Number(c.lon),Number(c.lat)]).addTo(map));
};
new MutationObserver(()=>{if(document.body.classList.contains('auth-locked')){focusId=null;refresh();}}).observe(document.body,{attributes:true,attributeFilter:['class']});
window.TraxeloMapActions={showClient,refresh};
});

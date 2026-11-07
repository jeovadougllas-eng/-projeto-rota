/* Read-only metric lists; sales reuse the existing calculator and original visit ID. */
(function(){
'use strict';
const $=id=>document.getElementById(id),M=RotaMapaVisitDetailsModel;
const titles={visits:'Visitas realizadas',unique:'PDVs distintos',revisits:'Revisitas',unvisited:'PDVs ativos não visitados'};
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const d=node('dialog',null,'detail-dialog commerce-dialog');d.id='visitDetailsDialog';d.setAttribute('aria-labelledby','visitDetailsTitle');
d.innerHTML='<div class="commerce-heading"><h2 id="visitDetailsTitle"></h2><button type="button" id="closeVisitDetails" class="secondary" aria-label="Fechar lista de clientes">×</button></div><p id="visitDetailsPeriod"></p><label id="visitDetailsRangeLabel">Período das visitas<select id="visitDetailsRange"><option value="today">Hoje</option><option value="five">Últimos 5 dias</option></select></label><p id="visitDetailsCount" role="status" aria-live="polite"></p><div id="visitDetailsSelection" hidden class="commerce-item"></div><div id="visitDetailsRows" class="commerce-list"></div><p id="visitDetailsError" role="alert"></p>';
document.body.append(d);let kind=null,owner=null,selectedKey=null,opener=null;
const date=s=>s?s.split('-').reverse().join('/'):'';
function guard(){const ledger=window.TraxeloVisits?.getStore();if(!ledger||!owner||ledger.owner!==owner||document.body.classList.contains('auth-locked'))throw Error('Entre na mesma conta para consultar este histórico.');const cacheOwner=localStorage.getItem('traxio_sync_owner_v29');if(cacheOwner&&cacheOwner!==owner)throw Error('A carteira deste aparelho pertence a outra conta.');return ledger;}
function action(text,fn,secondary=false){const b=node('button',text,secondary?'secondary':'');b.type='button';b.onclick=()=>{try{guard();fn();}catch(e){$('visitDetailsError').textContent=e.message;}};return b;}
function liveClient(id){return clients.find(c=>String(c.id)===String(id));}
function identity(row){const events=TraxeloVisits.getStore()?.events()||[],snapshot=(row.visitId?events.find(v=>v.id===row.visitId):events.find(v=>String(v.clientId)===String(row.clientId)))?.client,live=liveClient(row.clientId);return {...row,cnpj:row.visitId?RotaMapaClientIdentity.cnpj(snapshot)||RotaMapaClientIdentity.cnpj(live):RotaMapaClientIdentity.cnpj(live)||RotaMapaClientIdentity.cnpj(snapshot)};}
function salesForVisit(id){return window.RotaMapaSales?.getStore()?.events().find(s=>s.kind==='sale'&&s.visitId===id&&s.status!=='cancelled');}
function showSelection(row){
 const box=$('visitDetailsSelection');box.replaceChildren();box.hidden=false;box.append(node('h3',row.name));RotaMapaClientIdentity.append(box,identity(row));
 if(row.date)box.append(node('p',(kind==='visits'||kind==='revisits'?'Visita: ':'Última visita no mês: ')+date(row.date)));
 if(row.address)box.append(node('p',row.address));if(row.city)box.append(node('p',row.city));
 if(kind==='visits'){
  const sale=salesForVisit(row.visitId);box.append(node('p',sale?.status==='confirmed'?'Esta visita já possui uma venda registrada.':'O pedido será vinculado a esta visita. O número de visitas permanece o mesmo.'));
  box.append(action(sale?.status==='confirmed'?'Consultar venda':'Registrar venda',()=>{const v=guard().events().find(v=>v.id===row.visitId&&v.status==='confirmed');if(!v)throw Error('Esta visita foi alterada. Atualize a lista antes de lançar a venda.');d.close();window.RotaMapaSales.openVisitSale(row.visitId);}));
 }else if(kind==='unvisited'){
  const c=liveClient(row.clientId);if(!c){box.append(node('p','Este cliente não está mais na carteira ativa. Atualize o relatório.'));return;}
  const ready=window.TraxioPlanner?.location(c).ready;box.append(node('p',ready?'Localização confirmada. Você pode navegar até este cliente.':'É necessário conferir o pin antes de iniciar a navegação.'));
  box.append(action('Ver no mapa',()=>{d.close();window.TraxeloMapActions.showClient(c.id);},true));
  box.append(action(ready?'Iniciar navegação':'Confirmar localização para navegar',()=>{d.close();window.TraxeloMapActions.showClient(c.id);window.TraxioRouteUI.singleClient(c.id).catch(e=>{const status=$('focusedClientStatus');if(status)status.textContent='Não foi possível iniciar: '+e.message;});}));
 }else{
  if(kind==='unique')box.append(node('p',row.visits+' visita(s) confirmada(s) no mês'+(row.outsidePortfolio?' · cliente fora da carteira atual.':'.')));
  else box.append(node('p','Atendimento adicional após a primeira visita ao cliente neste mês.'));
 }
}
function render(){
 if(!d.open||!kind)return;
 try{guard();const model=TraxeloVisits.getModel(),list=M.rows(model,kind,{range:$('visitDetailsRange').value});$('visitDetailsTitle').textContent=titles[kind];$('visitDetailsPeriod').textContent='Mês do relatório: '+model.month.split('-').reverse().join('/')+' · '+model.timeZone;
 $('visitDetailsRangeLabel').hidden=kind!=='visits';$('visitDetailsCount').textContent=kind==='visits'?list.rows.length+' visita(s) no período · '+list.total+' no mês selecionado.':list.rows.length+' registro(s) · mês selecionado.';
 const root=$('visitDetailsRows');root.replaceChildren();for(const row of list.rows){const b=node('button',null,'secondary visit-details-row');b.type='button';b.dataset.rowKey=row.key;b.setAttribute('aria-pressed',String(row.key===selectedKey));b.append(node('strong',row.name));RotaMapaClientIdentity.append(b,identity(row));b.append(node('span',kind==='visits'||kind==='revisits'?date(row.date):kind==='unique'?row.visits+' visita(s) no mês':row.city||row.address||'Ainda sem visita no mês'));b.onclick=()=>{selectedKey=row.key;for(const item of root.children)item.setAttribute('aria-pressed',String(item.dataset.rowKey===selectedKey));showSelection(row);$('visitDetailsSelection').scrollIntoView({block:'nearest'});};root.append(b);}
 if(!list.rows.length)root.append(node('p',kind==='visits'?'Nenhuma visita confirmada neste período dentro do mês selecionado. Você pode escolher Últimos 5 dias ou conferir o mês do relatório.':'Nenhum cliente corresponde a este indicador no mês selecionado.'));
 const selected=list.rows.find(r=>r.key===selectedKey);if(selected)showSelection(selected);else{$('visitDetailsSelection').hidden=true;$('visitDetailsSelection').replaceChildren();selectedKey=null;}
 $('visitDetailsError').textContent='';
 }catch(e){$('visitDetailsRows').replaceChildren();$('visitDetailsSelection').hidden=true;$('visitDetailsError').textContent=e.message;}
}
function open(value,trigger=null){const ledger=window.TraxeloVisits?.getStore();owner=ledger?.owner||null;try{guard();if(!titles[value])return;kind=value;selectedKey=null;opener=trigger;$('visitDetailsRange').value='today';if(!d.open)d.showModal();render();}catch(e){const status=$('visitFeedback');if(status)status.textContent=e.message;}}
$('visitMetrics').addEventListener('click',e=>{const b=e.target.closest('[data-visit-list]');if(b)open(b.dataset.visitList,b);});
$('closeVisitDetails').onclick=()=>d.close();$('visitDetailsRange').onchange=()=>{selectedKey=null;render();};
d.addEventListener('close',()=>{if(opener?.isConnected)opener.focus();selectedKey=null;owner=null;kind=null;});
new MutationObserver(()=>{if(!d.open)return;if(document.body.classList.contains('auth-locked')||TraxeloVisits.getStore()?.owner!==owner)d.close();else render();}).observe(document.body,{attributes:true,attributeFilter:['class']});
new MutationObserver(()=>{if(d.open){if(TraxeloVisits.getStore()?.owner!==owner)d.close();else render();}}).observe($('visitMetrics'),{childList:true});
window.addEventListener('rotamapa:visit-report-rendered',()=>{if(d.open){if(TraxeloVisits.getStore()?.owner!==owner)d.close();else render();}});
window.RotaMapaVisitDetails={open,render};
})();

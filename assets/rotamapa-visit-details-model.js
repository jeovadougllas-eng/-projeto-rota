/* Drill-downs use exactly the same confirmed monthly report as the metric cards. */
(function(root){
'use strict';
const M=root.TraxeloVisitsModel;
function rows(model,kind,{range='today'}={}){
 if(!model?.summary||!Array.isArray(model.visits)||!Array.isArray(model.pdvs))throw Error('O relatório ainda não está disponível.');
 const today=M.day(model.asOf,model.timeZone),visits=[...model.visits];
 const visitRow=v=>({key:v.id,visitId:v.id,clientId:String(v.clientId),name:v.client?.name||v.clientId,date:v.visitDate,address:v.client?.address||'',city:v.client?.city||'',routeId:v.routeId||null});
 if(kind==='visits'){
  if(!['today','five'].includes(range))throw Error('Escolha Hoje ou Últimos 5 dias.');
  const first=range==='today'?today:M.add(today,-4);
  return {kind,total:model.summary.visits,first,last:today,rows:visits.filter(v=>v.visitDate>=first&&v.visitDate<=today).reverse().map(visitRow)};
 }
 if(kind==='revisits'){
  const seen=new Set(),extra=[];for(const v of visits){const id=String(v.clientId);if(seen.has(id))extra.push(visitRow(v));else seen.add(id);}
  return {kind,total:model.summary.revisits,rows:extra.reverse()};
 }
 if(!['unique','unvisited'].includes(kind))throw Error('Indicador inválido.');
 const selected=model.pdvs.filter(p=>kind==='unique'?p.visited:!p.visited&&!p.outsidePortfolio);
 return {kind,total:kind==='unique'?model.summary.uniquePdvs:model.summary.notVisited,rows:selected.map(p=>({key:String(p.id),clientId:String(p.id),name:p.name||p.id,address:p.address||'',city:p.city||'',date:p.lastVisit||'',visits:p.visits||0,outsidePortfolio:!!p.outsidePortfolio})).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR',{numeric:true}))};
}
root.RotaMapaVisitDetailsModel={rows};
})(globalThis);

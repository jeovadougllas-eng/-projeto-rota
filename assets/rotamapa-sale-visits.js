/* Monthly sale-backed registrations are derived from the durable sales ledger, never written as GPS/physical visits. */
(function(root){
'use strict';
function eligible(s){if(s?.kind!=='sale'||s.status!=='confirmed'||s.automaticVisitVersion!==1||!s.clientId||!root.TraxeloVisitsModel.validDay(s.date)||!s.lines?.length||s.simulation||s.isSimulation||s.preOrder||s.bussola?.status==='Cancelado')return false;try{const rows=root.RotaMapaBillingModel?.receipts(s);return !rows||rows.some(r=>r.state!=='cancelled');}catch{return false;}}
function compose(visits,sales,clients,{owner='',portfolio='',asOf=new Date().toISOString(),timeZone='America/Fortaleza'}={}){
 const M=root.TraxeloVisitsModel,today=M.day(asOf,timeZone),manual=M.dedupe(visits).filter(v=>v.status==='confirmed'&&!M.isRemote(v)&&v.visitDate<=today),covered=new Set(manual.map(v=>String(v.clientId)+':'+v.visitDate.slice(0,7))),groups=new Map();
 for(const sale of sales||[]){if(!eligible(sale)||sale.date>today)continue;const key=String(sale.clientId)+':'+sale.date.slice(0,7);if(covered.has(key))continue;const list=groups.get(key)||[];if(!list.some(s=>s.id===sale.id))list.push(sale);groups.set(key,list);}
 const automatic=[];for(const [key,group]of groups){group.sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));const sale=group[0],live=clients.find(c=>String(c.id)===String(sale.clientId)),client={id:String(sale.clientId),name:live?.name||sale.clientName||String(sale.clientId)};for(const k of ['address','city','neighborhood','state','cep'])if(live?.[k])client[k]=live[k];const cnpj=root.RotaMapaClientIdentity?.cnpj(live)||sale.bussola?.cnpj||sale.source?.order?.cnpj||sale.source?.receipts?.[0]?.cnpj;if(cnpj)client.cnpj=cnpj;
 automatic.push({id:'sale-visit:'+owner+':'+portfolio+':'+key,clientId:String(sale.clientId),client,visitDate:sale.date,status:'confirmed',source:'sale_automatic',attendanceType:'sale',automaticSaleVisit:true,sourceSaleIds:group.map(s=>s.id),recordedAt:sale.automaticVisitRegisteredAt||sale.registeredAt||sale.recordedAt||null,occurredAt:null,confirmedAt:null,durationMin:null,routeId:'',outcome:'Registrada automaticamente por venda',notes:'Registro mensal vinculado à venda; não comprova presença física. Não duplica visita presencial confirmada no mesmo mês.',version:1});}
 return[...visits,...automatic];
}
root.RotaMapaSaleVisits={eligible,compose};
})(globalThis);

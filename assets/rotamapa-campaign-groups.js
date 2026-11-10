/* Read-only grouping of existing conditions. Never changes historical commerce records. */
(function(root){
 'use strict';
 const families=Object.freeze([
  {id:'acelera',name:'Acelera SellOut',period:'Campanha mensal'},
  {id:'dia_d',name:'Dia D',period:'Ofertas do dia'},
  {id:'arrastao_azul',name:'Arrastão Azul',period:'Campanha mensal'}
 ]);
 const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function detect(value){const s=norm(value);if(/arrast[aã]o\s*azul/.test(s))return'arrastao_azul';if(/acelera|sell\s*out/.test(s))return'acelera';if(/\bdia[\s_-]*d\b/.test(s))return'dia_d';return'other';}
 function family(value,documents=[]){
  const data=value?.data||value||{};
  if([...families.map(x=>x.id),'other'].includes(data.campaignFamily))return data.campaignFamily;
  if(['acelera','dia_d'].includes(data.type))return data.type;
  const original=documents.find(r=>(r.value||r).id===data.imported?.documentId);
  if(original)return family((original.value||original).data);
  return detect([data.name,data.fileName,data.campaignName].filter(Boolean).join(' '));
 }
 function bounds(condition){return{start:condition.validFrom||condition.startDate||'',end:condition.validTo||condition.endDate||''};}
 function visible(condition,{date,all=false}={}){const b=bounds(condition);return all||!!date&&b.start<=date&&date<=b.end;}
 function validatePeriod(id,entries){
  for(const entry of entries){const b=bounds(entry);if(!root.RotaMapaCommerceModel.day(b.start)||!root.RotaMapaCommerceModel.day(b.end)||b.end<b.start)throw Error('Confira a vigência das condições.');
   if(id==='dia_d'&&b.start!==b.end)throw Error('Dia D deve ter início e fim no mesmo dia. Confira as datas da lâmina.');
   if(id==='acelera'||id==='arrastao_azul'){const [y,m]=b.start.slice(0,7).split('-').map(Number),end=new Date(Date.UTC(y,m,0,12)).toISOString().slice(0,10);if(!b.start.endsWith('-01')||b.end!==end)throw Error((id==='acelera'?'Acelera SellOut':'Arrastão Azul')+' deve cobrir o mês completo. Confira o mês e as datas da lâmina.');}
  }return entries;
 }
 function conditions(campaigns,documents,products,options){
  const docs=documents.map(r=>r.value||r).filter(r=>r.kind==='campaigns'),known=new Set(docs.map(r=>r.id)),rows=[];
  for(const c of campaigns){if(c.type==='importada'&&known.has(c.imported?.documentId))continue;if(!visible(c,options))continue;
   rows.push({family:family(c,docs),kind:'legacy',id:c.id,productId:c.productId,name:products.find(p=>p.id===c.productId)?.name||'Produto do histórico',...bounds(c),tiers:c.type==='importada'?c.imported.entries:c.tiers,campaign:c});}
  for(const document of docs){const entries=document.data.entries||[],byProduct=new Map();
   for(const entry of entries){if(!visible(entry,options))continue;const p=entry.productId?products.find(p=>p.id===entry.productId):root.RotaMapaCommissions?.match(entry,products).product;
    const key=JSON.stringify([p?.id||entry.name,entry.presentation,entry.validFrom,entry.validTo]);if(!byProduct.has(key))byProduct.set(key,{family:family(document.data),kind:'document',id:document.id,productId:p?.id,name:p?.name||[entry.name,entry.presentation].filter(Boolean).join(' · ')||entry.code||'Revisar produto',...bounds(entry),tiers:[],document});byProduct.get(key).tiers.push(entry);
   }rows.push(...byProduct.values());
  }
  return rows.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR',{numeric:true})||b.start.localeCompare(a.start));
 }
 root.RotaMapaCampaignGroups=Object.freeze({families,norm,detect,family,bounds,visible,validatePeriod,conditions});
})(globalThis);

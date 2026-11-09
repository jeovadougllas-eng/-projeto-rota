/* Historical sales score and road-budget selection. No probability or future revenue is invented. */
(function(root){
'use strict';
const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,''),B=()=>root.RotaMapaBillingModel;
// Prefeitura/SEMURB, PPA 2026–2029, map 1 (p.27); Anuário Natal regional tables.
const regionSource='https://www2.natal.rn.gov.br/_anexos/guiaservicos/anexo_num_50.pdf';
const natal={Norte:['Lagoa Azul','Nossa Senhora da Apresentação','Pajuçara','Potengi','Redinha','Igapó','Salinas'],Leste:['Santos Reis','Rocas','Praia do Meio','Ribeira','Cidade Alta','Petrópolis','Areia Preta','Mãe Luiza','Barro Vermelho','Alecrim','Tirol','Lagoa Seca'],Oeste:['Nordeste','Quintas','Bom Pastor','Dix-Sept Rosado','Nossa Senhora de Nazaré','Cidade da Esperança','Cidade Nova','Felipe Camarão','Guarapes','Planalto'],Sul:['Lagoa Nova','Nova Descoberta','Candelária','Capim Macio','Pitimbu','Neópolis','Ponta Negra']};
const zones=new Map(Object.entries(natal).flatMap(([zone,names])=>names.map(name=>[normalize(name),zone])));for(const [alias,name]of [['N. Sra. da Apresentação','Nossa Senhora da Apresentação'],['N. Sra. de Nazaré','Nossa Senhora de Nazaré'],['Nazaré','Nossa Senhora de Nazaré'],['Cidade Esperança','Cidade da Esperança']])zones.set(normalize(alias),zones.get(normalize(name)));
function parts(c){const field=(...keys)=>{const f=(c.importFields||[]).find(f=>keys.includes(normalize(f.label))&&String(f.value||'').trim());return f?String(f.value).trim():'';};return {city:c.city||field('cidade','municipio'),district:c.neighborhood||field('bairro','distrito'),state:c.state||field('uf','estado')};}
function region(c){if(c.salesRegion?.trim())return c.salesRegion.trim();const p=parts(c);if(!['natal','natalrn'].includes(normalize(p.city))||p.state&&!['rn','riograndedonorte'].includes(normalize(p.state)))return '';return zones.get(normalize(p.district).replace(/^bairro/,''))||'';}
function months(month){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Mês inválido.');const [year,m]=month.split('-').map(Number),value=n=>new Date(Date.UTC(year,m-1+n,1,12)).toISOString().slice(0,7);return {start:month+'-01',end:value(1)+'-01',previous:[value(-3),value(-2),value(-1)],historyStart:value(-3)+'-01'};}
function key(c){return root.RotaMapaClientIdentity.cnpj(c)||'id:'+String(c.id);}
function analyze(clients,sales,month,options={}){const dates=months(month),byId=new Map(clients.map(c=>[String(c.id),c])),groups=new Map(),bought=new Set(),history=new Map(),active=new Map();
 for(const c of clients.filter(c=>c.active!==false&&!c.deleted_at).sort((a,b)=>Number(root.TraxioPlanner.location(b).ready)-Number(root.TraxioPlanner.location(a).ready)||String(a.id).localeCompare(String(b.id))))if(!active.has(key(c)))active.set(key(c),c);
 for(const s of sales){if(s.kind!=='sale'||s.status!=='confirmed')continue;const c=byId.get(String(s.clientId)),cnpj=s.source?.receipts?.[0]?.cnpj||c&&root.RotaMapaClientIdentity.cnpj(c),id=cnpj||'id:'+String(s.clientId),a=B().amounts(s);if(B().hasOrderInMonth(s,month))bought.add(id);
  if(s.date>=dates.start&&s.date<dates.end&&a.confirmedCents>0){
   const representative=active.get(id)||c,place=parts(representative||{});
   const g=groups.get(id)||{key:id,clientId:String(representative?.id||s.clientId),name:representative?.name||s.clientName||'Cliente arquivado',cnpj:cnpj||'',city:place.city||'',state:place.state||'',inCurrentPortfolio:active.has(id),totalCents:0,orders:0,clientIds:new Set(),purchases:[]};
   g.totalCents+=a.confirmedCents;g.orders++;g.clientIds.add(String(s.clientId));
   g.purchases.push({id:String(s.id),clientId:String(s.clientId),date:s.date,totalCents:a.confirmedCents});groups.set(id,g);
  }
  if(s.date>=dates.historyStart&&s.date<dates.start&&a.confirmedCents>0){const h=history.get(id)||{totalCents:0,orders:0,months:new Set(),lastDate:''};h.totalCents+=a.confirmedCents;h.orders++;h.months.add(s.date.slice(0,7));if(s.date>h.lastDate)h.lastDate=s.date;history.set(id,h);}
 }
 const max=Math.max(1,...[...active.keys()].map(id=>history.get(id)?.totalCents||0)),candidates=[],excluded={alreadyOrdered:0,noHistory:0,location:0};
 for(const [id,c]of active){const h=history.get(id);if(bought.has(id)){excluded.alreadyOrdered++;continue;}if(!h){excluded.noHistory++;continue;}if(!root.TraxioPlanner.location(c).ready){excluded.location++;continue;}const days=Math.max(0,(Date.parse(dates.start+'T12:00:00Z')-Date.parse(h.lastDate+'T12:00:00Z'))/86400000),score=100*(.6*h.totalCents/max+.25*h.months.size/3+.15*Math.max(0,1-days/92));candidates.push({clientId:String(c.id),name:c.name,cnpj:root.RotaMapaClientIdentity.cnpj(c),score:Math.round(score*100)/100,historyTotalCents:h.totalCents,buyingMonths:h.months.size,lastPurchase:h.lastDate,historyOrders:h.orders,city:parts(c).city,district:parts(c).district,region:region(c)});}
 candidates.sort((a,b)=>b.score-a.score||b.historyTotalCents-a.historyTotalCents||a.clientId.localeCompare(b.clientId));
 const cityKey=value=>value==='__unknown__'?'__unknown__':normalize(value)||'__unknown__',city=options.city?cityKey(options.city):'',cities=new Map();
 for(const place of [...clients.map(parts),...groups.values()])if(place.city)cities.set(cityKey(place.city),String(place.city).trim());
 if([...groups.values()].some(g=>!g.city))cities.set('__unknown__','Sem cidade informada');
 const ordered=[...groups.values()].filter(g=>!city||cityKey(g.city)===city).sort((a,b)=>b.totalCents-a.totalCents||b.orders-a.orders||a.key.localeCompare(b.key));
 const totalCents=ordered.reduce((n,g)=>n+g.totalCents,0),totalOrders=ordered.reduce((n,g)=>n+g.orders,0);
 const ranking=ordered.slice(0,10).map(g=>({...g,clientIds:[...g.clientIds].sort(),averageOrderCents:Math.round(g.totalCents/g.orders),sharePercent:totalCents?100*g.totalCents/totalCents:0,purchases:g.purchases.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id)).slice(0,10)}));
 const top10TotalCents=ranking.reduce((n,g)=>n+g.totalCents,0),top10Orders=ranking.reduce((n,g)=>n+g.orders,0);
 return {month,previousMonths:dates.previous,ranking,candidates,excluded,activeClients:active.size,cities:[...cities].map(([value,label])=>({value,label})).sort((a,b)=>a.label.localeCompare(b.label,'pt-BR')),filterCity:city,summary:{totalCents,totalOrders,buyingClients:ordered.length,top10TotalCents,top10Orders,top10Buyers:ranking.length,remainingTotalCents:totalCents-top10TotalCents,sharePercent:totalCents?100*top10TotalCents/totalCents:0},weights:{volume:60,regularity:25,recency:15}};
}
// Rankings use receipt-level invoicing, including the quantities actually settled.
// Unverified manual declarations never become invoiced merely by saving a sale.
function confirmedManual(s,owner){
 const b=s.manualBilling;
 if(!owner||s.source||b?.version!==1||b.state!=='invoiced'||b.method!=='owner_confirmation'||b.confirmedBy!==owner||!Number.isFinite(Date.parse(b.confirmedAt))||!Number.isSafeInteger(b.totalCents)||b.totalCents<1||b.totalCents!==s.totalCents)return false;
 return Array.isArray(s.lines)&&s.lines.length>0&&s.lines.every(l=>Number.isSafeInteger(l.quantity)&&l.quantity>0&&Number.isSafeInteger(l.unitCents)&&l.unitCents>=0)&&s.lines.reduce((n,l)=>n+l.quantity*l.unitCents,0)===b.totalCents;
}
function rankings(clients,sales,catalog,month,options={}){
 const dates=months(month),cityKey=v=>v==='__unknown__'?'__unknown__':normalize(v)||'__unknown__',city=options.city?cityKey(options.city):'';
 const active=new Map(),byId=new Map(clients.map(c=>[String(c.id),c])),buyers=new Map(),products=new Map(),cities=new Map();
 const alpha=(a,b)=>a.name.localeCompare(b.name,'pt-BR',{sensitivity:'base',numeric:true})||a.key.localeCompare(b.key);
 for(const c of [...clients].sort((a,b)=>Number(b.active!==false&&!b.deleted_at)-Number(a.active!==false&&!a.deleted_at)||Number(root.TraxioPlanner.location(b).ready)-Number(root.TraxioPlanner.location(a).ready)||String(a.id).localeCompare(String(b.id)))){
  const id=key(c),p=parts(c);if(p.city)cities.set(cityKey(p.city),p.city.trim());
  if(c.active!==false&&!c.deleted_at&&!active.has(id))active.set(id,c);
 }
 const buyer=(id,c,source={})=>{const representative=active.get(id)||c,place=parts(representative||{});return {key:id,clientId:String(representative?.id||source.clientId||''),name:representative?.name||source.clientName||'Cliente arquivado',cnpj:root.RotaMapaClientIdentity.cnpj(representative)||source.source?.receipts?.[0]?.cnpj||'',city:place.city||'',state:place.state||'',inCurrentPortfolio:active.has(id),totalCents:0,orders:0,clientIds:new Set(),purchases:[]};};
 for(const [id,c]of active){const g=buyer(id,c);g.clientIds.add(String(c.id));buyers.set(id,g);}
 for(const p of catalog.filter(p=>p.kind==='product'&&!p.disabled)){products.set(String(p.id),{key:String(p.id),productId:String(p.id),name:p.name,code:p.code||'',inCurrentCatalog:true,units:0,totalCents:0,sales:new Set(),buyers:new Set()});}
 let totalCents=0,totalOrders=0,totalUnits=0;
 for(const s of sales){
  if(s.kind!=='sale'||s.status!=='confirmed'||s.date<dates.start||s.date>=dates.end)continue;
  const manual=confirmedManual(s,options.ownerId),billed=manual?[{state:'invoiced',amountCents:s.totalCents}]:B().receipts(s).filter(r=>r.state==='invoiced');if(!billed.length)continue;
  const c=byId.get(String(s.clientId)),cnpj=root.RotaMapaClientIdentity.cnpj({cnpj:s.source?.receipts?.[0]?.cnpj})||c&&root.RotaMapaClientIdentity.cnpj(c),id=cnpj||'id:'+String(s.clientId),g=buyers.get(id)||buyer(id,c,s);
  if(city&&cityKey(g.city)!==city)continue;
  const value=billed.reduce((n,r)=>n+r.amountCents,0);if(value<=0)continue;
  g.totalCents+=value;g.orders++;g.clientIds.add(String(s.clientId));g.purchases.push({id:String(s.id),clientId:String(s.clientId),date:s.date,totalCents:value});buyers.set(id,g);totalCents+=value;totalOrders++;
  for(const l of s.lines||[]){
   const r=manual?billed[0]:billed.find(r=>r.index===l.sourceReceipt);if(!r)continue;
   const settled=r.settlement?.items?.[l.sourceItem],quantity=settled?.quantity??l.quantity,unitCents=settled?.unitCents??l.unitCents;
   if(!Number.isSafeInteger(quantity)||quantity<=0||!Number.isSafeInteger(unitCents)||unitCents<0)continue;
   const id=String(l.productId||'name:'+normalize(l.name)),p=products.get(id)||{key:id,productId:String(l.productId||''),name:l.name||'Produto arquivado',code:l.code||'',inCurrentCatalog:false,units:0,totalCents:0,sales:new Set(),buyers:new Set()};
   p.units+=quantity;p.totalCents+=quantity*unitCents;p.sales.add(String(s.id));p.buyers.add(g.key);products.set(id,p);totalUnits+=quantity;
  }
 }
 for(const c of clients){const g=buyers.get(key(c));if(g)g.clientIds.add(String(c.id));}
 const allClients=[...buyers.values()].filter(g=>!city||cityKey(g.city)===city).sort((a,b)=>b.totalCents-a.totalCents||b.orders-a.orders||alpha(a,b)).map(g=>({...g,clientIds:[...g.clientIds].sort(),averageOrderCents:g.orders?Math.round(g.totalCents/g.orders):0,sharePercent:totalCents?100*g.totalCents/totalCents:0,purchases:g.purchases.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id)).slice(0,10)}));
 if(allClients.some(g=>!g.city))cities.set('__unknown__','Sem cidade informada');
 const allProducts=[...products.values()].sort((a,b)=>b.units-a.units||b.totalCents-a.totalCents||alpha(a,b)).map(p=>{const {sales,buyers,...v}=p;return {...v,orders:sales.size,buyers:buyers.size,averageUnitCents:p.units?Math.round(p.totalCents/p.units):0,sharePercent:totalUnits?100*p.units/totalUnits:0};});
 const ranking=allClients.filter(g=>g.totalCents>0).slice(0,5),productRanking=allProducts.filter(p=>p.units>0).slice(0,5),top5TotalCents=ranking.reduce((n,g)=>n+g.totalCents,0),top5Units=productRanking.reduce((n,p)=>n+p.units,0);
 return {month,ranking,allClients,productRanking,allProducts,cities:[...cities].map(([value,label])=>({value,label})).sort((a,b)=>a.label.localeCompare(b.label,'pt-BR')),filterCity:city,summary:{totalCents,totalOrders,buyingClients:allClients.filter(c=>c.totalCents>0).length,top5TotalCents,top5Orders:ranking.reduce((n,g)=>n+g.orders,0),top5Buyers:ranking.length,remainingTotalCents:totalCents-top5TotalCents,sharePercent:totalCents?100*top5TotalCents/totalCents:0},productSummary:{totalUnits,top5Units,top5TotalCents:productRanking.reduce((n,p)=>n+p.totalCents,0),sellingProducts:allProducts.filter(p=>p.units>0).length,remainingUnits:totalUnits-top5Units,sharePercent:totalUnits?100*top5Units/totalUnits:0}};
}

function limits(input={}){const value=(name,fallback,min,max)=>{const n=Number(input[name]??fallback);if(!Number.isFinite(n)||n<min||n>max)throw Error('Confira os limites de deslocamento.');return n;};const count=value('maxStops',10,1,50);if(!Number.isInteger(count))throw Error('Informe um número inteiro de visitas.');return {firstKm:value('firstKm',10,.1,1000),legKm:value('legKm',5,.1,500),totalKm:value('totalKm',30,.1,2000),maxStops:count};}
function select(nodes,matrix,input={}){const cap=limits(input);if(matrix.length!==nodes.length||matrix.some(row=>row.length!==nodes.length))throw Error('Matriz rodoviária incompleta.');const remaining=new Set(nodes.slice(1).map((_,i)=>i+1)),sequence=[0];let current=0,distance=0;while(remaining.size&&sequence.length-1<cap.maxStops){const allowed=[...remaining].filter(i=>Number.isFinite(matrix[current][i])&&matrix[current][i]>=0&&matrix[current][i]<=(sequence.length===1?cap.firstKm:cap.legKm)*1000&&distance+matrix[current][i]<=cap.totalKm*1000);if(!allowed.length)break;allowed.sort((a,b)=>{const score=i=>(Number(nodes[i].buyerScore)||0)/(1+matrix[current][i]/Math.max(1000,cap.legKm*1000));return score(b)-score(a)||(Number(nodes[b].buyerScore)||0)-(Number(nodes[a].buyerScore)||0)||matrix[current][a]-matrix[current][b]||String(nodes[a].id).localeCompare(String(nodes[b].id));});const next=allowed[0];distance+=matrix[current][next];current=next;sequence.push(next);remaining.delete(next);}if(sequence.length===1)throw Error('Nenhum comprador cabe nos limites rodoviários definidos. Revise região, origem ou distâncias.');return {sequence,distanceMeters:distance,excluded:[...remaining].map(i=>String(nodes[i].id)),limits:cap};}
function verifyRoad(road,stops,input){const cap=limits(input);if(!Number.isFinite(road.distance)||road.distance>cap.totalKm*1000)throw Error('O trajeto final ultrapassa a quilometragem total definida. Ajuste a seleção ou os limites.');if(!Array.isArray(road.legs)||road.legs.length!==stops)throw Error('O provedor não informou as distâncias de cada trecho. Não foi possível conferir os limites.');for(const [i,leg]of road.legs.entries())if(!Number.isFinite(leg.distance)||leg.distance>(i===0?cap.firstKm:cap.legKm)*1000)throw Error('O trajeto final ultrapassa o limite '+(i===0?'até o primeiro cliente':'entre paradas')+'. Ajuste a seleção ou os limites.');return true;}
root.RotaMapaBuyerModel={confirmedManual,normalize,parts,region,regionSource,natal,months,key,analyze,rankings,limits,select,verifyRoad};
})(globalThis);

/* Pure visit analytics. Confirmed visits only; no sales inference or planned-route conversion. */
(function(root){
'use strict';
const dayRE=/^\d{4}-\d{2}-\d{2}$/;
function validDay(s){if(!dayRE.test(String(s)))return false;const d=new Date(s+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;}
function day(date=new Date(),zone='America/Sao_Paulo'){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(date)).map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;}
const add=(s,n)=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const weekday=s=>new Date(s+'T12:00:00Z').getUTCDay();
const monday=s=>add(s,-((weekday(s)+6)%7));
const key=c=>String(c.id??c.clientId??'');
function dates(month){if(!/^\d{4}-\d{2}$/.test(month)||!validDay(month+'-01'))throw Error('Mês inválido.');const out=[];for(let d=month+'-01';d.startsWith(month);d=add(d,1))out.push(d);return out;}
function dedupe(events){const map=new Map();for(const e of events||[]){if(!e||typeof e.id!=='string'||!e.clientId||!validDay(e.visitDate))continue;const old=map.get(e.id);if(!old||(e.version||1)>(old.version||1)||((e.version||1)===(old.version||1)&&String(e.updatedAt||'')>String(old.updatedAt||'')))map.set(e.id,e);}return [...map.values()];}
function report(events,portfolio,{month=day().slice(0,7),asOf=new Date().toISOString(),timeZone='America/Sao_Paulo',workingDays=[1,2,3,4,5],holidays=[],monthlyTarget=null,representative=''}={}){
 const calendar=dates(month),today=day(asOf,timeZone),last=calendar.at(-1),first=calendar[0];
 const cutoff=today<=first?add(first,-1):today>last?last:add(today,-1); // Completed days only, includes zero-visit working days.
 const holidaysSet=new Set(holidays.filter(validDay)),workingSet=new Set(workingDays.map(Number));
 const isWorking=d=>workingSet.has(weekday(d))&&!holidaysSet.has(d);
 const clients=new Map((portfolio||[]).filter(c=>c&&c.active!==false&&!c.deleted_at).map(c=>[key(c),c]));
 const confirmed=dedupe(events).filter(e=>e.status==='confirmed'&&e.visitDate.startsWith(month)&&e.visitDate<=today).sort((a,b)=>a.visitDate.localeCompare(b.visitDate)||String(a.occurredAt||a.recordedAt||'').localeCompare(String(b.occurredAt||b.recordedAt||''))||a.id.localeCompare(b.id));
 const pending=dedupe(events).filter(e=>e.status==='pending'&&e.visitDate.startsWith(month)).length;
 const visited=new Set(),activeVisited=new Set(),daily=[],weeks=new Map();let cumulative=0,observedVisits=0;const forecastVisited=new Set(),observedActive=new Set();
 for(const d of calendar){
  const rows=confirmed.filter(e=>e.visitDate===d),unique=new Set(rows.map(e=>String(e.clientId))),newIds=[...unique].filter(id=>!visited.has(id));
  for(const id of unique){visited.add(id);if(clients.has(id))activeVisited.add(id);}cumulative+=rows.length;
  if(d<=cutoff){observedVisits+=rows.length;for(const id of unique){forecastVisited.add(id);if(clients.has(id))observedActive.add(id);}}
  const w=monday(d);if(!weeks.has(w))weeks.set(w,{start:w,end:add(w,6),visits:0,ids:new Set(),days:new Set()});const week=weeks.get(w);week.visits+=rows.length;unique.forEach(id=>week.ids.add(id));if(rows.length)week.days.add(d);
  daily.push({date:d,working:isWorking(d),future:d>today,visits:d>today?null:rows.length,uniquePdvs:d>today?null:unique.size,newPdvs:d>today?null:newIds.length,cumulativeVisits:d>today?null:cumulative,cumulativePdvs:d>today?null:visited.size,cumulativeActivePdvs:d>today?null:activeVisited.size,coverage:d>today||!clients.size?null:activeVisited.size/clients.size});
 }
 const elapsed=calendar.filter(d=>d<=cutoff&&isWorking(d)).length,remaining=calendar.filter(d=>d>cutoff&&isWorking(d)).length;
 const rate=elapsed?observedVisits/elapsed:null,pdvRate=elapsed?observedActive.size/elapsed:null;
 let predictedVisits=observedVisits,predictedPdvs=observedActive.size;
 for(const row of daily){if(row.date<=cutoff){row.projectedVisits=row.cumulativeVisits;row.projectedPdvs=row.coverage===null?null:Math.round(row.coverage*clients.size);}else if(rate!==null){if(row.working){predictedVisits+=rate;predictedPdvs=Math.min(clients.size,predictedPdvs+pdvRate);}row.projectedVisits=Math.round(predictedVisits);row.projectedPdvs=Math.round(predictedPdvs);}else{row.projectedVisits=null;row.projectedPdvs=null;}}
 const uniqueAll=new Set(confirmed.map(e=>String(e.clientId))),activeAll=new Set([...uniqueAll].filter(id=>clients.has(id)));
 const target=Number(monthlyTarget)>0?Number(monthlyTarget):null;
 const pdvs=[...clients].map(([id,c])=>{const visits=confirmed.filter(e=>String(e.clientId)===id);return {id,name:c.name||'',city:c.city||'',neighborhood:c.neighborhood||'',address:c.address||'',visits:visits.length,lastVisit:visits.at(-1)?.visitDate||'',visited:!!visits.length};});
 for(const id of [...uniqueAll].filter(id=>!clients.has(id))){const rows=confirmed.filter(e=>String(e.clientId)===id),c=rows.at(-1).client||{};pdvs.push({id,name:c.name||'',city:c.city||'',neighborhood:c.neighborhood||'',address:c.address||'',visits:rows.length,lastVisit:rows.at(-1).visitDate,visited:true,outsidePortfolio:true});}
 return {schema:1,month,asOf,timeZone,representative,cutoff,workingDays:[...workingSet],holidays:[...holidaysSet],monthlyTarget:target,portfolioReference:'Carteira ativa atual na data da emissão; não é uma reconstrução histórica da carteira.',summary:{visits:confirmed.length,uniquePdvs:uniqueAll.size,revisits:confirmed.length-uniqueAll.size,portfolioSize:clients.size,activePdvsVisited:activeAll.size,notVisited:clients.size-activeAll.size,coverage:clients.size?activeAll.size/clients.size:null,daysWithVisits:new Set(confirmed.map(e=>e.visitDate)).size,elapsedWorkingDays:elapsed,remainingWorkingDays:remaining,dailyAverage:rate,projectedVisits:rate===null?null:Math.max(confirmed.length,Math.round(observedVisits+rate*remaining)),projectedPdvs:pdvRate===null?null:Math.max(activeAll.size,Math.min(clients.size,Math.round(observedActive.size+pdvRate*remaining))),observedUntilYesterday:observedVisits,pendingVisits:pending,neededPerDay:target&&remaining?Math.max(0,(target-observedVisits)/remaining):null},visits:confirmed,daily,weekly:[...weeks.values()].map(w=>({start:w.start,end:w.end,visits:w.visits,uniquePdvs:w.ids.size,daysWithVisits:w.days.size})),pdvs};
}
root.TraxeloVisitsModel={day,add,validDay,dates,monday,dedupe,report};
})(globalThis);

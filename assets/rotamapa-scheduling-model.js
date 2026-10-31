/* Appointment dates use the saved time zone, independently of the device clock zone. */
(function(root){
'use strict';
const V=root.TraxeloVisitsModel,P=root.TraxeloPremiumModel,DEFAULT_ZONE='America/Fortaleza';
const validTime=t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t||'');
function zone(z=DEFAULT_ZONE){new Intl.DateTimeFormat('en',{timeZone:z}).format();return z;}
function parts(at,z){return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone(z),year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(at)).map(p=>[p.type,p.value]));}
function instant(date,time,z=DEFAULT_ZONE){
 if(!V.validDay(date)||!validTime(time))throw Error('Informe uma data e um horário válidos.');
 const target=Date.parse(date+'T'+time+':00Z');let value=target;
 for(let i=0;i<4;i++){const p=parts(value,z),shown=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`),delta=target-shown;value+=delta;if(!delta)break;}
 const p=parts(value,z);if(`${p.year}-${p.month}-${p.day}`!==date||`${p.hour}:${p.minute}`!==time)throw Error('Este horário não existe no fuso selecionado. Escolha outro horário.');
 return value;
}
function normalize(data){
 const d={...data,timeZone:zone(data.timeZone||DEFAULT_ZONE),time:data.time||'09:00',durationMinutes:Number(data.durationMinutes??20),reminders:data.reminders??[4320,1440,60]};
 instant(d.startDate,d.time,d.timeZone);
 if(!Number.isInteger(d.durationMinutes)||d.durationMinutes<1||d.durationMinutes>720)throw Error('A duração deve ficar entre 1 e 720 minutos.');
 if(!Array.isArray(d.reminders)||d.reminders.length>10||d.reminders.some(n=>!Number.isInteger(n)||n<0||n>43200))throw Error('Use até 10 lembretes, entre zero e 30 dias antes.');
 d.reminders=[...new Set(d.reminders)].sort((a,b)=>b-a);return d;
}
const occurs=(d,date)=>P.occurrence(d,date)===date;
function urgency(date,now=Date.now(),z=DEFAULT_ZONE){const today=V.day(now,z),days=Math.round((Date.parse(date+'T12:00Z')-Date.parse(today+'T12:00Z'))/86400000);return days<0?'past':days===0?'red':days===1?'orange':days<=3?'yellow':'normal';}
function notifications(items,dismissed={},now=Date.now()){
 const out=[];
 for(const item of items){if(item.deleted)continue;const d=item.data;
  try{const z=d.timeZone||DEFAULT_ZONE,today=V.day(now,z),date=P.occurrence(d,today);if(!date)continue;const at=instant(date,d.time||'09:00',z),expires=instant(V.add(date,1),'00:00',z);if(now>=expires)continue;
   const prefix=[item.id,date,d.time||'09:00',z].join('|');
   const due=(d.reminders??[4320,1440,0]).filter(n=>Number.isInteger(n)&&n>=0&&n<=43200&&now>=at-n*60000).map(n=>({key:prefix+'|'+n,minutes:n})).filter(r=>!dismissed[r.key]);
   if(due.length)out.push({item,date,at,expires,due,urgency:urgency(date,now,z)});
  }catch{/* A malformed legacy appointment stays in the list for editing. */}
 }
 return out.sort((a,b)=>a.at-b.at||a.item.id.localeCompare(b.item.id));
}
function order(nodes,matrix,strategy,optimize,appointments){
 const byId=new Map(appointments.map(a=>[String(a.clientId),a])),groups=new Map();
 nodes.forEach((n,i)=>{if(!i)return;const at=byId.get(String(n.id))?.at??Infinity;if(!groups.has(at))groups.set(at,[]);groups.get(at).push(i);});
 const result=[0];let previous=0;
 for(const [,group]of [...groups].sort((a,b)=>a[0]-b[0])){const ids=[previous,...group],sub=ids.map(i=>ids.map(j=>matrix[i][j]));const seq=optimize(ids.map(i=>nodes[i]),sub,strategy).slice(1).map(i=>ids[i]);result.push(...seq);previous=seq.at(-1);}
 return result;
}
function timeline(points,legs,appointments,departure){
 const byId=new Map(appointments.map(a=>[String(a.clientId),a]));let clock=departure;const rows=[];
 for(let i=0;i<points.length;i++){const a=byId.get(String(points[i].id)),seconds=legs[i]?.duration;if(!a||!Number.isFinite(seconds)||seconds<0)return {rows,warnings:['O serviço de mapas não informou o tempo de cada trecho. Não foi possível verificar os horários desta rota.']};
  const arrival=clock+seconds*1000,late=Math.max(0,Math.ceil((arrival-a.at)/60000));rows.push({clientId:String(points[i].id),name:points[i].name,at:a.at,arrival,late,timeZone:a.timeZone});clock=Math.max(arrival,a.at)+a.durationMinutes*60000;
 }
 return {rows,warnings:rows.filter(r=>r.late).map(r=>r.name+': chegada estimada '+r.late+' min após o horário marcado.')};
}
root.RotaMapaSchedulingModel={DEFAULT_ZONE,validTime,zone,instant,normalize,occurs,urgency,notifications,order,timeline};
})(globalThis);

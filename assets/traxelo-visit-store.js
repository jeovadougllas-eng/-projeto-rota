/* Account-scoped durable outbox. Only the dedicated visits table is synchronized. */
(function(root){
'use strict';
const clone=o=>JSON.parse(JSON.stringify(o));
const canonical=o=>JSON.stringify(o,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
function create(owner,storage=root.localStorage){
 if(!owner)throw Error('Entre na sua conta para registrar visitas.');
 const portfolio=root.RotaMapaPortfolioScope?.active(owner)||'00000000-0000-4000-8000-000000000000';const key=root.RotaMapaPortfolioScope?.key('traxelo.visits.v1:'+owner,owner)||'traxelo.visits.v1:'+owner;let state={schema:1,events:[],outbox:[],baseline:{},legacyLinks:{}};
 try{const saved=JSON.parse(storage.getItem(key)||'null');if(saved&&saved.schema===1&&Array.isArray(saved.events))state={...state,...saved};}catch{}
 let busy=false;
 function commit(next){storage.setItem(key,JSON.stringify(next));state=next;return state;}
 function add(event){if(!event?.id||!event.clientId||!TraxeloVisitsModel.validDay(event.visitDate)||!['confirmed','pending','void'].includes(event.status))throw Error('Dados da visita inválidos.');const existing=state.events.find(e=>e.id===event.id);if(existing)return clone(existing);const value={...clone(event),version:1};commit({...state,events:[...state.events,value],outbox:[...new Set([...state.outbox,value.id])]});return clone(value);}
 function revise(id,patch){const old=state.events.find(e=>e.id===id);if(!old)throw Error('Visita não encontrada.');const value={...old,...clone(patch),id:old.id,clientId:old.clientId,version:(old.version||1)+1,updatedAt:new Date().toISOString()};if(!TraxeloVisitsModel.validDay(value.visitDate)||!['confirmed','pending','void'].includes(value.status))throw Error('Correção inválida.');commit({...state,events:state.events.map(e=>e.id===id?value:e),outbox:[...new Set([...state.outbox,id])]});return clone(value);}
 function linkLegacy(token,id){commit({...state,legacyLinks:{...state.legacyLinks,[token]:id}});}
 async function sync(client,{isCurrent=()=>true}={}){
  if(busy)return {busy:true};busy=true;let sent=0,received=0,conflicts=0;
  try{
   const identity=await client.auth.getUser();if(identity.error||identity.data?.user?.id!==owner||!isCurrent())throw Error('A conta mudou. A sincronização foi interrompida.');
   const remote=[];
   for(let offset=0;offset<50000;offset+=500){const {data,error}=await client.from('traxelo_visit_events').select('id,data,revision').eq('user_id',owner).eq('portfolio_id',portfolio).order('id',{ascending:true}).range(offset,offset+499);if(error)throw error;if(!Array.isArray(data))throw Error('Resposta inválida do histórico na nuvem.');remote.push(...data);if(data.length<500)break;if(offset>=49500)throw Error('Histórico acima do limite de leitura. Exporte o backup e contate o suporte.');}
   if(!isCurrent())return {cancelled:true};
   const byId=new Map(remote.map(r=>[r.id,r]));
   for(const row of remote){if(!isCurrent())break;if(!row.data||row.data.id!==row.id||!TraxeloVisitsModel.validDay(row.data.visitDate))continue;const local=state.events.find(e=>e.id===row.id),hash=canonical(row.data),dirty=state.outbox.includes(row.id);if(!local){commit({...state,events:[...state.events,clone(row.data)],baseline:{...state.baseline,[row.id]:{hash,revision:row.revision}}});received++;}else if(canonical(local)===hash){commit({...state,outbox:state.outbox.filter(id=>id!==row.id),baseline:{...state.baseline,[row.id]:{hash,revision:row.revision}}});}else if(!dirty){commit({...state,events:state.events.map(e=>e.id===row.id?clone(row.data):e),baseline:{...state.baseline,[row.id]:{hash,revision:row.revision}}});received++;}}
   for(const id of [...state.outbox]){
    if(!isCurrent())break;const event=clone(state.events.find(e=>e.id===id)),hash=canonical(event),row=byId.get(id),prior=state.baseline[id];let revision;
    const payload={client_id:String(event.clientId),visit_date:event.visitDate,status:event.status,data:event};
    if(!row){const result=await client.from('traxelo_visit_events').insert({user_id:owner,portfolio_id:portfolio,id,...payload}).select('revision').single();if(result.error){if(result.error.code==='23505'){conflicts++;continue;}throw result.error;}revision=result.data?.revision;}
    else if(prior&&prior.revision===row.revision&&prior.hash===canonical(row.data)){
     const result=await client.from('traxelo_visit_events').update({...payload,revision:row.revision+1,updated_at:new Date().toISOString()}).eq('user_id',owner).eq('portfolio_id',portfolio).eq('id',id).eq('revision',row.revision).select('revision');if(result.error)throw result.error;if(!result.data?.length){conflicts++;continue;}revision=result.data[0].revision;
    }else{conflicts++;continue;}
    if(!Number.isSafeInteger(Number(revision)))throw Error('A nuvem não confirmou a revisão gravada.');
    const unchanged=canonical(state.events.find(e=>e.id===id))===hash;
    commit({...state,outbox:unchanged?state.outbox.filter(x=>x!==id):state.outbox,baseline:{...state.baseline,[id]:{hash,revision:Number(revision)}}});sent++;
   }
   return {sent,received,conflicts,pending:state.outbox.length};
  }finally{busy=false;}
 }
 return {owner,portfolio,key,add,revise,linkLegacy,sync,snapshot:()=>clone(state),events:()=>clone(state.events),syncState:id=>state.outbox.includes(id)?'Pendente de envio':'Sincronizado'};
}
root.TraxeloVisitStore={create,canonical};
})(globalThis);

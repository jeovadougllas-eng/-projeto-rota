/* Account-scoped durable outbox. Only the dedicated visits table is synchronized. */
(function(root){
'use strict';
const clone=o=>JSON.parse(JSON.stringify(o));
const canonical=o=>JSON.stringify(o,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
function create(owner,storage=root.localStorage){
 if(!owner)throw Error('Entre na sua conta para acessar as vendas.');
 const portfolio=root.RotaMapaPortfolioScope?.active(owner)||'00000000-0000-4000-8000-000000000000';const key=root.RotaMapaPortfolioScope?.key('rotamapa.commerce.v1:'+owner,owner)||'rotamapa.commerce.v1:'+owner;let state={schema:1,events:[],outbox:[],baseline:{},legacyLinks:{}};
 try{const saved=JSON.parse(storage.getItem(key)||'null');if(saved&&saved.schema===1&&Array.isArray(saved.events)&&Array.isArray(saved.outbox)&&saved.baseline&&typeof saved.baseline==='object')state={...state,...saved};else if(storage.getItem(key)!==null)throw Error('Formato local não reconhecido.');}catch{throw Error('O histórico local não pôde ser lido. Preserve os dados deste aparelho antes de continuar.');}
 let busy=false;
 function commit(next){storage.setItem(key,JSON.stringify(next));state=next;return state;}
 function add(event){if(!event?.id||!event.kind)throw Error('Registro inválido.');RotaMapaCommerceModel.validate(event.kind,event);const existing=state.events.find(e=>e.id===event.id);if(existing)return clone(existing);const value={...clone(event),version:1};commit({...state,events:[...state.events,value],outbox:[...new Set([...state.outbox,value.id])]});return clone(value);}
 function revise(id,patch){const old=state.events.find(e=>e.id===id);if(!old)throw Error('Visita não encontrada.');const value={...old,...clone(patch),id:old.id,kind:old.kind,version:(old.version||1)+1,updatedAt:new Date().toISOString()};RotaMapaCommerceModel.validate(value.kind,value);commit({...state,events:state.events.map(e=>e.id===id?value:e),outbox:[...new Set([...state.outbox,id])]});return clone(value);}
 function linkLegacy(token,id){commit({...state,legacyLinks:{...state.legacyLinks,[token]:id}});}
 async function sync(client,{isCurrent=()=>true}={}){
  if(busy)return {busy:true};busy=true;let sent=0,received=0,conflicts=0;
  try{
   const identity=await client.auth.getUser();if(identity.error||identity.data?.user?.id!==owner||!isCurrent())throw Error('A conta mudou. A sincronização foi interrompida.');
   const remote=[];
   for(let offset=0;offset<50000;offset+=500){const {data,error}=await client.from('rotamapa_commerce_items').select('id,data,revision').eq('user_id',owner).eq('portfolio_id',portfolio).order('id',{ascending:true}).range(offset,offset+499);if(error)throw error;if(!Array.isArray(data))throw Error('Resposta inválida das vendas na nuvem.');remote.push(...data);if(data.length<500)break;if(offset>=49500)throw Error('Registros acima do limite de leitura. Exporte o backup e contate o suporte.');}
   if(!isCurrent())return {cancelled:true};
   const byId=new Map(remote.map(r=>[r.id,r]));
   for(const row of remote){if(!isCurrent())break;if(!row.data||row.data.id!==row.id)continue;RotaMapaCommerceModel.validate(row.data.kind,row.data);const local=state.events.find(e=>e.id===row.id),hash=canonical(row.data),dirty=state.outbox.includes(row.id);if(!local){commit({...state,events:[...state.events,clone(row.data)],baseline:{...state.baseline,[row.id]:{hash,revision:row.revision}}});received++;}else if(canonical(local)===hash){commit({...state,outbox:state.outbox.filter(id=>id!==row.id),baseline:{...state.baseline,[row.id]:{hash,revision:row.revision}}});}else if(!dirty){commit({...state,events:state.events.map(e=>e.id===row.id?clone(row.data):e),baseline:{...state.baseline,[row.id]:{hash,revision:row.revision}}});received++;}}
   for(const id of [...state.outbox].sort((a,b)=>{const rank={product:0,campaign:1,sale:2};return rank[state.events.find(e=>e.id===a)?.kind]-rank[state.events.find(e=>e.id===b)?.kind];})){
    if(!isCurrent())break;const event=clone(state.events.find(e=>e.id===id)),hash=canonical(event),row=byId.get(id),prior=state.baseline[id];let revision;
    const payload={kind:event.kind,data:event};
    if(!row){const result=await client.from('rotamapa_commerce_items').insert({user_id:owner,portfolio_id:portfolio,id,...payload}).select('revision').single();if(result.error){if(result.error.code==='23505'){conflicts++;continue;}throw result.error;}revision=result.data?.revision;}
    else if(prior&&prior.revision===row.revision&&prior.hash===canonical(row.data)){
     const result=await client.from('rotamapa_commerce_items').update({data:event,revision:row.revision+1,updated_at:new Date().toISOString()}).eq('user_id',owner).eq('portfolio_id',portfolio).eq('id',id).eq('revision',row.revision).select('revision');if(result.error)throw result.error;if(!result.data?.length){conflicts++;continue;}revision=result.data[0].revision;
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
root.RotaMapaCommerceStore={create,canonical};
})(globalThis);

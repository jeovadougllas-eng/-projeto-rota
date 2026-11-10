/* Append-only document library. IndexedDB keeps originals offline; cloud writes are explicit. */
(function(root){
 'use strict';
 const clone=v=>structuredClone(v),canonical=v=>JSON.stringify(v,(_k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
 const hash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',typeof value==='string'?new TextEncoder().encode(value):value))].map(n=>n.toString(16).padStart(2,'0')).join('');
 const equivalent=(a,b)=>canonical({...a,data:a.kind==='snapshot'?a.data:{...a.data,fileName:''}})===canonical({...b,data:b.kind==='snapshot'?b.data:{...b.data,fileName:''}});
 let opened;
 function database(){return opened||=new Promise((resolve,reject)=>{const req=indexedDB.open('rotamapa.document-library.v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('items',{keyPath:'key'}).createIndex('scope','scope');req.onsuccess=()=>resolve(req.result);req.onerror=()=>{opened=null;reject(Error('Não foi possível abrir a biblioteca local. Preserve os dados deste aparelho.'));};});}
 function validate(value){
  if(!value||!['boxes','commissions','campaigns','catalog','snapshot'].includes(value.kind)||!/^[a-f0-9]{64}$/.test(value.id||'')||!/^[a-f0-9]{64}$/.test(value.sourceHash||''))throw Error('Documento inválido.');
  if(!value.data||typeof value.data!=='object'||Array.isArray(value.data)||new TextEncoder().encode(canonical(value.data)).length>524288)throw Error('Use documentos com até 512 KB de condições extraídas.');
  return clone(value);
 }
 function create(owner,portfolio,{isCurrent=()=>true}={}){
  if(!owner||!portfolio)throw Error('Identifique a conta e a carteira.');const scope=owner+':'+portfolio;let busy=false;
  const guard=()=>{if(!isCurrent())throw Error('A conta ou a carteira mudou. Reabra a biblioteca.');};
  async function transaction(mode,work){const db=await database();guard();return new Promise((resolve,reject)=>{const tx=db.transaction('items',mode),store=tx.objectStore('items');let value;tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error||Error('Não foi possível salvar. Os registros anteriores foram preservados.'));tx.onabort=()=>reject(tx.error||Error('Operação cancelada.'));try{work(store,v=>value=v);}catch(e){tx.abort();reject(e);}});}
  async function items(){return transaction('readonly',(s,done)=>{const r=s.index('scope').getAll(scope);r.onsuccess=()=>done(r.result);});}
  async function put(value,{blob=null,synced=false}={}){validate(value);return transaction('readwrite',(s,done)=>{const key=scope+':'+value.id,r=s.get(key);r.onsuccess=()=>{const old=r.result;if(old){if(!equivalent(old.value,value)){s.transaction.abort();return;}done(old);return;}const record={key,scope,value:clone(value),blob,synced,createdAt:new Date().toISOString()};s.add(record);done(record);};});}
  async function replace(record){return transaction('readwrite',(s,done)=>{s.put(record);done(record);});}
  async function identity(client){guard();const r=await client.auth.getUser();guard();if(r.error||r.data?.user?.id!==owner)throw Error('Entre novamente na sua conta.');}
  async function sync(client){if(busy)return{busy:true};busy=true;let sent=0,received=0,conflicts=0;
   try{await identity(client);const rows=[];
    for(let offset=0;offset<50000;offset+=500){guard();const r=await client.from('rotamapa_library_items').select('id,kind,source_hash,data').eq('user_id',owner).eq('portfolio_id',portfolio).order('id').range(offset,offset+499);guard();if(r.error)throw r.error;if(!Array.isArray(r.data))throw Error('Resposta inválida da biblioteca.');rows.push(...r.data);if(r.data.length<500)break;if(offset>=49500)throw Error('Biblioteca acima do limite de leitura. Exporte o backup.');}
    const localById=new Map((await items()).map(r=>[r.value.id,r]));
    for(const row of rows){guard();const value=validate({id:row.id,kind:row.kind,sourceHash:row.source_hash,data:row.data}),old=localById.get(row.id);if(old){if(!equivalent(old.value,value)){conflicts++;continue;}if(!old.synced||canonical(old.value)!==canonical(value))await replace({...old,value,synced:true});}else{await put(value,{synced:true});received++;}}
    for(const record of (await items()).filter(r=>!r.synced).sort((a,b)=>Number(a.value.kind==='snapshot')-Number(b.value.kind==='snapshot'))){
     guard();await identity(client);const value=record.value;
     if(value.kind==='catalog'){
      if(!record.blob)throw Error('O original deste catálogo não está disponível neste aparelho.');
      const path=owner+'/'+portfolio+'/'+value.sourceHash+'.pdf',bucket=client.storage.from('rotamapa-catalogs');
      const upload=await bucket.upload(path,record.blob,{upsert:false,contentType:'application/pdf'});guard();
      if(upload.error){const existing=await bucket.download(path);guard();if(existing.error||await hash(await existing.data.arrayBuffer())!==value.sourceHash)throw upload.error;}
     }
     const r=await client.rpc('rotamapa_library_put',{p_id:value.id,p_kind:value.kind,p_source_hash:value.sourceHash,p_data:value.data});guard();if(r.error)throw r.error;
     if(r.data?.id!==value.id||r.data?.source_hash!==value.sourceHash||!equivalent({id:r.data.id,kind:r.data.kind,sourceHash:r.data.source_hash,data:r.data.data},value))throw Error('A nuvem não confirmou o conteúdo. O original local foi preservado.');
     await replace({...record,value:{id:r.data.id,kind:r.data.kind,sourceHash:r.data.source_hash,data:r.data.data},synced:true});sent++;
    }
    return{sent,received,conflicts,pending:(await items()).filter(r=>!r.synced).length};
   }finally{busy=false;}
  }
  async function original(id,client){const record=(await items()).find(r=>r.value.id===id);if(!record||record.value.kind!=='catalog')throw Error('Catálogo não encontrado nesta carteira.');if(record.blob)return record.blob;await identity(client);const path=owner+'/'+portfolio+'/'+record.value.sourceHash+'.pdf',r=await client.storage.from('rotamapa-catalogs').download(path);guard();if(r.error)throw r.error;if(await hash(await r.data.arrayBuffer())!==record.value.sourceHash)throw Error('O original não corresponde ao documento importado.');await replace({...record,blob:r.data});return r.data;}
  async function purgeSynced(){return transaction('readwrite',(s,done)=>{let removed=0,preserved=0;const r=s.index('scope').openCursor(scope);r.onsuccess=()=>{const cursor=r.result;if(!cursor){done({removed,preserved});return;}if(cursor.value.synced){cursor.delete();removed++;}else preserved++;cursor.continue();};});}
  return{owner,portfolio,items,put,sync,original,purgeSynced,hasPending:async()=>(await items()).some(r=>!r.synced)};
 }
 root.RotaMapaLibraryStore=Object.freeze({create,hash,canonical,validate});
})(globalThis);

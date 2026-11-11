/* Immutable pre-orders share the revision-checked, owner/portfolio workspace settings. */
(function(root){
'use strict';
const field='fairPreordersV1',M=()=>root.RotaMapaFairOrdersModel,clone=v=>structuredClone(v);
function validate(value,owner,portfolio){
 const x=value?{...value,deleted:value.deleted||[]}:{version:1,records:[],deleted:[]};
 if(x.version!==1||!Array.isArray(x.records)||x.records.length>100||!Array.isArray(x.deleted)||x.deleted.length>10000)throw Error('Pré-pedidos sincronizados inválidos. Os dados locais foram preservados.');
 const ids=new Set();for(const r of x.records){if(r?.version!==1||r.type!=='fair-simulation'||r.owner!==owner||r.portfolio!==portfolio||r.expiresAt!==M().EXPIRES_AT||typeof r.id!=='string'||ids.has(r.id)||!r.participant?.clientId||typeof r.participant.name!=='string'||!Array.isArray(r.lines)||!r.lines.length||r.lines.length>100||!Number.isSafeInteger(r.totalCents)||r.totalCents<1||r.lines.some(l=>typeof l.name!=='string'||!Number.isSafeInteger(l.quantity)||l.quantity<1||!Number.isSafeInteger(l.unitCents)||l.unitCents<1||l.totalCents!==l.quantity*l.unitCents)||r.totalCents!==r.lines.reduce((n,l)=>n+l.totalCents,0))throw Error('Pré-pedido inválido. Os dados existentes foram preservados.');ids.add(r.id);}
 if(x.deleted.some(id=>typeof id!=='string'||id.length>200))throw Error('Lista de exclusão inválida.');return clone(x);
}
function local(storage,owner,portfolio){const raw=storage.getItem(M().key(owner,portfolio));return validate(raw?JSON.parse(raw):null,owner,portfolio);}
function merge(a,b,owner,portfolio){a=validate(a,owner,portfolio);b=validate(b,owner,portfolio);const deleted=[...new Set([...a.deleted,...b.deleted])].sort(),gone=new Set(deleted),rows=new Map();for(const r of [...a.records,...b.records]){if(gone.has(r.id))continue;const old=rows.get(r.id);if(old&&JSON.stringify(old)!==JSON.stringify(r))throw Error('Pré-pedido com conflito. Os originais foram preservados para conferência.');rows.set(r.id,r);}return validate({version:1,records:[...rows.values()].sort((a,b)=>a.id.localeCompare(b.id)),deleted},owner,portfolio);}
function clear(storage,owner,portfolio){const data=local(storage,owner,portfolio);data.deleted=[...new Set([...data.deleted,...data.records.map(r=>r.id)])];data.records=[];storage.setItem(M().key(owner,portfolio),JSON.stringify(data));}
async function pack(data){const text=JSON.stringify(data);if(root.CompressionStream){const zipped=new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());let binary='';for(const b of zipped)binary+=String.fromCharCode(b);return{encoding:'gzip',value:btoa(binary)};}return data;}
async function unpack(value){if(!value||value.encoding!=='gzip')return value;if(typeof value.value!=='string'||value.value.length>600000)throw Error('Arquivo sincronizado acima do limite.');const bytes=Uint8Array.from(atob(value.value),c=>c.charCodeAt(0));const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();let size=0;const chunks=[];try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>4000000)throw Error('Pré-pedidos acima do limite técnico.');chunks.push(value);}}finally{await reader.cancel();}return JSON.parse(await new Blob(chunks).text());}
function create({storage,owner,portfolio,workspace,client,isCurrent,onChange=()=>{}}){let busy=false,status='pending',error='';
 const check=()=>{if(!isCurrent()||workspace.owner!==owner||workspace.portfolio!==portfolio)throw Error('A conta ou a carteira mudou.');};
 async function sync(){if(busy)return;busy=true;try{check();if(root.navigator?.onLine===false)throw Error('Sem conexão.');status='pending';for(let attempt=0;attempt<3;attempt++){
  const result=await workspace.sync(client,{isCurrent});check();if(result.busy||result.changed)throw Error('A biblioteca está sincronizando. Tentaremos novamente.');
  const old=workspace.items('settings')[0],remote=validate(await unpack(old?.data?.[field]),owner,portfolio);check();let combined=merge(local(storage,owner,portfolio),remote,owner,portfolio);
  // Persist downloaded rows before uploading, without losing a concurrently saved local order.
  if(combined.records.length||combined.deleted.length||storage.getItem(M().key(owner,portfolio)))storage.setItem(M().key(owner,portfolio),JSON.stringify(combined));
  if(JSON.stringify(combined)!==JSON.stringify(remote)){
   const data={...(old?.data||{}),[field]:await pack(combined)};check();if(new TextEncoder().encode(JSON.stringify(data)).length>480000)throw Error('Biblioteca acima do limite de sincronização. Baixe os PDFs e procure suporte.');
   try{await workspace.put(client,{id:old?.id||crypto.randomUUID(),kind:'settings',data,revision:old?.revision||0},{isCurrent});}catch(e){if(e.code==='40001'&&attempt<2)continue;throw e;}
  }
  check();const latest=local(storage,owner,portfolio);combined=merge(latest,combined,owner,portfolio);if(combined.records.length||combined.deleted.length||storage.getItem(M().key(owner,portfolio)))storage.setItem(M().key(owner,portfolio),JSON.stringify(combined));
  // A local save during the request stays pending and is sent in the next pass.
  const cloud=validate(await unpack(workspace.items('settings')[0]?.data?.[field]),owner,portfolio);check();status=JSON.stringify(combined)===JSON.stringify(cloud)?'synced':'pending';error='';onChange();return;
 }throw Error('Conflito de sincronização. Tentaremos novamente.');
 }catch(e){status='pending';error=e.message||'Falha de conexão.';onChange();}finally{busy=false;}}
 return{sync,state:()=>({status,error}),pending:()=>{status='pending';error='';onChange();}};
}
root.RotaMapaFairSync=Object.freeze({field,validate,merge,local,clear,pack,unpack,create});
})(globalThis);

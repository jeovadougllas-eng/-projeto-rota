/* Account scoped cache + revision-checked cloud writes. No optimistic quota bypass. */
(function(root){
'use strict';
const copy=o=>JSON.parse(JSON.stringify(o));
function create(owner,storage=root.localStorage){
 const key='traxelo.workspace.v1:'+owner;let state={items:[],access:null};try{const cached=JSON.parse(storage.getItem(key)||'null');if(cached&&Array.isArray(cached.items))state=cached;}catch{}
 let busy=false,mutation=0;const current=(guard)=>{if(!guard())throw Error('A conta mudou. Operação interrompida.');};
 function commit(next){storage.setItem(key,JSON.stringify(next));state=next;}
 async function identity(client,guard){current(guard);const r=await client.auth.getUser();if(r.error||r.data?.user?.id!==owner)throw Error('Entre novamente na sua conta.');current(guard);}
 async function sync(client,{isCurrent=()=>true}={}){if(busy)return {busy:true};busy=true;const stamp=mutation;try{await identity(client,isCurrent);const access=await client.rpc('traxelo_plan_access');if(access.error)throw access.error;if(!['free','plus','pro'].includes(access.data?.plan))throw Error('O servidor não confirmou o plano.');const items=[];for(let offset=0;;offset+=500){const r=await client.from('traxelo_workspace_items').select('id,kind,data,revision,deleted,updated_at').eq('user_id',owner).order('id').range(offset,offset+499);if(r.error)throw r.error;if(!Array.isArray(r.data))throw Error('Resposta inválida da biblioteca.');items.push(...r.data);if(r.data.length<500)break;if(offset>=99500)throw Error('Biblioteca muito extensa para este aparelho. Entre em contato com o suporte.');}current(isCurrent);if(stamp!==mutation)return {changed:true};commit({items,access:{...access.data,checkedAt:new Date().toISOString()}});return {items:items.length};}finally{busy=false;}}
 async function put(client,{id,kind,data,revision=0,deleted=false},{isCurrent=()=>true}={}){await identity(client,isCurrent);const r=await client.rpc('traxelo_write_owned_item',{p_owner:owner,p_id:id,p_kind:kind,p_data:data,p_revision:revision,p_deleted:deleted});if(r.error)throw r.error;current(isCurrent);const row=r.data;if(!row||row.id!==id||!Number.isSafeInteger(Number(row.revision)))throw Error('O servidor não confirmou o salvamento. Sincronize antes de tentar novamente.');mutation++;const items=state.items.filter(i=>i.id!==id);items.push(row);const count=items.filter(i=>i.kind==='route'&&!i.deleted).length;commit({...state,items,access:state.access?{...state.access,routeCount:count}:null});return copy(row);}
 return {owner,key,sync,put,snapshot:()=>copy(state),items:kind=>copy(state.items.filter(i=>!i.deleted&&(!kind||i.kind===kind))),access:()=>copy(state.access)};
}
root.TraxeloWorkspaceStore={create};
})(globalThis);

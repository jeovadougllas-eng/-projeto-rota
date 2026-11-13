export const owner='00000000-0000-4000-8000-000000000001';
export const productId='10000000-0000-4000-8000-000000000001';
export async function commerceFixture(page){await page.addInitScript(({owner,productId})=>{
 const day=TraxeloDatePlaceholder=>new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
 const seed=[{id:productId,portfolio_id:'00000000-0000-4000-8000-000000000000',kind:'product',data:{id:productId,kind:'product',name:'Produto teste XPE - 120ml',priceCents:2000,code:'TESTE'},revision:1}];
 const cache='__commerce_cloud';if(!localStorage.getItem(cache))localStorage.setItem(cache,JSON.stringify(seed));window.__commerceWrites=[];
 const fixture=window.supabase,create=fixture.createClient.bind(fixture);
 fixture.createClient=(...args)=>{const client=create(...args),oldFrom=client.from.bind(client);client.from=table=>{
  if(table==='traxelo_workspace_items'){const cached=JSON.parse(localStorage.getItem(window.RotaMapaPortfolioScope?.key('traxelo.workspace.v1:'+owner,owner)||'traxelo.workspace.v1:'+owner)||'{\"items\":[]}');const q={then:yes=>Promise.resolve({data:cached.items||[],error:null}).then(yes)};for(const method of ['select','eq','order','range'])q[method]=()=>q;return q;}if(!['rotamapa_commerce_items','traxelo_visit_events'].includes(table))return oldFrom(table);
  let mode='read',payload=null,filters=[],offset=0,end=499;
  const key=table==='rotamapa_commerce_items'?cache:'__commerce_visit_cloud',load=()=>JSON.parse(localStorage.getItem(key)||'[]');
  const result=()=>{let rows=load();if(mode==='insert'){const old=rows.find(r=>r.id===payload.id);if(old)return{data:null,error:{code:'23505',message:'duplicate'}};const row={...structuredClone(payload),revision:1};rows.push(row);localStorage.setItem(key,JSON.stringify(rows));window.__commerceWrites.push({table,payload:structuredClone(payload)});return{data:{revision:1},error:null};}if(mode==='update'){const row=rows.find(r=>filters.every(([k,v])=>r[k]===v));if(!row)return{data:[],error:null};Object.assign(row,structuredClone(payload));localStorage.setItem(key,JSON.stringify(rows));return{data:[{revision:row.revision}],error:null};}return{data:rows.filter(r=>filters.every(([k,v])=>r[k]===v)).slice(offset,end+1),error:null};};
  const q={select:()=>q,eq:(k,v)=>{if(k!=='user_id')filters.push([k,v]);return q;},order:()=>q,range:(a,b)=>{offset=a;end=b;return q;},insert:p=>{payload=p;mode='insert';return q;},update:p=>{payload=p;mode='update';return q;},single:async()=>result(),then:(a,b)=>Promise.resolve(result()).then(a,b)};return q;};return client;};
 },{owner,productId});}

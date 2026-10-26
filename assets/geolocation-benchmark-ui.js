/* Isolated read-only benchmark. Never saves to customer storage or Supabase. */
(async()=>{
'use strict';
const $=id=>document.getElementById(id),URL_AUTH='https://ggsptbcgpdakxsdjrldd.supabase.co',KEY_AUTH='sb_publishable_n0MBYWwtja-mxyrzGJ-yVA_otDB8Kwn';
let auth,userId,clients=[],report=[],running=false,controller,planned=0,configured=false;
const text=(id,value)=>$(id).textContent=value;
function eligible(){return configured&&clients.length&&$('consent').checked&&!running;}
function buttons(){$('start').disabled=!eligible();$('load').disabled=running||!userId;$('stop').disabled=!running;$('download').disabled=!report.length;$('scope').disabled=running;$('consent').disabled=running;}
function summary(){
 const count=provider=>report.filter(r=>r.response?.results?.[provider]?.status==='compatible').length;
 const compatible=report.filter(r=>r.response?.combined==='compatible').length,conflicts=report.filter(r=>r.response?.combined==='conflict').length;
 const errors=report.filter(r=>r.error||Object.values(r.response?.results||{}).some(p=>p.partialFailure||p.status==='error')).length;
 const denominator=report.length;
 text('summary',`${denominator} de ${planned} processados · Geoapify: ${count('geoapify')} compatíveis · TomTom: ${count('tomtom')} compatíveis · Combinados sem conflito: ${compatible} (${denominator?Math.round(100*compatible/denominator):0}% dos processados) · Conflitos: ${conflicts} · Com falha de consulta: ${errors}. Carteira carregada: ${clients.length}.`);
}
function element(tag,content,className){const el=document.createElement(tag);if(content!=null)el.textContent=content;if(className)el.className=className;return el;}
const statusLabel={compatible:'Endereço compatível — precisão física não aferida',review:'Exige conferência',not_found:'Não encontrado',error:'Falha na consulta'};
function append(row){
 const outer=element('article',null,'row');outer.append(element('h3',row.client.name),element('small',[row.query.street,row.query.house,row.query.city,row.query.state,row.query.zip].filter(Boolean).join(', ')),element('small','Situação salva antes do teste: '+row.savedStatus));
 if(row.error)outer.append(element('p',row.error));else{
  const results=element('div',null,'results');
  for(const provider of ['geoapify','tomtom']){
   const result=row.response.results[provider],box=element('div',null,'provider');box.append(element('strong',provider==='geoapify'?'Geoapify':'TomTom'),element('p',statusLabel[result.status]||'Resposta desconhecida','status'),element('p',result.reason),element('small',`${result.requests} consulta(s) · ${result.attempts.map(a=>a.method+': '+(a.httpStatus||a.status)).join(' · ')}`));
   if(result.best){box.append(element('p',result.best.label),element('small',`${result.best.lat}, ${result.best.lon} · ${result.best.attribution}`));}
   if(result.candidates?.length){const details=element('details');details.append(element('summary','Ver candidatos e evidências'));for(const p of result.candidates)details.append(element('p',`${p.label} · ${p.lat}, ${p.lon} · ${p.precisionEvidence||'aproximação'} · ${p.attribution}`));box.append(details);}
   results.append(box);
  }
  outer.append(results);if(row.response.combined==='conflict')outer.append(element('p','Os serviços retornaram imóveis compatíveis em pontos separados por mais de 60 metros. Este caso exige conferência.'));
 }
 $('results').append(outer);
}
$('consent').onchange=buttons;
$('load').onclick=async()=>{
 try{
  $('load').disabled=true;const loadingUser=userId;const identity=await auth.auth.getUser();if(identity.error||identity.data.user?.id!==userId)throw Error('Sua conta mudou. Recarregue a página.');
  let records=[],source;
  const owner=localStorage.getItem('traxio_sync_owner_v29');
  if(owner===userId){
   const local=JSON.parse(localStorage.getItem('projeto_rota_mapa_v1')||'[]');
   if(Array.isArray(local)&&local.length){records=local;source='Cópia local desta conta, incluindo alterações ainda não sincronizadas.';}
  }
  if(!records.length){
   for(let offset=0;offset<5000;offset+=500){
    const {data,error}=await auth.from('clients').select('local_id,data,deleted_at').eq('user_id',userId).order('local_id',{ascending:true}).range(offset,offset+499);
    if(error)throw Error('Não foi possível ler sua carteira na nuvem. Entre no aplicativo, sincronize e tente novamente.');
    records.push(...data.filter(r=>!r.deleted_at&&r.data&&typeof r.data==='object'&&!Array.isArray(r.data)).map(r=>({...r.data,id:r.local_id})));
    if(data.length<500)break;
   }
   source='Somente leitura dos clientes da sua conta na nuvem.';
  }
  if(records.length>250)throw Error('O comparador aceita até 250 clientes por execução; sua carteira excede esse limite.');
  if(userId!==loadingUser)throw Error('Sua conta mudou. Recarregue a página.');
  const valid=records.filter(c=>c&&typeof c.name==='string');
  clients=JSON.parse(JSON.stringify(valid));report=[];planned=0;$('results').replaceChildren(element('p','Nenhuma consulta realizada.'));text('summary','');
  text('source',`${clients.length} clientes carregados. ${source}`);text('progress',clients.length?'Pronto. Escolha a quantidade e autorize o teste.':'Nenhum cliente encontrado para esta conta.');
 }catch(e){text('progress',e.message);}finally{buttons();}
};
$('stop').onclick=()=>{controller?.abort();};
$('start').onclick=async()=>{
 if(!eligible())return;
 const chosen=clients.slice(0,$('scope').value==='all'?clients.length:10);planned=chosen.length;report=[];running=true;controller=new AbortController();const signal=controller.signal;$('results').replaceChildren();buttons();summary();
 try{
  for(let i=0;i<chosen.length;i++){
   signal.throwIfAborted();const c=chosen[i],query={...TraxioGeo.parse(c),name:c.name};delete query.country;
   text('progress',`Consultando ${i+1} de ${chosen.length}: ${c.name}`);
   const row={client:{id:String(c.id),name:c.name},query,savedStatus:TraxioPlanner.location(c).kind};
   try{
    const {data,error}=await auth.auth.getSession();if(error||!data.session||data.session.user.id!==userId)throw Error('Sessão expirada. Entre novamente no aplicativo.');
    const response=await fetch('/api/geolocation-benchmark',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify(query),signal:AbortSignal.any([signal,AbortSignal.timeout(35000)])});
    const result=await response.json();if(!response.ok){row.error=result.error||'Falha de comunicação.';row.httpStatus=response.status;}else row.response=result;
   }catch(e){if(signal.aborted)throw e;row.error=e.name==='TimeoutError'?'Prazo da consulta excedido.':e.message;}
   signal.throwIfAborted();report.push(row);append(row);summary();buttons();
   if([401,403,429,503].includes(row.httpStatus)){text('progress','Teste interrompido: '+row.error);return;}
   if(i<chosen.length-1)await new Promise((resolve,reject)=>{const onAbort=()=>{clearTimeout(timer);reject(new DOMException('Interrompido','AbortError'));};const timer=setTimeout(()=>{signal.removeEventListener('abort',onAbort);resolve();},3500);signal.addEventListener('abort',onAbort,{once:true});});
  }
  text('progress','Comparação encerrada. Baixe o relatório. Nenhuma posição foi alterada.');
 }catch(e){text('progress',signal.aborted?'Interrompido. Resultados anteriores preservados nesta página. Nenhuma posição foi alterada.':'Falha: '+e.message);}finally{running=false;buttons();}
};
$('download').onclick=()=>{
 const blob=new Blob([JSON.stringify({schema:1,readOnly:true,createdAt:new Date().toISOString(),portfolioCount:clients.length,requested:planned,processed:report.length,disclaimer:'Compatibilidade de endereço não comprova precisão física. Nenhum dado de cliente foi alterado.',results:report},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=element('a');a.href=url;a.download='traxelo-comparacao-localizacao.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
try{
 if(!window.supabase)throw Error('Não foi possível carregar a autenticação. Reabra a página com conexão.');
 auth=supabase.createClient(URL_AUTH,KEY_AUTH,{auth:{storageKey:'traxio-auth-v3',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,flowType:'pkce'}});
 const {data,error}=await auth.auth.getUser();if(error||!data.user||data.user.is_anonymous)throw Error('Entre no aplicativo e depois reabra este comparador no mesmo navegador.');
 userId=data.user.id;text('account','Sessão validada. O teste acessará somente sua carteira.');
 auth.auth.onAuthStateChange((_event,session)=>{if(session?.user.id!==userId){controller?.abort();userId=null;clients=[];report=[];$('results').replaceChildren();text('summary','');text('source','');text('account','Sessão alterada. Recarregue após entrar na conta correta.');buttons();}});
 const status=await fetch('/api/geolocation-benchmark',{cache:'no-store'});if(!status.ok)throw Error('Comparador ainda não disponível nesta versão.');const cfg=await status.json();configured=cfg.configured?.geoapify&&cfg.configured?.tomtom;
 if(!configured)text('progress','As duas chaves precisam estar configuradas na versão publicada.');buttons();
}catch(e){text('account',e.message);buttons();}
})();

/* Explicit, server-confirmed portfolio lifecycle. No offline destructive queue. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),dialog=document.createElement('dialog');dialog.id='portfolioLifecycleDialog';dialog.className='detail-dialog commerce-dialog';dialog.setAttribute('aria-labelledby','portfolioLifecycleTitle');
 dialog.innerHTML='<form id="portfolioLifecycleForm"><h2 id="portfolioLifecycleTitle">Gerenciar carteira</h2><p id="portfolioLifecycleName"></p><label>Operação<select id="portfolioLifecycleAction"><option value="archive">Fazer backup e excluir da lista ativa (arquivar)</option><option value="delete">Excluir definitivamente sem backup</option><option value="restore">Restaurar carteira arquivada</option></select></label><p id="portfolioLifecycleImpact"></p><p>Somente os dados já sincronizados estão na conta. Sincronize os aparelhos e guarde os dados pendentes antes de continuar. A operação exige conexão; não será enfileirada offline.</p><input id="portfolioLifecycleConfirmation" type="hidden"><p id="portfolioLifecycleExpected" hidden></p><p id="portfolioLifecycleError" role="alert"></p><button id="portfolioLifecycleSubmit" type="submit">Confirmar operação</button><button id="portfolioLifecycleCancel" type="button" class="secondary">Cancelar</button></form>';
 document.body.append(dialog);let context=null,working=false;
 function describe(){if(!context)return;const action=$('portfolioLifecycleAction').value;
  const prefix={archive:'ARQUIVAR ',restore:'RESTAURAR ',delete:'EXCLUIR '}[action];$('portfolioLifecycleExpected').textContent=prefix+context.item.name;$('portfolioLifecycleConfirmation').value=prefix+context.item.name;
  $('portfolioLifecycleImpact').textContent=action==='archive'?'Backup recuperável na conta: clientes, pins, visitas, vendas, catálogo, campanhas, agenda, rotas e versões serão preservados. A carteira ficará bloqueada para novas gravações até a restauração. Dados arquivados continuam ocupando os limites existentes do plano.':action==='restore'?'A mesma carteira e seus identificadores serão reabertos, preservando os dados arquivados.':'Os clientes, pins, visitas, vendas, catálogo, campanhas, agenda, rotas e versões desta carteira serão removidos da conta. Não há restauração. Outras carteiras e usuários não serão alterados. Aparelhos antigos serão impedidos de reenviar os registros.';
 }
 $('portfolioLifecycleAction').onchange=describe;$('portfolioLifecycleCancel').onclick=()=>dialog.close();
 function pending(owner,id){const defaultId=RotaMapaPortfolioScope.DEFAULT;
 const suffix=id===defaultId?'':':portfolio:'+id,clientKey=id===defaultId?'projeto_rota_mapa_v1':'rotamapa.clients.v1:'+owner+':'+id;
 if(id!==defaultId||localStorage.getItem('traxio_sync_owner_v29')===owner){let records,base;try{records=JSON.parse(localStorage.getItem(clientKey)||'[]');base=JSON.parse(localStorage.getItem('traxio_sync_baseline_v29_'+owner+suffix)||'{}');}catch{throw Error('Preserve um backup dos cadastros locais antes de continuar.');}if(!Array.isArray(records)||records.some(c=>base[c.id]?.hash!==cloudCanonical(c)))throw Error('Há clientes locais ainda não confirmados na nuvem. Sincronize antes de continuar.');}
for(const base of ['traxelo.visits.v1:','rotamapa.commerce.v1:','traxelo.workspace.v1:']){const key=base+owner+(id===defaultId?'':':portfolio:'+id),raw=localStorage.getItem(key);if(!raw)continue;let data;try{data=JSON.parse(raw);}catch{throw Error('Há dados locais ilegíveis. Preserve um backup antes de continuar.');}if(data.outbox?.length)throw Error('Há registros pendentes neste aparelho. Sincronize antes de gerenciar a carteira.');}}
 async function deleteWithOriginals(own,confirmation){
  const check=async()=>{const r=await authClient.auth.getUser();if(r.error||r.data?.user?.id!==own.owner||document.body.classList.contains('auth-locked'))throw Error('A conta mudou. Reabra esta operação.');};
  const call=async(name,args)=>{await check();const r=await authClient.rpc(name,args);if(r.error)throw r.error;await check();return r;};
  let prepared=await call('rotamapa_prepare_portfolio_delete',{p_portfolio:own.item.id,p_revision:own.item.revision,p_confirmation:confirmation}),data=prepared.data;
  if(data?.id!==own.item.id||!['deleting','deleted'].includes(data.state))throw Error('O servidor não confirmou a preparação. Sincronize a lista.');
  if(data.state==='deleted')return prepared;
  const ticket=data.ticketId,prefix=own.owner+'/'+own.item.id+'/';if(typeof ticket!=='string'||!/^[a-f0-9-]{36}$/.test(ticket))throw Error('Confirmação de exclusão inválida.');

  for(;;){
   const paths=data.paths;if(!Array.isArray(paths)||paths.length>100||paths.some(path=>typeof path!=='string'||!path.startsWith(prefix)||!/^[a-f0-9]{64}\.pdf$/.test(path.slice(prefix.length))))throw Error('A lista de arquivos não pertence à carteira confirmada.');
   if(!paths.length)break;await check();$('portfolioLifecycleError').textContent='Exclusão em andamento: removendo os arquivos desta carteira. Se a conexão cair, retome esta operação.';
   const r=await authClient.storage.from('rotamapa-catalogs').remove(paths);if(r.error)throw r.error;await check();
   data=(await call('rotamapa_portfolio_delete_batch',{p_ticket:ticket})).data;if(data?.id!==own.item.id||data.ticketId!==ticket||JSON.stringify(data.paths)===JSON.stringify(paths))throw Error('A remoção dos arquivos ainda não foi confirmada. Retome a operação para concluir.');
  }
  return call('rotamapa_finish_portfolio_delete',{p_ticket:ticket,p_confirmation:confirmation});
 }
 dialog.addEventListener('cancel',e=>{if(working)e.preventDefault();});
 $('portfolioLifecycleForm').onsubmit=async e=>{e.preventDefault();if(!context)return;const own=context,action=$('portfolioLifecycleAction').value;$('portfolioLifecycleSubmit').disabled=true;$('portfolioLifecycleCancel').disabled=true;working=true;
  try{
   if(!navigator.onLine)throw Error('Conecte-se à internet. Nenhuma operação foi agendada.');
   if(document.body.classList.contains('auth-locked'))throw Error('Entre novamente na sua conta.');
   if(action==='delete'&&!window.confirm('Excluir permanentemente a carteira '+own.item.name+'?\n\nTodos os dados e arquivos desta carteira serão removidos e não poderão ser recuperados.\n\nConfirme para excluir ou cancele para manter a carteira.'))return;
   const auth=await authClient.auth.getUser();if(auth.error||auth.data?.user?.id!==own.owner)throw Error('A conta mudou. Abra novamente esta opção.');pending(own.owner,own.item.id);
   const library=window.RotaMapaLibraryStore?.create(own.owner,own.item.id);if(library&&await library.hasPending())throw Error('Há documentos locais pendentes. Sincronize ou exporte o backup antes de gerenciar a carteira.');
   const checked=await authClient.auth.getUser();if(checked.error||checked.data?.user?.id!==own.owner)throw Error('A conta mudou. Reabra esta opção.');
   if(own.item.id===RotaMapaPortfolioScope.loadedId&&clients.length&&localStorage.getItem('traxio_sync_owner_v29')!==own.owner)throw Error('A propriedade dos clientes locais ainda não foi confirmada. Sincronize antes de continuar.');
   const r=action==='delete'?await deleteWithOriginals(own,$('portfolioLifecycleConfirmation').value):await authClient.rpc('rotamapa_manage_portfolio',{p_portfolio:own.item.id,p_revision:own.item.revision,p_action:action,p_confirmation:$('portfolioLifecycleConfirmation').value});
   if(r.error)throw r.error;if(r.data?.id!==own.item.id||r.data?.state!==({archive:'archived',restore:'active',delete:'deleted'})[action])throw Error('O servidor não confirmou o resultado. Sincronize a lista antes de tentar novamente.');
   if(action==='delete'){
    const current=await authClient.auth.getUser();if(current.data?.user?.id===own.owner){if(library)await library.purgeSynced();await window.RotaMapaShowroom?.purge(own.owner,own.item.id);const id=own.item.id,suffix=id===RotaMapaPortfolioScope.DEFAULT?'':':portfolio:'+id;
     const keys=['traxelo.visits.v1:','rotamapa.commerce.v1:','traxelo.workspace.v1:','traxelo.visits.settings.v1:'].map(k=>k+own.owner+suffix);keys.push('rotamapa.fair-links.v1:'+own.owner+':'+id);if(window.RotaMapaFairOrdersModel)keys.push(RotaMapaFairOrdersModel.key(own.owner,id));keys.push('traxio_sync_baseline_v29_'+own.owner+suffix,'rotamapa.portfolio.last-version.v1:'+own.owner+':'+id);
     if(id!==RotaMapaPortfolioScope.DEFAULT)keys.push('rotamapa.clients.v1:'+own.owner+':'+id);else if(localStorage.getItem('traxio_sync_owner_v29')===own.owner)keys.push('projeto_rota_mapa_v1');
     for(const key of keys)localStorage.removeItem(key);
     if(id===RotaMapaPortfolioScope.loadedId){traxioSyncSuspended=true;clients=[];render();}
    }
   }
   dialog.close();await RotaMapaPortfolios.sync();
  }catch(error){$('portfolioLifecycleError').textContent=error.message||'Operação não concluída.';}finally{$('portfolioLifecycleSubmit').disabled=false;$('portfolioLifecycleCancel').disabled=false;working=false;}
 };
 window.RotaMapaPortfolioLifecycle={async open(item,state){
  const auth=await authClient.auth.getUser();if(auth.error||!auth.data?.user?.id||document.body.classList.contains('auth-locked'))throw Error('Entre na sua conta.');
  context={item:{...item},owner:auth.data.user.id};$('portfolioLifecycleName').textContent=item.name;$('portfolioLifecycleAction').value=state==='deleting'?'delete':state==='archived'?'restore':'archive';$('portfolioLifecycleAction').querySelector('[value=restore]').disabled=state!=='archived';$('portfolioLifecycleAction').querySelector('[value=archive]').disabled=state==='archived'||state==='deleting';$('portfolioLifecycleError').textContent='';describe();dialog.showModal();
 }};
})();

/* Preview only; the existing portfolio chooser remains authoritative. */
(function(){
 'use strict';
 const dialog=document.createElement('dialog');dialog.id='clientImportPreview';dialog.className='detail-dialog commerce-dialog';dialog.setAttribute('aria-labelledby','clientImportPreviewTitle');
 dialog.innerHTML='<h2 id="clientImportPreviewTitle">Conferir importação de clientes</h2><p id="clientImportPreviewSummary"></p><ul id="clientImportPreviewIssues"></ul><div class="table-wrap"><table><thead><tr><th>Cliente</th><th>CNPJ</th><th>Endereço</th></tr></thead><tbody id="clientImportPreviewRows"></tbody></table></div><p>Todas as colunas serão preservadas. A importação é local; localização e enriquecimento são etapas separadas e opcionais.</p><button type="button" id="clientImportContinue">Escolher carteira</button><button type="button" id="clientImportCancel" class="secondary">Cancelar</button>';
 document.body.append(dialog);let resolve=null;
 const finish=value=>{const done=resolve;resolve=null;dialog.close();done?.(value);};
 document.getElementById('clientImportCancel').onclick=()=>finish(false);dialog.addEventListener('cancel',e=>{e.preventDefault();finish(false);});dialog.addEventListener('close',()=>{if(resolve)finish(false);});document.getElementById('clientImportContinue').onclick=()=>finish(true);
 const progress=document.createElement('dialog');progress.className='detail-dialog commerce-dialog';progress.id='clientImportProgress';progress.innerHTML='<h2>Preparando clientes</h2><progress id="clientImportProgressBar" aria-label="Clientes preparados" max="1" value="0"></progress><p id="clientImportProgressText" role="status"></p><button type="button" id="clientImportAbort">Cancelar sem alterar cadastros</button>';document.body.append(progress);let controller=null;
 document.getElementById('clientImportAbort').onclick=()=>controller?.abort();progress.addEventListener('cancel',e=>{e.preventDefault();controller?.abort();});
 window.RotaMapaClientImport={async materialize(plan,options={}){
  if(controller)throw Error('Outra importação está sendo preparada.');controller=new AbortController();progress.showModal();
  try{return await RotaMapaClientImportModel.materialize(plan,{...options,signal:controller.signal,onProgress:(n,total)=>{document.getElementById('clientImportProgressBar').max=Math.max(1,total);document.getElementById('clientImportProgressBar').value=n;document.getElementById('clientImportProgressText').textContent=n+' de '+total;options.onProgress?.(n,total);}});}finally{controller=null;progress.close();}
 },async preview(rows,fileName){
  if(resolve)throw Error('Conclua a importação que já está aberta.');
  const plan=RotaMapaClientImportModel.stage(rows,[],fileName),summary=document.getElementById('clientImportPreviewSummary');
  summary.textContent=plan.added.length+' clientes únicos · '+plan.duplicates.length+' duplicados idênticos ignorados · '+plan.errors.length+' erros.';
  const issues=document.getElementById('clientImportPreviewIssues');issues.replaceChildren();for(const v of [...plan.errors,...plan.warnings].slice(0,50)){const li=document.createElement('li');li.textContent='Linha '+v.line+': '+v.message;issues.append(li);}
  const body=document.getElementById('clientImportPreviewRows');body.replaceChildren();for(const row of plan.added.slice(0,100)){const tr=document.createElement('tr');for(const value of [row.name,row.cnpj||'Não informado',row.address]){const td=document.createElement('td');td.textContent=value;tr.append(td);}body.append(tr);}
  document.getElementById('clientImportContinue').disabled=!plan.canApply;dialog.showModal();return new Promise(r=>resolve=r);
 }};
})();

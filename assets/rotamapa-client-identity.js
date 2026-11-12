/* Read-only customer identity shared by client lists and searches. */
(function(root){
'use strict';
const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,''),digits=value=>String(value??'').replace(/\D/g,''),documentLabel=label=>['cnpj','cnpjcpf','cpfcnpj'].includes(normalize(label));
function cnpj(client){
 const imported=Array.isArray(client?.importFields)?client.importFields:[],official=Array.isArray(client?.companyData?.fields)?client.companyData.fields:[];
 const values=[...imported.filter(f=>documentLabel(f?.label)).map(f=>f.value),client?.cnpj,client?.companyData?.cnpj,...official.filter(f=>Array.isArray(f)&&documentLabel(f[0])).map(f=>f[1])];
 for(const value of values){const number=digits(value);if(number.length===14)return number;}return '';
}
function formatted(client){const number=cnpj(client);return number?number.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,'$1.$2.$3/$4-$5'):'';}
function matches(client,query,...extra){const q=normalize(query);if(!q)return true;const fields=Array.isArray(client?.importFields)?client.importFields:[];return normalize([client?.name,fantasy(client),cnpj(client),client?.address,client?.street,client?.city,client?.neighborhood,...fields.map(f=>f?.value),...extra].filter(v=>v!=null).join(' ')).includes(q);}
function fantasy(client){
 const fields=[...(Array.isArray(client?.latestImportFields)?client.latestImportFields:[]),...(Array.isArray(client?.importFields)?client.importFields:[])];
 const v=client?.fantasyName||client?.nomeFantasia||client?.nome_fantasia||client?.tradeName||client?.tradingName||client?.companyData?.nome_fantasia||fields.find(f=>['nomefantasia','fantasia'].includes(normalize(f?.label)))?.value||(Array.isArray(client?.companyData?.fields)?client.companyData.fields.find(f=>Array.isArray(f)&&['nomefantasia','fantasia'].includes(normalize(f[0])))?.[1]:null);
 return String(v||'').trim();
}
// Copy stays local and never changes the customer record or the surrounding selection.
function copyButton(value){
 const number=digits(value);if(number.length!==14)return null;
 const doc=root.document,b=doc.createElement('button');b.type='button';b.className='cnpj-copy-button';b.title='Copiar CNPJ';b.setAttribute('aria-label','Copiar CNPJ');
 b.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg><span class="cnpj-copy-feedback" role="status" aria-live="polite"></span>';
 let timer;
 b.addEventListener('keydown',event=>event.stopPropagation());
 b.onclick=async event=>{event.preventDefault();event.stopPropagation();const feedback=b.querySelector('.cnpj-copy-feedback');clearTimeout(timer);feedback.textContent='';
  try{if(root.navigator?.clipboard?.writeText)await root.navigator.clipboard.writeText(number);else throw Error('clipboard unavailable');}
  catch{const field=doc.createElement('textarea'),active=doc.activeElement;field.value=number;field.readOnly=true;field.setAttribute('aria-label','CNPJ para copiar');field.style.cssText='position:fixed;left:0;top:0;opacity:0;width:1px;height:1px';(b.closest('dialog')||doc.body).append(field);let copied=false;try{field.focus();field.select();field.setSelectionRange(0,number.length);copied=doc.execCommand('copy');}catch{}finally{field.remove();active?.focus({preventScroll:true});}if(!copied){feedback.textContent='Não foi possível copiar. Selecione o CNPJ e copie manualmente.';timer=setTimeout(()=>feedback.textContent='',6000);return;}}
  feedback.textContent='CNPJ copiado!';timer=setTimeout(()=>feedback.textContent='',2500);
 };return b;
}
function appendDocument(container,value){const number=digits(value),line=root.document.createElement('small');line.className='client-cnpj';line.textContent=formatted({cnpj:number})||'CNPJ não informado';const b=copyButton(number);if(b)line.append(b);container.append(line);return line;}
function append(container,client){const name=fantasy(client);if(name){const label=root.document.createElement('small');label.className='client-fantasy-name';label.textContent='Nome fantasia: '+name;container.append(label);}return appendDocument(container,cnpj(client));}
function copy(client){const box=root.document.createElement('span');box.className='client-identity-copy';box.textContent=client?.name||'Cliente';append(box,client);return box;}
root.RotaMapaClientIdentity={cnpj,formatted,matches,fantasy,append,copy,copyButton,appendDocument};
})(globalThis);

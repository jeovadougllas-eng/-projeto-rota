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
function matches(client,query,...extra){const q=normalize(query);if(!q)return true;const fields=Array.isArray(client?.importFields)?client.importFields:[];return normalize([client?.name,cnpj(client),client?.address,client?.street,client?.city,client?.neighborhood,...fields.map(f=>f?.value),...extra].filter(v=>v!=null).join(' ')).includes(q);}
function append(container,client){const line=root.document.createElement('small');line.className='client-cnpj';line.textContent=formatted(client)||'CNPJ não informado';container.append(line);return line;}
function copy(client){const box=root.document.createElement('span');box.className='client-identity-copy';box.textContent=client?.name||'Cliente';append(box,client);return box;}
root.RotaMapaClientIdentity={cnpj,formatted,matches,append,copy};
})(globalThis);

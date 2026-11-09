/* Deterministic import staging. Existing records and verified pins are never rewritten. */
(function(root){
 'use strict';
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const text=v=>String(v??'').trim();
 const identity=c=>root.RotaMapaClientIdentity?.cnpj(c)||'';
 const fallback=c=>norm(c.name)+'|'+norm(c.address)+'|'+norm(c.cep);
 function schema(rows){
  if(!Array.isArray(rows)||rows.length<2||rows.length>10001||!Array.isArray(rows[0]))throw Error('Use uma planilha com cabeçalho e até 10.000 clientes.');
  const labels=rows[0].map((v,i)=>text(v)||'Coluna '+(i+1)),headers=labels.map(norm);
  const index=(...names)=>headers.findIndex(h=>names.includes(h));
  const name=index('nome','razaosocial','cliente','nomefantasia','fantasia');if(name<0)throw Error('Coluna Nome ou Razão Social não encontrada.');
  return {labels,index,name};
 }
 function rowData(row,n,S,fileName){
  if(!Array.isArray(row))throw Error('Linha '+n+' inválida.');
  if(!row.some(v=>text(v)))return null;
  const value=i=>i<0?'':text(row[i]),field=(...k)=>value(S.index(...k));
  const name=value(S.name);if(!name)throw Error('Linha '+n+': informe o nome do cliente.');
  const raw=field('cnpj','cnpjcpf','cpfcnpj');let cnpj='';
  if(raw){if(!/^[\d\s./-]+$/.test(raw))throw Error('Linha '+n+': CNPJ não deve usar notação científica.');cnpj=raw.replace(/\D/g,'');if(cnpj.length!==14)throw Error('Linha '+n+': CNPJ deve ter 14 dígitos. Preserve os zeros na planilha; não serão inventados.');if(/^0+$/.test(cnpj))throw Error('Linha '+n+': CNPJ vazio ou zerado.');}
  const number=(...k)=>{const v=field(...k);return v!==''&&Number.isFinite(Number(v.replace(',','.')))?Number(v.replace(',','.')):null;};
  const lat=number('lat','latitude'),lon=number('lon','lng','longitude'),has=lat!==null&&lon!==null&&Math.abs(lat)<=90&&Math.abs(lon)<=180&&!(lat===0&&lon===0);
  const street=field('endereco','rua','logradouro'),city=field('cidade','municipio');
  return {name,cnpj,address:[street,street?city:''].filter(Boolean).join(', '),city,street,neighborhood:field('bairro','distrito'),state:field('estado','uf'),houseNumber:field('numero','nro','num'),complement:field('complemento'),cep:field('cep'),lat:has?lat:null,lon:has?lon:null,locationVerification:has?'imported_coordinates':'pending',priority:2,importSource:fileName,importFields:S.labels.map((label,i)=>({label,value:value(i)}))};
 }
 function stage(rows,current=[],fileName='Planilha'){
  const S=schema(rows),known=new Map(),groups=new Map(),added=[],unchanged=[],duplicates=[],errors=[],warnings=[];
  for(const c of current){const key=identity(c)?'cnpj:'+identity(c):'row:'+fallback(c);const old=known.get(key)||[];old.push(c);known.set(key,old);}
  rows.slice(1).forEach((row,i)=>{try{
   const c=rowData(row,i+2,S,fileName);if(!c)return;const key=c.cnpj?'cnpj:'+c.cnpj:'row:'+fallback(c),prior=groups.get(key);
   if(prior){if(JSON.stringify(prior)!==JSON.stringify(c))errors.push({line:i+2,message:'Identificador repetido com dados diferentes. Revise a planilha.'});else duplicates.push({line:i+2,name:c.name});return;}
   groups.set(key,c);const existing=known.get(key)||[];
   if(existing.length>1){errors.push({line:i+2,message:'Há mais de um cadastro existente com este identificador. Revise antes de importar.'});return;}
   if(existing.length){unchanged.push({line:i+2,id:existing[0].id,name:c.name});return;}
   if(!c.cnpj)warnings.push({line:i+2,message:'Sem CNPJ: identificação por nome, endereço e CEP.'});added.push(c);
  }catch(e){errors.push({line:i+2,message:e.message});}});
  return {added,unchanged,duplicates,errors,warnings,canApply:!errors.length&&(added.length+unchanged.length+duplicates.length)>0,total:groups.size};
 }
 async function materialize(plan,{newId=()=>crypto.randomUUID(),signal,onProgress=()=>{},batchSize=100}={}){
  if(!plan.canApply)throw Error('Revise os erros da pré-visualização.');const result=[];
  for(let i=0;i<plan.added.length;i++){
   if(signal?.aborted)throw Error('Importação cancelada. Nenhum cadastro foi alterado.');result.push({...plan.added[i],id:newId()});
   if((i+1)%batchSize===0){onProgress(i+1,plan.added.length);await new Promise(r=>setTimeout(r,0));}
  }
  if(signal?.aborted)throw Error('Importação cancelada. Nenhum cadastro foi alterado.');onProgress(result.length,plan.added.length);return result;
 }
 root.RotaMapaClientImportModel=Object.freeze({stage,materialize});
})(globalThis);

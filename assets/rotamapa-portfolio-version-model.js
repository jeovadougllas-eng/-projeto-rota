/* Stable CNPJ reconciliation. Existing IDs, reviewed addresses and pins are retained. */
(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,''),cnpj=c=>root.RotaMapaClientIdentity.cnpj(c);
function fromRows(rows,fileName){
 if(!Array.isArray(rows)||rows.length<2||rows.length>10001)throw Error('Use uma planilha com cabeçalho e até 10.000 clientes.');const labels=rows[0].map((h,i)=>String(h??'').trim()||'Coluna '+(i+1)),headers=labels.map(norm),index=(...names)=>headers.findIndex(h=>names.includes(h)),ni=index('razaosocial','nome','cliente','nomefantasia','fantasia'),di=index('cnpj','cnpjcpf','cpfcnpj');if(ni<0||di<0)throw Error('A atualização precisa das colunas Razão social (ou Nome) e CNPJ.');
 return rows.slice(1).flatMap((row,n)=>{if(!row.some(v=>String(v??'').trim()))return [];const value=i=>i<0?'':String(row[i]??'').trim(),document=value(di).replace(/\D/g,''),name=value(ni);const number=(...names)=>{const text=value(index(...names));return text!==''&&Number.isFinite(Number(text.replace(',','.')))?Number(text.replace(',','.')):null;};let lat=number('lat','latitude'),lon=number('lon','longitude','lng');if(lat===null||lon===null||Math.abs(lat)>90||Math.abs(lon)>180||lat===0&&lon===0)lat=lon=null;const city=value(index('cidade','municipio')),street=value(index('rua','logradouro','endereco'));return [{line:n+2,cnpj:document,name,data:{name,cnpj:document,address:[street,city].filter(Boolean).join(', '),street,city,neighborhood:value(index('bairro','distrito')),state:value(index('uf','estado')),cep:value(index('cep')),houseNumber:value(index('numero','nro','num')),complement:value(index('complemento')),lat,lon,locationVerification:lat===null?'pending':'imported_coordinates',priority:2,active:true,importSource:fileName,importFields:labels.map((label,i)=>({label,value:value(i)}))}}];});
}
function compare(current,incoming,{newId=()=>crypto.randomUUID(),fileName='Atualização'}={}){
 const invalid=[],duplicates=[],conflicts=[],groups=new Map();for(const row of incoming){if(!/^\d{14}$/.test(row.cnpj)||/^0+$/.test(row.cnpj)||!row.name?.trim()){invalid.push({...row,reason:'Confira CNPJ com 14 dígitos e razão social.'});continue;}const group=groups.get(row.cnpj)||[];group.push(row);groups.set(row.cnpj,group);}
 const oldGroups=new Map();for(const c of current){const key=cnpj(c);if(!key)continue;const group=oldGroups.get(key)||[];group.push(c);oldGroups.set(key,group);}
 const kept=[],added=[],removed=[],unidentified=[],final=[],used=new Set();
 for(const [key,rows]of groups){const canonical=JSON.stringify(rows[0].data);if(rows.length>1){duplicates.push({cnpj:key,name:rows[0].name,count:rows.length,origin:'file'});if(rows.some(r=>JSON.stringify(r.data)!==canonical)){conflicts.push({cnpj:key,name:rows[0].name,reason:'O novo arquivo repete este CNPJ com dados diferentes.'});continue;}}
  const group=(oldGroups.get(key)||[]).sort((a,b)=>Number(root.TraxioPlanner?.location(b).ready||false)-Number(root.TraxioPlanner?.location(a).ready||false)||String(a.id).localeCompare(String(b.id))),old=group[0],row=rows[0];
  if(old){used.add(String(old.id));const value={...clone(old),name:row.name,cnpj:key,active:true,latestImportSource:fileName,latestImportFields:clone(row.data.importFields)};kept.push({cnpj:key,name:row.name,id:old.id,reactivated:old.active===false});final.push(value);if(group.length>1)duplicates.push({cnpj:key,name:old.name,count:group.length,origin:'current'});}
  else{const value={...clone(row.data),id:newId()};added.push({cnpj:key,name:row.name,id:value.id});final.push(value);}
 }
 for(const c of current){if(used.has(String(c.id)))continue;const key=cnpj(c);if(!key){unidentified.push({id:c.id,name:c.name,cnpj:'',reason:'Cadastro sem CNPJ preservado.'});final.push(clone(c));continue;}final.push({...clone(c),active:false});if(c.active!==false)removed.push({id:c.id,name:c.name,cnpj:key});}
 return {kept,added,removed,unidentified,duplicates,conflicts,invalid,clients:final,canApply:groups.size>0&&!invalid.length&&!conflicts.length};
}
function restore(current,archived){const snapshot=new Set(archived.map(c=>String(c.id))),now=new Map(current.map(c=>[String(c.id),c])),result=archived.map(c=>({...clone(c),...clone(now.get(String(c.id))||{}),active:c.active!==false}));for(const c of current)if(!snapshot.has(String(c.id)))result.push({...clone(c),active:false});return result;}
root.RotaMapaPortfolioVersionModel={fromRows,compare,restore};
})(globalThis);

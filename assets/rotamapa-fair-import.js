/* Staging only: no client, route, coordinate or sale writes. Files stay on this device. */
(function(root){
 'use strict';
 const norm=v=>root.RotaMapaFairModel.normalized(v),text=v=>String(v??'').trim();
 const aliases={cnpj:['cnpj','cnpjcpf','cpfcnpj'],legalName:['razaosocial','nomeempresarial','razao','cliente','nome'],tradeName:['nomefantasia','fantasia']};
 const field=v=>Object.keys(aliases).find(k=>aliases[k].includes(norm(v)));
 const documents=line=>[...line.matchAll(/(?<!\d)(?:\d{2}\s*\.\s*\d{3}\s*\.\s*\d{3}\s*\/\s*\d{4}\s*-\s*\d{2}|\d{14})(?!\d)/g)];
 function cells(parts,columns,doc=''){const value={cnpj:doc,legalName:'',tradeName:''};for(const item of parts){let col=columns[0];for(const next of columns)if(item.x>=next.x-5)col=next;const part=(doc?item.text.replace(doc,''):item.text).trim();if(col.kind&&part&&(!doc||col.kind!=='cnpj'))value[col.kind]=[value[col.kind],part].filter(Boolean).join(' ');}return value;}
 function table(rows){
  if(!Array.isArray(rows)||rows.length>10020)throw Error('Use uma lista de até 5.000 participantes.');
  const header=rows.slice(0,30).findIndex(r=>Array.isArray(r)&&r.some(v=>field(v)==='cnpj')&&r.some(v=>['legalName','tradeName'].includes(field(v))));
  if(header<0)throw Error('Não encontrei as colunas CNPJ e Razão social ou Nome fantasia. Use esses títulos na lista.');
  const columns={};rows[header].forEach((v,i)=>{const k=field(v);if(k){if(columns[k]!=null)throw Error('Há duas colunas '+v+'. Confira a planilha.');columns[k]=i;}});
  const records=[];rows.slice(header+1).forEach((row,i)=>{if(!Array.isArray(row)||!row.some(v=>text(v)))return;if(row.some(v=>field(v)==='cnpj')&&row.some(v=>['legalName','tradeName'].includes(field(v))))return;records.push({cnpj:text(row[columns.cnpj]),legalName:text(row[columns.legalName]),tradeName:text(row[columns.tradeName]),line:i+header+2});});return records;
 }
 function pdf(parsed){
  const records=[];let columns=null;
  if(!parsed.ocr&&parsed.layout?.length){
   for(const page of parsed.layout)for(const row of page){const parts=row.items.filter(i=>text(i.text)).sort((a,b)=>a.x-b.x),labels=[];
    for(let i=0;i<parts.length;i++){let found=false;for(let size=Math.min(3,parts.length-i);size>=1;size--){const label=parts.slice(i,i+size).map(p=>p.text).join(' '),kind=field(label);if(kind){labels.push({kind,x:parts[i].x});i+=size-1;found=true;break;}}if(!found)labels.push({kind:null,x:parts[i].x});}
    if(labels.some(l=>l.kind==='cnpj')&&labels.some(l=>['legalName','tradeName'].includes(l.kind))){columns=labels;continue;}
    const line=parts.map(p=>p.text).join(' '),docs=documents(line);if(!docs.length){if(columns){const value=cells(parts,columns);if(/\d/.test(value.cnpj)&&(value.legalName||value.tradeName))records.push(value);}continue;}
    if(docs.length!==1){records.push({cnpj:'',legalName:line.slice(0,200),tradeName:'',issue:'Há mais de um CNPJ na mesma linha. Confira a associação dos nomes.'});continue;}
    if(columns)records.push(cells(parts,columns,docs[0][0]));
    else records.push(singleLine(line,docs[0]));
   }
  }else for(const line of text(parsed.text).split(/\r?\n/)){const docs=documents(line);if(docs.length===1)records.push(singleLine(line,docs[0]));else if(docs.length>1)records.push({cnpj:'',legalName:line.slice(0,200),tradeName:'',issue:'Há mais de um CNPJ na linha. Separe os participantes na prévia.'});}
  if(!records.length)throw Error('Não reconheci CNPJs nesta lista. Envie um PDF legível ou Excel/CSV com CNPJ, Razão social e Nome fantasia.');
  return records.map((r,i)=>({...r,line:i+1}));
 }
 function singleLine(line,doc){const name=line.replace(doc[0],'').replace(/^\s*(?:\d+[.)-]?\s+)?(?:CNPJ\s*:?\s*)?/i,'').replace(/^[\s|;:·-]+|[\s|;:·-]+$/g,'').trim();const parts=name.split(/\s*[|;\t]\s*|\s{3,}/).filter(Boolean);return{cnpj:doc[0],legalName:parts[0]||'',tradeName:parts[1]||''};}
 function stage(records,edition,clients){
  if(!Array.isArray(records)||!records.length||records.length>5000)throw Error('Importe de 1 a 5.000 participantes por vez.');
  const F=root.RotaMapaFairModel,existing=new Set(F.people(edition,clients).map(p=>p.cnpj)),seen=new Map(),entries=[],errors=[],duplicates=[];let added=0,updated=0,matched=0,unmatched=0,ambiguous=0;
  records.forEach((row,index)=>{try{if(row.issue)throw Error(row.issue);const p={cnpj:F.cnpj(row.cnpj),legalName:text(row.legalName),tradeName:text(row.tradeName)};if(!p.legalName&&!p.tradeName)throw Error('Informe a razão social ou o nome fantasia.');if(p.legalName.length>200||p.tradeName.length>200)throw Error('Use nomes de até 200 caracteres.');const old=seen.get(p.cnpj);if(old){if(old.legalName!==p.legalName||old.tradeName!==p.tradeName)throw Error('CNPJ repetido com nomes diferentes. Confira ou remova a linha repetida.');duplicates.push(index);return;}seen.set(p.cnpj,p);existing.has(p.cnpj)?updated++:added++;const matches=clients.filter(c=>root.RotaMapaClientIdentity.cnpj(c)===p.cnpj);if(matches.length===1)matched++;else if(matches.length===0)unmatched++;else ambiguous++;entries.push(p);}catch(error){errors.push({index,line:row.line||index+1,message:error.message});}});
  return{entries,errors,duplicates,added,updated,matched,unmatched,ambiguous,canApply:entries.length>0&&!errors.length};
 }
 root.RotaMapaFairParticipantImport=Object.freeze({table,pdf,stage});
})(globalThis);

/* Deterministic table/text interpretation. Ambiguous source lines are retained for review. */
(function(root){
 'use strict';const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,''),text=v=>String(v??'').trim();
 function date(value){const s=text(value),m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/),out=m?m[3]+'-'+m[2]+'-'+m[1]:s;return root.RotaMapaCommerceModel.day(out)?out:null;}
 function rows(input,kind){
  if(!['commissions','campaigns','boxes'].includes(kind)||!Array.isArray(input)||input.length<2||input.length>10001)throw Error('Confira o tipo e use uma tabela com cabeçalho e até 10.000 linhas.');
  const headers=input[0].map(norm),index=(...keys)=>headers.findIndex(h=>keys.includes(h)),entries=[],review=[];
  const fields={code:index('codigo','codigodoproduto','codproduto','cod','ean'),name:index('nome','produto','descricao','descricaodoproduto'),presentation:index('apresentacao','embalagem'),company:index('empresa','fabricante','fornecedor'),rate:index('percentual','comissao','taxa','percentualdecomissao'),start:index('vigenciainicio','inicio','datainicio','validadeinicio'),end:index('vigenciafim','fim','datafim','validadefim'),box:index('unidadesporcaixa','unidadescaixa','qtdcaixa','caixapadrao'),price:index('preco','precounitario','precodeoferta'),discount:index('desconto','descontopercentual'),minimum:index('quantidademinima','minimo','quantidade'),region:index('regiao'),stock:index('estoque'),restrictions:index('restricoes','regras')};
  input.slice(1).forEach((row,i)=>{if(!Array.isArray(row)||!row.some(v=>text(v)))return;const get=k=>fields[k]<0?'':text(row[fields[k]]),base={line:i+2,code:get('code'),name:get('name'),presentation:get('presentation'),company:get('company'),raw:row.map(text)};
   if(!base.code&&!base.name){review.push({...base,reason:'Produto não identificado.'});return;}
   if(kind==='commissions'){try{root.RotaMapaCommissions.bps(get('rate'));const validFrom=date(get('start')),validTo=get('end')?date(get('end')):null;if(!validFrom||get('end')&&!validTo||validTo&&validTo<validFrom)throw Error('Vigência incompleta ou inválida.');entries.push({...base,rate:get('rate'),validFrom,validTo});}catch(e){review.push({...base,rate:get('rate'),reason:e.message});}}
   if(kind==='boxes'){const units=Number(get('box'));if(!Number.isSafeInteger(units)||units<1||units>1000000)review.push({...base,reason:'Unidades por caixa inválidas ou ausentes.'});else entries.push({...base,units});}
   if(kind==='campaigns'){
    const validFrom=date(get('start')),validTo=date(get('end')),price=get('price').replace(/^R\$\s*/,''),discount=get('discount').replace(/%$/,'').trim();
    try{if(!validFrom||!validTo||validTo<validFrom)throw Error('Vigência incompleta ou inválida.');if(!!price===!!discount)throw Error('Informe preço OU desconto; condições simultâneas precisam de revisão.');const minimum=get('minimum')?Number(get('minimum')):1;root.RotaMapaCommerceModel.integer(minimum,1,1000000,'Quantidade mínima');const priceCents=price?root.RotaMapaCommerceModel.money(price.replace(/\.(?=\d{3}(?:[.,]|$))/g,'')):null,discountBps=discount?root.RotaMapaCommerceModel.percent(discount):null;entries.push({...base,validFrom,validTo,priceCents,discountBps,minimum,region:get('region'),stock:get('stock'),restrictions:get('restrictions')});}catch(e){review.push({...base,reason:e.message});}
   }
  });return{entries,review,automatic:entries.length,total:entries.length+review.length};
 }
 function parseText(source,kind){
  const text=String(source||''),lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean),dates=[...text.matchAll(/\b\d{2}\/\d{2}\/\d{4}\b/g)].map(m=>date(m[0])).filter(Boolean),entries=[],review=[];
  if(kind!=='commissions')return{entries,review:[{reason:'O documento não apresenta uma tabela inequívoca. Revise ou importe XLSX/CSV.',raw:lines}],automatic:0,total:1};
  for(const line of lines){if(!/%/.test(line))continue;const match=line.match(/^(\d{2,20})\s+(.+?)\s+(\d{1,3}(?:[.,]\d{1,2})?)\s*%\s*$/);
   if(!match||dates.length<1||dates.length>2||[...text.matchAll(/\b\d{2}\/\d{2}\/\d{4}\b/g)].length!==dates.length||dates[1]&&dates[1]<dates[0]){review.push({reason:'Código, percentual ou vigência ambíguos.',raw:line});continue;}
   try{root.RotaMapaCommissions.bps(match[3]);entries.push({code:match[1],name:match[2],rate:match[3],validFrom:dates[0],validTo:dates[1]||null,raw:line});}catch(e){review.push({reason:e.message,raw:line});}
  }
  if(!entries.length&&!review.length)review.push({reason:'Nenhuma regra inequívoca encontrada. Confira o documento original.',raw:text});return{entries,review,automatic:entries.length,total:entries.length+review.length};
 }
 root.RotaMapaDocumentModel=Object.freeze({date,rows,parseText});
})(globalThis);

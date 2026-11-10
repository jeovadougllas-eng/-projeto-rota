/* Imported commercial conditions never stack; unsupported restrictions require review. */
(function(root){
 'use strict';const M=root.RotaMapaCommerceModel,copy=x=>JSON.parse(JSON.stringify(x));
 const fallback='Este produto não possui condição vigente na campanha selecionada. Será utilizado o preço de tabela.';
 function quote(product,quantity,entries,{date,region='',time=''}={}){
  M.product(product);M.integer(quantity,1,1000000,'Quantidade');M.integer(product.priceCents*quantity,0,9000000000000,'Total');if(!M.day(date))throw Error('Confira a data da consulta.');
  const matched=entries.filter(e=>e.productId?e.productId===product.id:root.RotaMapaCommissions.match(e,[product]).product),eligible=[],blocked=[];
  for(const entry of matched){
   if(!M.day(entry.validFrom)||!M.day(entry.validTo)||date<entry.validFrom||date>entry.validTo)continue;
   if(entry.region&&root.RotaMapaCommissions.norm(entry.region)!==root.RotaMapaCommissions.norm(region)){blocked.push('Confira a região da campanha.');continue;}
   if(entry.restrictions){blocked.push('Esta condição contém restrições que precisam de revisão: '+entry.restrictions);continue;}
   if(entry.startTime||entry.endTime){if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)||entry.startTime&&time<entry.startTime||entry.endTime&&time>entry.endTime){blocked.push('Confira o horário de vigência da campanha.');continue;}}
   if(entry.stock!==''&&entry.stock!==undefined&&entry.stock!==null){const stock=Number(entry.stock);if(!/^\d+$/.test(String(entry.stock))||!Number.isSafeInteger(stock)||stock<quantity){blocked.push('Estoque insuficiente ou não confirmado.');continue;}}
   if(quantity<entry.minimum)continue;
   if((entry.priceCents===null||entry.priceCents===undefined)===(entry.discountBps===null||entry.discountBps===undefined))throw Error('A condição precisa de preço OU desconto.');
   if(entry.priceCents!=null)M.integer(entry.priceCents,1,product.priceCents,'Preço de oferta');else M.integer(entry.discountBps,0,10000,'Desconto');
   M.integer(entry.minimum,1,1000000,'Quantidade mínima');eligible.push(entry);
  }
  // Pick the reached tier only within the selected import. Competing conditions never auto-stack.
  const minimum=eligible.length?Math.max(...eligible.map(e=>e.minimum)):0,chosen=eligible.filter(e=>e.minimum===minimum);
  if(chosen.length>1)return{unitCents:product.priceCents,totalCents:product.priceCents*quantity,applied:false,notice:'Condições concorrentes. Revise a campanha antes de utilizar.'};
  if(!chosen.length)return{unitCents:product.priceCents,totalCents:product.priceCents*quantity,applied:false,notice:blocked[0]||fallback};
  const e=chosen[0],unitCents=e.priceCents??Number((BigInt(product.priceCents)*BigInt(10000-e.discountBps)+5000n)/10000n),totalCents=unitCents*quantity;M.integer(totalCents,0,9000000000000,'Total');
  return{unitCents,totalCents,applied:true,snapshot:copy(e),notice:'Condição da campanha selecionada, sem acumular descontos.'};
 }
 function legacyCampaign(entries,product,{id,name}){
  const matched=entries.filter(e=>e.productId?e.productId===product.id:root.RotaMapaCommissions.match(e,[product]).product);if(!matched.length)throw Error('Produto sem condição nesta campanha.');
  const first=matched[0];if(matched.some(e=>e.validFrom!==first.validFrom||e.validTo!==first.validTo||e.region||e.stock!==''&&e.stock!=null||e.restrictions||e.startTime||e.endTime))throw Error('Esta condição tem restrições adicionais. Utilize a consulta e revise antes de lançar o pedido.');
  const type=first.validFrom===first.validTo?'dia_d':'acelera';
  return M.campaign({id,kind:'campaign',name,productId:product.id,type,startDate:first.validFrom,endDate:first.validTo,tiers:matched.sort((a,b)=>a.minimum-b.minimum).map(e=>({minQty:e.minimum,discountBps:e.discountBps??0,...(e.priceCents!=null?{unitPriceCents:e.priceCents}: {})}))});
 }
 function validateCampaign(c){
  if(c.type!=='importada'||!c.id||!c.productId||typeof c.name!=='string'||!c.name.trim()||c.name.length>160||!M.day(c.startDate)||!M.day(c.endDate)||c.endDate<c.startDate||c.imported?.version!==1||!/^[a-f0-9]{64}$/.test(c.imported.documentId||'')||!/^[a-f0-9]{64}$/.test(c.imported.sourceHash||'')||!Array.isArray(c.imported.entries)||!c.imported.entries.length||c.imported.entries.length>100)throw Error('Confira a origem e a validade da campanha importada.');
  if(!Array.isArray(c.tiers)||c.tiers.length)throw Error('As faixas desta campanha vêm do documento original.');
  for(const e of c.imported.entries){if(!M.day(e.validFrom)||!M.day(e.validTo)||e.validTo<e.validFrom||e.validFrom<c.startDate||e.validTo>c.endDate||e.productId&&e.productId!==c.productId)throw Error('Condição de outra apresentação ou vigência inválida.');M.integer(e.minimum,1,1000000,'Quantidade mínima');if((e.priceCents==null)===(e.discountBps==null))throw Error('Informe preço OU desconto.');if(e.priceCents!=null)M.integer(e.priceCents,1,1000000000,'Preço');else M.integer(e.discountBps,0,10000,'Desconto');}
  return copy(c);
 }
 function importedCampaign(record,product,{id,name,products=[product]}={}){
  const entries=record.data.entries.filter(e=>e.productId?e.productId===product.id:root.RotaMapaCommissions.match(e,products).product?.id===product.id);
  if(!entries.length)throw Error('Revise o vínculo deste produto no documento antes de usar a condição.');
  return validateCampaign({id,kind:'campaign',productId:product.id,type:'importada',name,startDate:entries.map(e=>e.validFrom).sort()[0],endDate:entries.map(e=>e.validTo).sort().at(-1),tiers:[],imported:{version:1,documentId:record.id,sourceHash:record.sourceHash,entries:copy(entries)}});
 }
 function line(product,quantity,c,date,context={}){
  M.product(product);M.integer(quantity,1,1000000,'Quantidade comprada');c=validateCampaign(c);if(c.productId!==product.id||!M.day(date))throw Error('Confira a apresentação e a data da venda.');
  const promotionContext={region:String(context.region||'').trim(),time:String(context.time||'').trim()};if(promotionContext.region.length>160||promotionContext.time&&!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(promotionContext.time))throw Error('Confira a região e o horário da campanha.');
  const r=quote(product,quantity,c.imported.entries,{...promotionContext,date}),chosen=r.snapshot,unitCents=r.unitCents,discountBps=!chosen?0:chosen.priceCents!=null?Number((BigInt(product.priceCents-unitCents)*10000n+BigInt(product.priceCents)/2n)/BigInt(product.priceCents)):chosen.discountBps;
  return {productId:product.id,code:product.code||'',name:product.name,quantity,tableUnitCents:product.priceCents,label:chosen?'Campanha importada':'Preço de tabela',minQty:chosen?.minimum||0,discountBps,unitCents,totalCents:r.totalCents,...(chosen?.priceCents!=null?{unitPriceCents:unitCents}:{}),campaign:c,promotionContext};
 }
 root.RotaMapaPromotionModel=Object.freeze({quote,legacyCampaign,importedCampaign,validateCampaign,line,fallback});
})(globalThis);

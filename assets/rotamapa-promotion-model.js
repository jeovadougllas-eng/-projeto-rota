/* Imported commercial conditions never stack; unsupported restrictions require review. */
(function(root){
 'use strict';const M=root.RotaMapaCommerceModel,copy=x=>JSON.parse(JSON.stringify(x));
 const fallback='Este produto não possui condição vigente na campanha selecionada. Será utilizado o preço de tabela.';
 function quote(product,quantity,entries,{date,region='',time=''}={}){
  M.product(product);M.integer(quantity,1,1000000,'Quantidade');M.integer(product.priceCents*quantity,0,9000000000000,'Total');if(!M.day(date))throw Error('Confira a data da consulta.');
  const matched=entries.filter(e=>root.RotaMapaCommissions.match(e,[product]).product),eligible=[],blocked=[];
  for(const entry of matched){
   if(!M.day(entry.validFrom)||!M.day(entry.validTo)||date<entry.validFrom||date>entry.validTo)continue;
   if(entry.region&&root.RotaMapaCommissions.norm(entry.region)!==root.RotaMapaCommissions.norm(region)){blocked.push('Confira a região da campanha.');continue;}
   if(entry.restrictions){blocked.push('Esta condição contém restrições que precisam de revisão: '+entry.restrictions);continue;}
   if(entry.startTime||entry.endTime){if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)||entry.startTime&&time<entry.startTime||entry.endTime&&time>entry.endTime){blocked.push('Confira o horário de vigência da campanha.');continue;}}
   if(entry.stock!==''&&entry.stock!==undefined&&entry.stock!==null){const stock=Number(entry.stock);if(!Number.isSafeInteger(stock)||stock<quantity){blocked.push('Estoque insuficiente ou não confirmado.');continue;}}
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
  const matched=entries.filter(e=>root.RotaMapaCommissions.match(e,[product]).product);if(!matched.length)throw Error('Produto sem condição nesta campanha.');
  const first=matched[0];if(matched.some(e=>e.validFrom!==first.validFrom||e.validTo!==first.validTo||e.region||e.stock!==''&&e.stock!=null||e.restrictions||e.startTime||e.endTime))throw Error('Esta condição tem restrições adicionais. Utilize a consulta e revise antes de lançar o pedido.');
  const type=first.validFrom===first.validTo?'dia_d':'acelera';
  return M.campaign({id,kind:'campaign',name,productId:product.id,type,startDate:first.validFrom,endDate:first.validTo,tiers:matched.sort((a,b)=>a.minimum-b.minimum).map(e=>({minQty:e.minimum,discountBps:e.discountBps??0,...(e.priceCents!=null?{unitPriceCents:e.priceCents}: {})}))});
 }
 root.RotaMapaPromotionModel=Object.freeze({quote,legacyCampaign,fallback});
})(globalThis);

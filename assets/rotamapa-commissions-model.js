/* RotaMapa commission projection core. No payment tracking, no client-side entitlement changes. */
(function(root){
 'use strict';
 const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
 const code=s=>String(s??'').trim().toUpperCase();
 const cents=n=>Math.round(Number(n)*100);
 const percent=n=>Number(String(n??'').replace('%','').replace(',','.').trim());
 const validRate=n=>Number.isFinite(n)&&n>=0&&n<=100;
 const asDate=d=>{if(!d)return null;const t=new Date(d);return Number.isNaN(t.getTime())?null:t;};
 const eligible=s=>normalize(s)==='FATURADO';
 function matchProduct(entry,products){
  const exact=products.filter(p=>entry.code&&code(p.code)===code(entry.code));
  if(exact.length===1)return {product:exact[0],method:'code'};
  if(exact.length>1)return {product:null,reason:'duplicate-code'};
  const name=normalize(entry.description);
  const names=products.filter(p=>name&&normalize(p.description||p.name)===name);
  return names.length===1?{product:names[0],method:'description'}:{product:null,reason:names.length?'ambiguous':'not-found'};
 }
 function stage(entries,products){
  if(!Array.isArray(entries)||!Array.isArray(products))throw Error('Invalid import data');
  return entries.map(e=>{
   const rate=percent(e.rate),m=matchProduct(e,products);
   if(!validRate(rate))return {...e,status:'review',reason:'invalid-rate'};
   return {...e,rate,status:m.product?'matched':'review',reason:m.reason||null,method:m.method||null,productId:m.product?.id??null};
  });
 }
 function rateFor(item,rules,date){
  const when=asDate(date),id=String(item.productId??'');
  return rules.filter(r=>String(r.productId)===id&&validRate(Number(r.rate))&&(!r.validFrom||when&&when>=asDate(r.validFrom))&&(!r.validTo||when&&when<=asDate(r.validTo)))
   .sort((a,b)=>String(b.validFrom||'').localeCompare(String(a.validFrom||'')))[0]||null;
 }
 function project(sales,rules,options={}){
  if(!Array.isArray(sales)||!Array.isArray(rules))throw Error('Invalid projection data');
  const start=asDate(options.start),end=asDate(options.end);
  const rows=[],unmatched=[];let totalCents=0,baseCents=0;
  for(const sale of sales){
   if(!eligible(sale.status)||sale.cancelled===true)continue;
   const when=asDate(sale.invoiceDate||sale.faturadoAt||sale.date);
   if((start&&(!when||when<start))||(end&&(!when||when>end)))continue;
   for(const item of sale.items||[]){
    const value=Number(item.invoicedAmount??item.total),returns=Number(item.returnedAmount??0);
    if(!Number.isFinite(value)||!Number.isFinite(returns)||value<0||returns<0){unmatched.push({saleId:sale.id,productId:item.productId,reason:'invalid-amount'});continue;}
    const amount=Math.max(0,cents(value)-cents(returns));
    const rule=rateFor(item,rules,when);
    if(!rule){unmatched.push({saleId:sale.id,productId:item.productId,reason:'missing-rate'});continue;}
    const commission=Math.round(amount*Number(rule.rate)/100);
    rows.push({saleId:sale.id,productId:item.productId,rate:Number(rule.rate),baseCents:amount,commissionCents:commission,ruleId:rule.id??null});
    baseCents+=amount;totalCents+=commission;
   }
  }
  return {totalCents,baseCents,rows,unmatched,provisional:true};
 }
 root.RotaMapaCommissions=Object.freeze({normalize,matchProduct,stage,project});
})(globalThis);

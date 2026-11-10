/* Projection only. Integer cents/basis points, real receipt-level billing, immutable rate snapshots. */
(function(root){
 'use strict';
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
 const code=s=>String(s??'').trim().toUpperCase();
 const day=s=>root.RotaMapaCommerceModel.day(s);
 function integer(v,label,max=9000000000000){if(!Number.isSafeInteger(v)||v<0||v>max)throw Error(label+' inválido.');return v;}
 function bps(value){const s=String(value??'').trim().replace(/%$/,'').trim().replace(',','.');if(!/^\d{1,3}(?:\.\d{1,2})?$/.test(s))throw Error('Percentual inválido.');const [a,b='']=s.split('.');return integer(Number(a)*100+Number(b.padEnd(2,'0')),'Percentual',10000);}
 function description(value){return norm(String(value??'').replace(/(\d)([a-zA-Z])/g,'$1 $2')).replace(/\bPEDIATRIC[OA]\b/g,'PED').replace(/\bXAROPE\b/g,'XPE').replace(/\b(?:COMPRIMIDOS?|COMP|CP)\b/g,'CP').replace(/\b(?:CAPSULAS?|CAPS?)\b/g,'CAPS').replace(/\b(?:DRAGEAS?|DGR|DRG)\b/g,'DRG').replace(/\bSUSPENSAO\b/g,'SUSP').replace(/\bSOLUCAO\b/g,'SOL');}
 function presentationFits(entry,product){if(!entry.presentation)return true;const expected=description(entry.presentation);return product.presentation?description(product.presentation)===expected:(' '+description(product.name)).endsWith(' '+expected);}
 function match(entry,products){
  const exact=entry.code?products.filter(p=>code(p.code)===code(entry.code)):[];
  if(exact.length===1){if(!presentationFits(entry,exact[0]))return{reason:'presentation-conflict'};return{product:exact[0],method:'code'};}if(exact.length>1)return{reason:'duplicate-code'};
  const name=norm(entry.name||entry.description),presentation=norm(entry.presentation);
  const candidates=products.filter(p=>name&&norm(p.name)===name&&(!presentation||norm(p.presentation)===presentation));
  if(candidates.length!==1){
   if(candidates.length)return{reason:'ambiguous'};
   const full=description([entry.name||entry.description,entry.presentation].filter(Boolean).join(' ')),canonical=products.filter(p=>full&&description([p.name,p.presentation].filter(Boolean).join(' '))===full);
   if(canonical.length!==1)return{reason:canonical.length?'ambiguous':'not-found'};
   return{product:canonical[0],method:'canonical-description'};
  }
  // Exact full descriptions only; never fuzzy-match different doses or pack sizes.
  return{product:candidates[0],method:'full-description'};
 }
 function stage(entries,products,{ownerId,portfolioId,companyId,sourceHash}={}){
  if(!ownerId||!portfolioId||!companyId||!/^[a-f0-9]{64}$/.test(sourceHash||''))throw Error('Identifique a empresa e o documento de origem.');
  return entries.map((entry,index)=>{try{
   const rateBps=bps(entry.rate),validFrom=entry.validFrom,validTo=entry.validTo||null;
   if(!day(validFrom)||validTo!==null&&(!day(validTo)||validTo<validFrom))throw Error('Vigência inválida ou ausente.');
   const found=match(entry,products);if(!found.product)return{...entry,line:index+1,status:'review',reason:found.reason};
   return{ownerId,portfolioId,companyId,sourceHash,productId:found.product.id,rateBps,validFrom,validTo,method:found.method,...(entry.restrictions?{restrictions:entry.restrictions}:{}),line:index+1,status:'matched'};
  }catch(error){return{...entry,line:index+1,status:'review',reason:error.message};}});
 }
 function ruleFor(rules,productId,date,companyId){
  const all=rules.filter(r=>r.companyId===companyId&&r.productId===productId&&day(r.validFrom)&&r.validFrom<=date&&(!r.validTo||day(r.validTo)&&r.validTo>=date));
  if(!all.length)return{reason:'missing-rate'};
  const start=all.map(r=>r.validFrom).sort().at(-1),latest=all.filter(r=>r.validFrom===start);
  if(latest.length!==1)return{reason:'ambiguous-rate'};
  const rule=latest[0];if(rule.restrictions)return{reason:'conditional-rate-requires-review'};try{integer(rule.rateBps,'Percentual',10000);}catch{return{reason:'invalid-rate'};}return{rule};
 }
 function invoiced(sales,ownerId,timeZone='America/Fortaleza'){
  const out=[];for(const sale of sales){if(sale.kind!=='sale'||sale.status!=='confirmed')continue;
   if(!sale.source){if(!root.RotaMapaBuyerModel.confirmedManual(sale,ownerId))continue;const date=sale.manualBilling.invoiceDate||sale.date;if(!day(date))continue;
    for(const [i,line]of sale.lines.entries())out.push({saleId:sale.id,lineId:String(i),date,productId:line.productId,amountCents:line.quantity*line.unitCents,returnedCents:line.returnedCents??0,adjustmentCents:line.reversalCents??0});
   }else{
    for(const receipt of root.RotaMapaBillingModel.receipts(sale).filter(r=>r.state==='invoiced')){
     const date=receipt.settlement?.date||receipt.receipt?.invoiceDate;if(!day(date))continue;
     for(const [i,line]of (sale.lines||[]).entries())if(line.sourceReceipt===receipt.index){const item=receipt.settlement?.items?.[line.sourceItem];out.push({saleId:sale.id,lineId:String(i),date,productId:line.productId,amountCents:(item?.quantity??line.quantity)*(item?.unitCents??line.unitCents),returnedCents:line.returnedCents??0,adjustmentCents:line.reversalCents??0});}
    }
   }
  }return out;
 }
 function project(sales,rules,{ownerId,portfolioId,companyId,start,end,timeZone='America/Fortaleza',snapshots=[]}={}){
  if(!ownerId||!portfolioId||!companyId||start&&!day(start)||end&&!day(end)||start&&end&&end<start)throw Error('Confira a conta, a empresa e o período.');
  const rows=[],unmatched=[];let total=0n,base=0n;
  const unique=new Map(),conflicts=new Set();for(const sale of sales){if(unique.has(sale.id)&&JSON.stringify(unique.get(sale.id))!==JSON.stringify(sale))conflicts.add(sale.id);else unique.set(sale.id,sale);}for(const id of conflicts){unique.delete(id);unmatched.push({saleId:id,reason:'duplicate-sale-conflict'});}
  const scopedRules=rules.filter(r=>r.ownerId===ownerId&&r.portfolioId===portfolioId);
  for(const item of invoiced([...unique.values()],ownerId,timeZone)){
   if(start&&item.date<start||end&&item.date>end)continue;
   try{
    integer(item.amountCents,'Valor faturado');integer(item.returnedCents,'Devolução');integer(item.adjustmentCents,'Estorno');
    if(item.returnedCents+item.adjustmentCents>item.amountCents)throw Error('Ajustes superiores ao faturamento.');
    const previous=snapshots.filter(s=>s.ownerId===ownerId&&s.portfolioId===portfolioId&&s.companyId===companyId&&s.saleId===item.saleId&&s.lineId===item.lineId&&s.productId===item.productId&&s.date===item.date);
    if(previous.length>1)throw Error('Snapshots históricos conflitantes.');
    let rule;if(previous.length){rule=previous[0].rule;integer(rule.rateBps,'Taxa histórica',10000);}else{const selected=ruleFor(scopedRules,item.productId,item.date,companyId);if(!selected.rule)throw Error(selected.reason);rule=selected.rule;}
    if(rule.restrictions)throw Error('conditional-rate-requires-review');
    const net=item.amountCents-item.returnedCents-item.adjustmentCents,commission=(BigInt(net)*BigInt(rule.rateBps)+5000n)/10000n;
    if(total+commission>9000000000000n||base+BigInt(net)>9000000000000n)throw Error('Total acima do limite técnico.');total+=commission;base+=BigInt(net);
    const snapshot={ownerId,portfolioId,companyId,saleId:item.saleId,lineId:item.lineId,productId:item.productId,date:item.date,rule:JSON.parse(JSON.stringify(rule))};
    rows.push({...item,baseCents:net,commissionCents:Number(commission),rateBps:rule.rateBps,snapshot});
   }catch(error){unmatched.push({...item,reason:error.message});}
  }
  return{provisional:true,baseCents:Number(base),totalCents:Number(total),rows,unmatched,notice:'Projeção estimada; não comprova comissão devida nem pagamento.'};
 }
 root.RotaMapaCommissions=Object.freeze({norm,bps,match,stage,ruleFor,invoiced,project});
})(globalThis);

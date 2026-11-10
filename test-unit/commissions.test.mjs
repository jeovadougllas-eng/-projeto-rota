import{test}from'node:test';import assert from'node:assert/strict';
await import('../assets/rotamapa-client-identity.js');await import('../assets/rotamapa-commerce-model.js');await import('../assets/rotamapa-billing-model.js');await import('../assets/rotamapa-buyer-model.js');await import('../assets/rotamapa-commissions-model.js');
const M=RotaMapaCommissions,options={ownerId:'owner',portfolioId:'portfolio',companyId:'company'},rule={...options,id:'rule',productId:'p',rateBps:900,validFrom:'2026-10-01',validTo:null,sourceHash:'a'.repeat(64)};
const line={productId:'p',quantity:1,unitCents:10000,totalCents:10000},sale={id:'s',kind:'sale',status:'confirmed',date:'2026-11-01',lines:[line],totalCents:10000,manualBilling:{version:1,state:'invoiced',method:'owner_confirmation',confirmedBy:'owner',confirmedAt:'2026-11-02T12:00:00Z',totalCents:10000}};
test('only actual invoicing enters projection; orders, cancelled and foreign confirmations are excluded',()=>{
 assert.equal(M.project([sale],[rule],options).totalCents,900);
 for(const value of [{...sale,manualBilling:undefined},{...sale,status:'cancelled'},{...sale,status:'no_sale'},{...sale,manualBilling:{...sale.manualBilling,confirmedBy:'other'}}])assert.equal(M.project([value],[rule],options).totalCents,0);
 assert.equal(M.project([sale],[{...rule,ownerId:'other'}],options).rows.length,0);assert.equal(M.project([sale],[{...rule,portfolioId:'other'}],options).rows.length,0);
});
test('receipt settlements use billed quantities and invoice dates, never original provisional amounts',()=>{
 const pdf={...sale,id:'pdf',manualBilling:undefined,registeredAt:'2026-11-01T12:00:00Z',source:{version:2,receipts:[{stage:'provisional',invoiceDate:'2026-10-31',totalCents:10000}]},settlements:[{receipt:0,state:'invoiced',date:'2026-11-03',items:[{sourceItem:0,quantity:1,unitCents:5000}],totalCents:5000}],lines:[{...line,sourceReceipt:0,sourceItem:0}]};
 assert.equal(M.project([pdf],[rule],options).totalCents,450);assert.equal(M.project([pdf],[rule],{...options,end:'2026-11-02'}).rows.length,0);assert.equal(M.project([{...pdf,settlements:[]}],[rule],options).rows.length,0);
});
test('known returns and reversals reduce the invoice base; half cents round deterministically',()=>{
 const changed={...sale,lines:[{...line,returnedCents:1000,reversalCents:500}]};assert.equal(M.project([changed],[rule],options).baseCents,8500);assert.equal(M.project([changed],[rule],options).totalCents,765);
 const tiny={...sale,totalCents:1,lines:[{...line,unitCents:1,totalCents:1}],manualBilling:{...sale.manualBilling,totalCents:1}};assert.equal(M.project([tiny],[{...rule,rateBps:5000}],options).totalCents,1);
 assert.equal(M.bps('9,25%'),925);for(const v of ['',null,'abc','101%','9.999%','-1%'])assert.throws(()=>M.bps(v));
});
test('historical snapshots preserve their rate and cannot be borrowed from another account or portfolio',()=>{
 const first=M.project([sale],[rule],options),snapshots=first.rows.map(r=>r.snapshot),next={...rule,rateBps:600};assert.equal(M.project([sale],[next],{...options,snapshots}).totalCents,900);assert.equal(M.project([sale],[next],{...options,snapshots:snapshots.map(s=>({...s,portfolioId:'other'}))}).totalCents,600);
 assert.equal(M.project([sale],[{...rule,validTo:'2026-10-31'}],options).rows.length,0);
 assert.equal(M.project([sale],[rule,{...rule,id:'duplicate'}],options).unmatched[0].reason,'ambiguous-rate');
});
test('matching uses exact code or full description, not approximate doses or duplicate catalog codes',()=>{
 const products=[{id:'a',code:'001',name:'Produto 20 mg 30 cápsulas'},{id:'b',code:'002',name:'Produto 40 mg 30 cápsulas'}];assert.equal(M.match({code:'001'},products).product.id,'a');assert.equal(M.match({name:'Produto'},products).reason,'not-found');assert.equal(M.match({name:'Produto 20 mg 30 cápsulas'},products).product.id,'a');assert.equal(M.match({code:'001'},[...products,{id:'c',code:'001'}]).reason,'duplicate-code');
 assert.equal(M.stage([{code:'001',rate:'9%',validFrom:'2026-02-30'}],products,{...options,sourceHash:'a'.repeat(64)})[0].status,'review');
});
test('duplicate sales never double count and conflicting versions require review',()=>{
 assert.equal(M.project([sale,sale],[rule],options).totalCents,900);const r=M.project([sale,{...sale,totalCents:2}],[rule],options);assert.equal(r.rows.length,0);assert.equal(r.unmatched[0].reason,'duplicate-sale-conflict');
});

test('manual invoices preserve the invoice or recorded sale date instead of the later confirmation click',()=>{
 const nearMidnight={...sale,manualBilling:{...sale.manualBilling,confirmedAt:'2026-11-02T01:00:00Z'}};
 assert.equal(M.project([nearMidnight],[rule],options).rows[0].date,'2026-11-01');
 assert.equal(M.project([nearMidnight],[rule],{...options,timeZone:'UTC'}).rows[0].date,'2026-11-01');
 const october={...nearMidnight,date:'2026-10-31'};assert.equal(M.project([october],[rule],{...options,start:'2026-10-01',end:'2026-10-31'}).rows[0].date,'2026-10-31');assert.equal(M.project([{...october,manualBilling:{...october.manualBilling,invoiceDate:'2026-11-01'}}],[rule],options).rows[0].date,'2026-11-01');
 assert.equal(M.match({code:'001',presentation:'40 mg'},[{id:'a',code:'001',name:'Produto',presentation:'20 mg'}]).reason,'presentation-conflict');
});
test('functional names and presentation columns match safe abbreviations without merging doses or pack sizes',()=>{
 const products=[{id:'ped60',code:'A',name:'Allexofedrin Ped. Susp. Oral - 60ml'},{id:'ped150',code:'B',name:'Allexofedrin Ped. Susp. Oral - 150ml'},{id:'cystex',code:'C',name:'Cystex - 24 drágeas'},{id:'dose',code:'D',name:'Produto 20mg - 30 comprimidos'}];
 assert.equal(M.match({name:'Allexofedrin Pediátrico',presentation:'Suspensão Oral 60 ml'},products).product.id,'ped60');assert.equal(M.match({name:'Cystex',presentation:'24 DGR'},products).product.id,'cystex');assert.equal(M.match({name:'Produto 20 mg',presentation:'30 cp'},products).product.id,'dose');
 assert.equal(M.match({code:'A',presentation:'Suspensão Oral 60 ml'},products).product.id,'ped60');assert.equal(M.match({code:'A',presentation:'Suspensão Oral 150 ml'},products).reason,'presentation-conflict');
 for(const entry of [{name:'Allexofedrin Pediátrico'},{name:'Cystex',presentation:'60 drágeas'},{name:'Produto 40mg',presentation:'30cp'}])assert.equal(M.match(entry,products).reason,'not-found');
});

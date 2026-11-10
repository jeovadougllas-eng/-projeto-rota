import test from'node:test';import assert from'node:assert/strict';
await import('../assets/rotamapa-commerce-model.js');await import('../assets/rotamapa-billing-model.js');
const M=RotaMapaCommerceModel,B=RotaMapaBillingModel,p={id:'p',name:'Produto sintético',priceCents:906},s={id:'sale',clientId:'client',status:'confirmed',date:'2026-10-20',lines:[M.line(p,30,null,'2026-10-20')],totalCents:27180},args={owner:'owner',invoiceNumber:'123',date:'2026-10-21',now:Date.parse('2026-11-10T12:00:00Z')};
test('explicit manual invoicing preserves the historical amount and carries the actual invoice date without a PDF',()=>{
 const before=JSON.stringify(s),b=B.manualConfirmation(s,args);assert.equal(b.state,'invoiced');assert.equal(b.invoiceDate,'2026-10-21');assert.equal(b.totalCents,27180);assert.equal(b.confirmedBy,'owner');assert.equal(b.confirmedAt,'2026-11-10T12:00:00.000Z');assert.equal(JSON.stringify(s),before);assert.equal(s.source,undefined);
});
test('cancelled, already invoiced, PDF, future-dated and inconsistent manual confirmations are rejected',()=>{
 for(const changed of [{...s,status:'cancelled'},{...s,source:{}},{...s,manualBilling:{state:'invoiced'}},{...s,totalCents:1}])assert.throws(()=>B.manualConfirmation(changed,args));
 for(const changed of [{...args,date:'2026-11-11'},{...args,date:'2026-02-30'},{...args,invoiceNumber:'a123'},{...args,owner:''}])assert.throws(()=>B.manualConfirmation(s,changed));
});

import test from 'node:test';import assert from 'node:assert/strict';
import {Buyer as M} from '../lib/buyer-insights.mjs';
const month='2026-11',clients=Array.from({length:9},(_,i)=>({id:String(i+1),name:['Comprador A','Comprador B','Comprador C','Comprador D','Comprador E','Comprador F','Zeta zerado','Álfa zerado','Beto zerado'][i],cnpj:String(i+1).padStart(14,'0'),city:i===0?'Natal':'Parnamirim'}));
const catalog=Array.from({length:9},(_,i)=>({id:'p'+i,kind:'product',name:['Produto A 15ml','Produto A 30ml','Produto C','Produto D','Produto E','Produto F','Zeta zerado','Álfa zerado','Beto zerado'][i]}));
const invoice=(i,qty=10)=>({kind:'sale',id:'s'+i,status:'confirmed',date:month+'-01',clientId:String(i+1),totalCents:qty*100,registeredAt:'2026-11-01T12:00:00Z',source:{version:2,receipts:[{stage:'invoiced',totalCents:qty*100}]},lines:[{productId:'p'+i,name:catalog[i].name,sourceReceipt:0,sourceItem:0,quantity:qty,unitCents:100}]});
test('both Top 5 limits, full lists and alphabetical zeros use only invoiced sales',()=>{
 const sales=Array.from({length:6},(_,i)=>invoice(i,60-i*5));const a=M.rankings(clients,sales,catalog,month);assert.equal(a.ranking.length,5);assert.equal(a.productRanking.length,5);assert.equal(a.allClients.length,9);assert.equal(a.allProducts.length,9);assert.deepEqual(a.allClients.slice(6).map(c=>c.name),['Álfa zerado','Beto zerado','Zeta zerado']);assert.deepEqual(a.allProducts.slice(6).map(c=>c.name),['Álfa zerado','Beto zerado','Zeta zerado']);assert.equal(a.summary.totalCents,28500);assert.equal(a.productSummary.totalUnits,285);assert.equal(a.productSummary.top5Units,250);assert.equal(a.summary.top5TotalCents,25000);assert.equal(a.productSummary.remainingUnits,35);
 const empty=M.rankings(clients,[],catalog,month);assert.deepEqual(empty.ranking,[]);assert.equal(empty.allClients[0].name,'Álfa zerado');assert.equal(empty.allProducts[0].name,'Álfa zerado');assert.equal(empty.summary.sharePercent,0);
});
test('mixed distributor receipts count only billed lines and settled quantities, cuts, cancellations, and pending are excluded',()=>{
 const s=invoice(0,10);s.source.receipts.push({stage:'pending',totalCents:90000});s.lines.push({...s.lines[0],productId:'p1',sourceReceipt:1,quantity:900,unitCents:100});s.totalCents+=90000;
 const manual={...invoice(1,999),source:undefined};const cancelled={...invoice(2,999),status:'cancelled'};
 let a=M.rankings(clients,[s,manual,cancelled],catalog,month);assert.equal(a.summary.totalCents,1000);assert.equal(a.productSummary.totalUnits,10);assert.equal(a.allProducts.find(p=>p.productId==='p1').units,0);
 s.settlements=[{receipt:1,state:'invoiced',totalCents:1200,items:[{sourceItem:0,quantity:6,unitCents:200}]}];a=M.rankings(clients,[s],catalog,month);assert.equal(a.summary.totalCents,2200);assert.equal(a.productSummary.totalUnits,16);assert.equal(a.allProducts.find(p=>p.productId==='p1').totalCents,1200);assert.equal(a.summary.totalOrders,1);
 s.settlements[0]={receipt:1,state:'cancelled',totalCents:0};assert.equal(M.rankings(clients,[s],catalog,month).productSummary.totalUnits,10);
});
test('city scope applies before limits and zeros; CNPJ aliases merge and historical products remain distinct by SKU',()=>{
 const copy=structuredClone(clients);copy.push({...copy[0],id:'alias',active:false,name:'Nome antigo'});const a=invoice(0),b={...invoice(0),id:'other',clientId:'alias'};
 const r=M.rankings(copy,[a,b,invoice(1)],catalog,month,{city:'NATAL'});assert.equal(r.allClients.length,1);assert.equal(r.ranking[0].totalCents,2000);assert.deepEqual(r.ranking[0].clientIds,['1','alias']);assert.equal(r.productRanking.length,1);assert.equal(r.productRanking[0].units,20);assert.equal(r.allProducts.find(p=>p.productId==='p1').units,0);
 const archived=M.rankings(clients,[{...invoice(0),lines:[{...invoice(0).lines[0],productId:'archived',name:'Produto antigo 60ml'}]}],catalog,month);assert.equal(archived.allProducts.length,10);assert.equal(archived.productRanking[0].inCurrentCatalog,false);
});
test('owner-confirmed manual invoicing counts real amounts and units without inventing PDF origin',()=>{
 const owner='11111111-1111-4111-8111-111111111111',s={...invoice(0,24),source:undefined};delete s.lines[0].sourceReceipt;delete s.lines[0].sourceItem;
 assert.equal(M.rankings(clients,[s],catalog,month,{ownerId:owner}).summary.totalOrders,0);
 s.manualBilling={version:1,state:'invoiced',method:'owner_confirmation',confirmedBy:owner,confirmedAt:'2026-11-07T12:00:00Z',totalCents:2400};
 const r=M.rankings(clients,[s],catalog,month,{ownerId:owner});assert.equal(r.summary.totalCents,2400);assert.equal(r.summary.totalOrders,1);assert.equal(r.productRanking[0].units,24);assert.equal(s.source,undefined);assert.equal(s.lines[0].sourceReceipt,undefined);
 assert.equal(M.rankings(clients,[s],catalog,month,{ownerId:'another-owner'}).summary.totalOrders,0);
 assert.equal(M.rankings(clients,[{...s,status:'cancelled'}],catalog,month,{ownerId:owner}).summary.totalOrders,0);
 assert.equal(M.rankings(clients,[{...s,manualBilling:{...s.manualBilling,totalCents:2500}}],catalog,month,{ownerId:owner}).summary.totalOrders,0);
 assert.equal(M.rankings(clients,[s],catalog,'2026-10',{ownerId:owner}).summary.totalOrders,0);
 assert.equal(M.rankings(clients,[s],catalog,month).summary.totalOrders,0);
});

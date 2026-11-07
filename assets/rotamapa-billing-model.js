/* Receipt-level billing. Archive is computed from registration time; nothing is deleted. */
(function(root){
'use strict';
const DAY=86400000,clone=x=>JSON.parse(JSON.stringify(x));
function registration(s){const t=Date.parse(s.registeredAt||s.recordedAt);if(!Number.isFinite(t))throw Error('Data de registro do pedido inválida.');return t;}
function settlement(r,value){
 if(!value||!['invoiced','cancelled'].includes(value.state))throw Error('Confira a confirmação do faturamento.');
 if(!root.RotaMapaCommerceModel.day(value.date)||typeof value.note!=='string'||value.note.length>1000||typeof value.invoiceNumber!=='string'||!/^\d{0,30}$/.test(value.invoiceNumber))throw Error('Confira a data, a nota fiscal e as observações.');
 if(value.state==='cancelled'){if(!value.note.trim()||value.items?.length||value.totalCents!==0)throw Error('Informe o motivo do cancelamento.');return value;}
 if(!Array.isArray(value.items)||value.items.length!==r.items.length)throw Error('Confira todas as apresentações do pedido.');
 let total=0;for(const [index,i]of value.items.entries()){const M=root.RotaMapaCommerceModel;M.integer(i.quantity,0,1000000,'Quantidade faturada');M.integer(i.unitCents,0,1000000000,'Preço faturado');if(i.sourceItem!==index)throw Error('A origem do item faturado mudou.');total+=i.quantity*i.unitCents;}
 if(total<1||total>9000000000000||total!==value.totalCents)throw Error('A soma dos itens não fecha com o faturamento.');
 if(value.pdf){const P=root.RotaMapaOrderPdfModel;P.receipt(value.pdf);if(value.pdf.stage!=='invoiced'||value.pdf.orderNumber!==r.orderNumber||value.pdf.cnpj!==r.cnpj||value.pdf.totalCents!==total)throw Error('O PDF atualizado não corresponde a este pedido.');const billed=value.items.filter(i=>i.quantity);if(billed.length!==value.pdf.items.length)throw Error('Os itens diferem do PDF atualizado.');for(const i of billed){const item=value.pdf.items.find(p=>p.ean===r.items[i.sourceItem].ean);if(!item||item.quantity!==i.quantity||item.unitCents!==i.unitCents)throw Error('Os valores diferem do PDF atualizado.');}}
 return value;
}
function validate(s){
 if(s.source?.version!==2)return s;if(!Array.isArray(s.settlements||[]))throw Error('Confirmações inválidas.');registration(s);const seen=new Set();
 for(const value of s.settlements||[]){if(!Number.isInteger(value.receipt)||value.receipt<0||value.receipt>=s.source.receipts.length||seen.has(value.receipt))throw Error('Pedido de origem repetido ou inválido.');seen.add(value.receipt);const r=s.source.receipts[value.receipt];if(r.stage==='invoiced')throw Error('Este PDF já foi importado faturado.');settlement(r,value);}
 return s;
}
function receipts(s,now=Date.now()){
 if(s.status!=='confirmed')return [];if(!s.source?.receipts)return [{state:'declared',amountCents:s.totalCents,sale:s}];
 if(s.source.version!==2)return s.source.receipts.map((r,index)=>({index,receipt:r,state:'invoiced',amountCents:r.totalCents,sale:s}));
 const started=registration(s),deadline=started+7*DAY;
 return s.source.receipts.map((r,index)=>{const v=(s.settlements||[]).find(v=>v.receipt===index),state=v?.state||(r.stage==='invoiced'?'invoiced':now>=deadline?'archived':'pending');return {index,receipt:r,settlement:v,state,deadline,daysLeft:Math.max(0,Math.ceil((deadline-now)/DAY)),ageDays:Math.max(0,Math.floor((now-started)/DAY)),amountCents:state==='cancelled'?0:v?.totalCents??r.totalCents,sale:s};});
}
function amounts(s,now=Date.now()){const rows=receipts(s,now),sum=state=>rows.filter(r=>state.includes(r.state)).reduce((n,r)=>n+r.amountCents,0),confirmedCents=sum(['invoiced','declared']),pendingCents=sum(['pending']);return {confirmedCents,pendingCents,archivedCents:sum(['archived']),provisionalCents:confirmedCents+pendingCents,hasConfirmed:rows.some(r=>['invoiced','declared'].includes(r.state)&&r.amountCents>0)};}
function hasOrderInMonth(s,month){if(s.status!=='confirmed'||s.date?.slice(0,7)!==month)return false;return receipts(s).some(r=>r.state!=='cancelled');}
function exportSales(sales,now=Date.now()){
 return sales.map(s=>{const a=amounts(s,now);if(!s.source||s.source.version!==2)return {...clone(s),...a};const rows=receipts(s,now);const lines=s.lines.map(l=>{const row=rows[l.sourceReceipt],v=row?.settlement?.items[l.sourceItem],counted=['invoiced','declared'].includes(row?.state),quantity=v?.quantity??l.quantity,unitCents=v?.unitCents??l.unitCents;return {...l,quantity,unitCents,totalCents:quantity*unitCents,billingState:row?.state,originalQuantity:l.quantity,originalUnitCents:l.unitCents,label:row?.settlement?'Faturamento conferido':l.label,discountBps:row?.settlement?Math.max(0,Math.round((l.tableUnitCents-unitCents)*10000/l.tableUnitCents)):l.discountBps,countedInBilled:counted};});return {...clone(s),...a,originalTotalCents:s.totalCents,totalCents:a.confirmedCents,lines,billingRows:rows.map(r=>({order:r.receipt?.orderNumber,state:r.state,amountCents:r.amountCents,deadline:new Date(r.deadline).toISOString()}))};});
}
root.RotaMapaBillingModel={DAY,registration,settlement,validate,receipts,amounts,hasOrderInMonth,exportSales};
})(globalThis);

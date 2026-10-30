/* Money is integer BRL cents. Discounts are basis points (1% = 100). */
(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
function integer(n,min,max,label){if(!Number.isSafeInteger(n)||n<min||n>max)throw Error(label+' inválido.');return n;}
function decimal(text,scale,label){const s=String(text??'').trim().replace(',','.');if(!/^\d+(\.\d{1,2})?$/.test(s))throw Error('Informe '+label+' com até duas casas decimais.');const [a,b='']=s.split('.');return integer(Number(a)*scale+Number(b.padEnd(2,'0')),0,1000000000,label);}
const money=s=>decimal(s,100,'o preço');
const percent=s=>integer(decimal(s,100,'o desconto'),0,10000,'Desconto');
const brl=cents=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
const day=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
function tiers(input){
 if(!Array.isArray(input)||input.length<1||input.length>3)throw Error('Cadastre de uma a três faixas.');
 const direct=input[0]?.unitPriceCents!==undefined;
 const rows=input.map((r,i)=>{if((r.unitPriceCents!==undefined)!==direct)throw Error('Use o mesmo modo de cálculo em todas as faixas.');return {label:input.length===1?'Faixa única':'Faixa '+(i+1),minQty:integer(r.minQty,1,1000000,'Quantidade mínima'),discountBps:direct?0:integer(r.discountBps,0,10000,'Desconto'),...(direct?{unitPriceCents:integer(r.unitPriceCents,1,1000000000,'Preço unitário da faixa')}: {})};});
 for(let i=1;i<rows.length;i++)if(rows[i].minQty<=rows[i-1].minQty||(direct?rows[i].unitPriceCents>rows[i-1].unitPriceCents:rows[i].discountBps<rows[i-1].discountBps))throw Error('As faixas devem ter mínimos crescentes e preços que não aumentem ou descontos que não diminuam.');return rows;
}
function product(p){if(!p?.id||!String(p.name||'').trim()||p.name.length>160)throw Error('Informe o nome e a apresentação do produto.');integer(p.priceCents,1,1000000000,'Preço de tabela');return {...clone(p),name:p.name.trim()};}
function campaign(c){if(!c?.id||!c.productId||!String(c.name||'').trim()||c.name.length>160||!['dia_d','acelera'].includes(c.type)||!day(c.startDate)||!day(c.endDate)||c.endDate<c.startDate)throw Error('Confira o produto, a campanha e a validade.');if(c.type==='dia_d'&&c.startDate!==c.endDate)throw Error('O Dia D vale por uma única data.');if(c.type==='acelera'&&(c.startDate.slice(0,7)!==c.endDate.slice(0,7)||!c.startDate.endsWith('-01')||new Date(Date.parse(c.endDate+'T12:00:00Z')+86400000).getUTCDate()!==1))throw Error('O Acelera Sellout deve cobrir o mês completo.');return {...clone(c),name:c.name.trim(),tiers:tiers(c.tiers)};}
function line(p,quantity,c,date){product(p);integer(quantity,1,1000000,'Quantidade comprada');if(!day(date))throw Error('Data da venda inválida.');let chosen={label:'Preço de tabela',minQty:0,discountBps:0};if(c){c=campaign(c);if(c.productId!==p.id)throw Error('A campanha pertence a outra apresentação.');if(date<c.startDate||date>c.endDate)throw Error('Campanha fora da validade para a data da venda.');for(const t of c.tiers)if(quantity>=t.minQty)chosen=t;}
 if(c?.tiers.some(t=>t.unitPriceCents!==undefined&&t.unitPriceCents>p.priceCents))throw Error('O preço da faixa não pode superar o preço de tabela. Confira as condições.');
 const unitCents=chosen.unitPriceCents??Number((BigInt(p.priceCents)*BigInt(10000-chosen.discountBps)+5000n)/10000n),discountBps=chosen.unitPriceCents===undefined?chosen.discountBps:Number((BigInt(p.priceCents-unitCents)*10000n+BigInt(p.priceCents)/2n)/BigInt(p.priceCents)),totalCents=unitCents*quantity;integer(totalCents,0,9000000000000,'Total');return {productId:p.id,code:p.code||'',name:p.name,quantity,tableUnitCents:p.priceCents,...chosen,discountBps,unitCents,totalCents,campaign:c?clone(c):null};}
function sale(s){if(!s?.id||!String(s.clientId||'').trim()||!day(s.date)||!['confirmed','cancelled','no_sale','deferred'].includes(s.status))throw Error('Dados da venda inválidos.');if(!Array.isArray(s.lines)||s.lines.length>100)throw Error('Pedido inválido.');if(['no_sale','deferred'].includes(s.status)){if(s.lines.length||s.totalCents!==0)throw Error('Um registro sem venda não pode ter valores.');return clone(s);}
 if(!s.lines.length)throw Error('Adicione ao menos um produto.');let total=0;const ids=new Set();for(const l of s.lines){if(ids.has(l.productId))throw Error('Cada apresentação deve ocupar uma única linha. Edite a quantidade da linha existente.');ids.add(l.productId);const expected=line({id:l.productId,name:l.name,code:l.code,priceCents:l.tableUnitCents},l.quantity,l.campaign,s.date);for(const k of ['discountBps','minQty','unitCents','totalCents','label','unitPriceCents'])if(l[k]!==expected[k])throw Error('O cálculo foi alterado. Aplique o desconto novamente.');total+=l.totalCents;}
 integer(total,0,9000000000000,'Total');if(total!==s.totalCents)throw Error('O total não corresponde aos produtos.');return clone(s);}
function validate(kind,value){if(kind==='product')return product(value);if(kind==='campaign')return campaign(value);if(kind==='sale')return sale(value);throw Error('Tipo de registro inválido.');}
function summary(sales){const confirmed=sales.filter(s=>s.status==='confirmed');return {orders:confirmed.length,clients:new Set(confirmed.map(s=>s.clientId)).size,totalCents:confirmed.reduce((sum,s)=>sum+s.totalCents,0),units:confirmed.reduce((sum,s)=>sum+s.lines.reduce((n,l)=>n+l.quantity,0),0)};}
root.RotaMapaCommerceModel={integer,money,percent,brl,day,tiers,product,campaign,line,sale,validate,summary};
})(globalThis);

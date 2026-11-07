import {prepare,ready} from './browser.js';
import {accountFixture,accountOwner} from './account.js';
import {commerceFixture,productId} from './commerce.js';
import '../../assets/rotamapa-commerce-model.js';
import '../../assets/rotamapa-order-pdf-model.js';
import {createHandler} from '../../lib/buyer-insights.mjs';
export const portfolio='00000000-0000-4000-8000-000000000000';
export const month=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Fortaleza'}).slice(0,7);
const names=['Farmácia Horizonte LTDA','Drogaria Boa Vida LTDA','Farmácia Nova Esperança LTDA','Drogaria Viva Saúde LTDA','Farmácia Bem Cuidar LTDA','Drogaria Costa Verde LTDA','Farmácia Central do Sol LTDA','Drogaria Cuidar Mais LTDA','Farmácia Saúde Plena LTDA','Drogaria Jardim das Flores LTDA'];
export const records=Array.from({length:20},(_,i)=>({id:String(i+1),name:names[i]||'Comprador regional '+(i+1),cnpj:String(i+1).padStart(14,'0'),city:i===2||i===6||i>=9?'Parnamirim':'Natal',state:'RN',neighborhood:'Lagoa Nova',priority:2,lat:null,lon:null}));
const values=[840000,690000,570000,415000,365000,320000,280000,235000,195000,160000,...Array(10).fill(143000)],counts=[6,5,4,4,3,3,3,2,2,1,...Array(10).fill(1)];
export const sales=[];for(let i=0;i<20;i++){let remaining=values[i];for(let j=0;j<counts[i];j++){const amount=j===counts[i]-1?remaining:Math.floor(values[i]/counts[i]);remaining-=amount;const id='20000000-0000-4000-8000-'+String(sales.length+1).padStart(12,'0');sales.push({id,kind:'sale',clientId:String(i+1),clientName:records[i].name,date:month+'-01',status:'confirmed',totalCents:amount,lines:[{productId,name:'Produto de teste',code:'TESTE',quantity:1,tableUnitCents:amount,unitCents:amount,totalCents:amount,label:'Preço de tabela',minQty:0,discountBps:0,campaign:null}],recordedAt:month+'-01T12:00:00Z',notes:'',routeId:null,visitId:null});}}
export const catalog=Array.from({length:8},(_,i)=>({id:'10000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),kind:'product',name:['Secrelise XPE - 120ml','Naridrin 12H - 30ml','Infralax - 15 comprimidos','Apevitin BC XPE - 240ml','Cystex - 24 drágeas','Sominex - 20 comprimidos','Zerado Zeta - 30 comprimidos','Álfa zerado XPE - 120ml'][i],priceCents:1000000,code:String(i+1).padStart(13,'0')}));
for(const [i,s]of sales.entries()){
 const p=catalog[i%6],item={itemNumber:1,ean:p.code,description:p.name,quantity:1,unitCents:s.totalCents,totalCents:s.totalCents};
 const receipt={provider:'mercado_farma',orderNumber:String(900000+i),externalOrder:'',invoiceNumber:'',cnpj:records[Number(s.clientId)-1].cnpj,invoiceDate:s.date,requestDate:s.date,documentStatus:'FATURADO',stage:'invoiced',basis:'invoiced',totalCents:s.totalCents,requestedTotalCents:s.totalCents,attendedTotalCents:s.totalCents,items:[item],sha256:i.toString(16).padStart(64,'0'),fileName:'sintetico.pdf',distributor:'Acripel'};
 s.source=RotaMapaOrderPdfModel.combine([receipt]);s.lines=[RotaMapaOrderPdfModel.line(p,item,0,0,receipt)];s.registeredAt=s.recordedAt;
}
export async function setupRanking(page,{plan='pro',hold=false}={}){
 await prepare(page,{records,lockAuthFixture:true});await accountFixture(page,{plan,photo:false});await commerceFixture(page);
 await page.addInitScript(({sales,catalog,owner,portfolio})=>{
  const base=window.supabase.createClient;window.supabase.createClient=(...args)=>{const client=base(...args),get=client.auth.getSession;client.auth.getSession=async()=>{const r=await get();if(r.data.session)r.data.session.access_token='synthetic';return r;};return client;};
  if(!localStorage.getItem('__ranking_seed')){const cloud=JSON.parse(localStorage.getItem('__commerce_cloud')||'[]');cloud.splice(0,cloud.length,...catalog.map(p=>({id:p.id,kind:'product',user_id:owner,portfolio_id:portfolio,data:p,revision:1})));cloud.push(...sales.map(s=>({id:s.id,kind:'sale',user_id:owner,portfolio_id:portfolio,data:s,revision:1})));localStorage.setItem('__commerce_cloud',JSON.stringify(cloud));localStorage.setItem('__ranking_seed','yes');}
 },{sales,catalog,owner:accountOwner,portfolio});
 const requests=[],dbCalls=[];let release=null;let liveSales=structuredClone(sales);
 const handler=createHandler(async(url,options)=>{dbCalls.push({url,headers:options.headers});let data;if(url.includes('/auth/'))data={id:accountOwner,is_anonymous:false};else if(url.includes('/rpc/'))data={plan};else if(url.includes('/rest/v1/clients?'))data=records.map(c=>({local_id:c.id,data:c,deleted_at:null}));else if(url.includes('/rest/v1/rotamapa_commerce_items?')){const q=new URL(url).searchParams;if(q.get('kind')==='eq.product')return {ok:true,json:async()=>catalog.map(p=>({id:p.id,data:p}))};const from=q.get('data->>date').slice(4),to=q.getAll('data->>date')[1].slice(3);data=liveSales.filter(s=>s.date>=from&&s.date<to).map(s=>({id:s.id,data:s}));}else throw Error('Unexpected endpoint');return{ok:true,json:async()=>data};});
 await page.route('**/api/buyer-insights',async route=>{const body=route.request().postDataJSON();requests.push(body);if(hold)await new Promise(resolve=>release=resolve);const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(v){this.value=v;return this;},end(){return this;}};await handler({method:'POST',headers:{...route.request().headers(),origin:'https://traxio-preview.vercel.app'},body},res);await route.fulfill({status:res.code,json:res.value});});
 if(process.env.TRAXELO_PWA_BASE)await page.route(process.env.TRAXELO_PWA_BASE+'/**',async route=>{if(new URL(route.request().url()).pathname==='/api/buyer-insights')await route.fallback();else await route.continue();});
 await ready(page);await page.waitForFunction(()=>!!window.TraxeloPlans?.can('ranking')||document.getElementById('workspacePlanStatus')?.textContent.includes('Essencial'));
 return{requests,dbCalls,setSales:value=>{liveSales=structuredClone(value);},release:()=>release?.()};
}

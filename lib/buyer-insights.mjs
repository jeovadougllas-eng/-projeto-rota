import '../assets/rotamapa-product-photos.js';
import '../assets/rotamapa-product-identity.js';
import '../assets/rotamapa-bussola-model.js';
import '../assets/rotamapa-client-identity.js';
import '../assets/traxio-planner.js';
import '../assets/rotamapa-commerce-model.js';
import '../assets/rotamapa-billing-model.js';
import '../assets/rotamapa-buyer-model.js';
export const Buyer=globalThis.RotaMapaBuyerModel;
const AUTH='https://ggsptbcgpdakxsdjrldd.supabase.co',KEY='sb_publishable_n0MBYWwtja-mxyrzGJ-yVA_otDB8Kwn';
const origins=['https://traxio-preview.vercel.app','https://localhost','capacitor://localhost','http://localhost'];
function permittedOrigin(origin){return origins.includes(origin)||(process.env.VERCEL_ENV==='preview'&&/^[a-z0-9-]+\.vercel\.app$/.test(process.env.VERCEL_URL||'')&&origin==='https://'+process.env.VERCEL_URL);}
export function createHandler(fetcher=fetch){return async(req,res)=>{
 const origin=req.headers.origin;res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(permittedOrigin(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type, x-rotamapa-portfolio');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');res.setHeader('Vary','Origin');}
 const fail=(status,error)=>res.status(status).json({error});
 if(origin&&!permittedOrigin(origin))return fail(403,'Origem não permitida.');
 if(req.method==='OPTIONS')return res.status(204).end();if(req.method!=='POST')return fail(405,'Método não permitido.');
 const authorization=req.headers.authorization||'',portfolio=req.headers['x-rotamapa-portfolio'];
 if(!/^Bearer \S+$/.test(authorization))return fail(401,'Entre na sua conta.');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(portfolio||''))return fail(400,'Selecione uma carteira válida.');
 let body,dates;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;if(!body||JSON.stringify(body).length>2048||!['ranking','potential'].includes(body.mode)||body.city!=null&&(typeof body.city!=='string'||body.city.length>85))throw Error();dates=Buyer.months(body.month);const current=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Fortaleza'}).slice(0,7);if(body.month>current||body.mode==='potential'&&body.month!==current)throw Error();}catch{return fail(400,'Confira o mês, a cidade e o tipo de análise. Potencial usa o mês atual.');}
 const headers={Authorization:authorization,apikey:KEY,'x-rotamapa-portfolio':portfolio};
 const read=async(path,options={})=>{const r=await fetcher(AUTH+path,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(15000),redirect:'error'});if(!r.ok){const e=Error('Falha ao consultar os dados.');e.status=r.status;throw e;}return r.json();};
 try{
  const user=await read('/auth/v1/user');if(!user.id||user.is_anonymous)return fail(401,'Entre com uma conta cadastrada.');
  const plan=await read('/rest/v1/rpc/traxelo_plan_access',{method:'POST',body:'{}',headers:{'Content-Type':'application/json'}});
  if(!(body.mode==='ranking'?['plus','pro']:['pro']).includes(plan.plan))return fail(403,body.mode==='ranking'?'Ranking disponível nos planos Plus e Pro.':'Potencial de compra disponível no plano Pro.');
  const all=async(table,query)=>{const rows=[];for(let offset=0;offset<50000;offset+=500){const batch=await read('/rest/v1/'+table+'?'+query+'&limit=500&offset='+offset);if(!Array.isArray(batch))throw Error('Resposta inválida.');rows.push(...batch);if(batch.length<500)return rows;}throw Error('A base excede o limite desta análise. Reduza o período ou procure o suporte.');};
  const scope='user_id=eq.'+encodeURIComponent(user.id)+'&portfolio_id=eq.'+encodeURIComponent(portfolio);
  const [clients,sales,catalog]=await Promise.all([all('clients',scope+'&select=local_id,data,deleted_at&order=local_id.asc'),all('rotamapa_commerce_items',scope+'&kind=eq.sale&'+(body.mode==='ranking'?'or=(and(data->>date.gte.'+dates.start+',data->>date.lt.'+dates.end+'),and(data->bussola->>invoiceDate.gte.'+dates.start+',data->bussola->>invoiceDate.lt.'+dates.end+'))':'data->>date=gte.'+dates.historyStart+'&data->>date=lt.'+dates.end)+'&select=id,data&order=id.asc'),body.mode==='ranking'?all('rotamapa_commerce_items',scope+'&kind=eq.product&select=id,data&order=id.asc'):Promise.resolve([])]);
  const records=clients.map(r=>({...r.data,id:r.local_id,...(r.deleted_at?{active:false,deleted_at:r.deleted_at}:{})}));
  const data=body.mode==='ranking'?Buyer.rankings(records,sales.map(r=>r.data),catalog.map(r=>({...r.data,id:r.id})),body.month,{city:body.city,ownerId:user.id}):Buyer.analyze(records,sales.map(r=>r.data),body.month);
  if(body.mode==='potential')for(const key of ['ranking','summary','cities','filterCity'])delete data[key];
  return res.status(200).json({...data,checkedAt:new Date().toISOString(),portfolio,mode:body.mode});
 }catch(e){return fail(e.status===401?401:e.status===403?403:502,e.status===401?'Sua sessão expirou. Entre novamente.':'Não foi possível concluir a análise. Confira a sincronização e tente novamente.');}
};}

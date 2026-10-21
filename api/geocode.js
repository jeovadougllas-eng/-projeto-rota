// Optional Geoapify integration. The provider key stays on the server.
const budgets=new Map();
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const origin=req.headers.origin;if(['https://localhost','capacitor://localhost','http://localhost'].includes(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');}
 if(req.method==='OPTIONS')return res.status(204).end();
 const reply=(status,error)=>res.status(status).json({error});
 if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(405,'Método não permitido');}
 if(!process.env.GEOAPIFY_API_KEY)return reply(503,'Provedor adicional não configurado');
 const authorization=req.headers.authorization||'';
 if(!/^Bearer \S+$/.test(authorization))return reply(401,'Entre na sua conta');
 try{
  const auth=await fetch('https://ggsptbcgpdakxsdjrldd.supabase.co/auth/v1/user',{headers:{Authorization:authorization,apikey:'sb_publishable_n0MBYWwtja-mxyrzGJ-yVA_otDB8Kwn'},signal:AbortSignal.timeout(8000)});
  if(!auth.ok)return reply(401,'Sessão inválida');const user=await auth.json();if(!user.id)return reply(401,'Sessão inválida');
  let q=req.body;try{if(typeof q==='string')q=JSON.parse(q);}catch{return reply(400,'Endereço inválido');}
  if(!q||['street','house','city','district','state','zip'].some(k=>q[k]!=null&&(typeof q[k]!=='string'||q[k].length>250))||!q.street||!q.city)return reply(400,'Informe rua e cidade');
  const now=Date.now();for(const [id,b] of budgets)if(now-b.at>60000)budgets.delete(id);
  const budget=budgets.get(user.id)||{at:now,count:0};if(++budget.count>30)return reply(429,'Aguarde antes de consultar novamente');budgets.set(user.id,budget);
  const url=new URL('https://api.geoapify.com/v1/geocode/search');
  for(const [k,v] of Object.entries({street:q.street,housenumber:q.house,city:q.city,state:q.state,postcode:q.zip,country:'Brazil',filter:'countrycode:br',limit:'5',format:'geojson',apiKey:process.env.GEOAPIFY_API_KEY}))if(v)url.searchParams.set(k,v);
  const response=await fetch(url,{signal:AbortSignal.timeout(12000)});
  if(!response.ok)return reply(response.status===429?429:502,'Provedor temporariamente indisponível');
  return res.status(200).json(await response.json());
 }catch{return reply(502,'Falha na consulta. Tente novamente.');}
}

import {validateQuery,compareProvider,combine} from '../lib/geolocation-benchmark.mjs';
const users=new Map();
const AUTH='https://ggsptbcgpdakxsdjrldd.supabase.co';
const PUBLIC_KEY='sb_publishable_n0MBYWwtja-mxyrzGJ-yVA_otDB8Kwn';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const configured={geoapify:!!process.env.GEO_BENCH_GEOAPIFY_KEY,tomtom:!!process.env.GEO_BENCH_TOMTOM_KEY};
 if(req.method==='GET')return res.status(200).json({readOnly:true,configured});
 const error=(code,message)=>res.status(code).json({error:message});
 if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return error(405,'Método não permitido.');}
 if(req.headers.origin&&!['https://traxio-preview.vercel.app','http://127.0.0.1:4173'].includes(req.headers.origin))return error(403,'Origem não permitida.');
 const authorization=req.headers.authorization||'';if(!/^Bearer \S+$/.test(authorization))return error(401,'Entre na sua conta do aplicativo.');
 let q;try{const body=typeof req.body==='string'?JSON.parse(req.body):req.body;if(JSON.stringify(body||{}).length>4096)throw Error('Endereço muito longo.');q=validateQuery(body);}catch(e){return error(400,e.message);}
 let user;
 try{const r=await fetch(AUTH+'/auth/v1/user',{headers:{Authorization:authorization,apikey:PUBLIC_KEY},signal:AbortSignal.timeout(8000),redirect:'error'});if(!r.ok)return error(401,'Sessão inválida ou expirada.');user=await r.json();if(!user.id||user.is_anonymous)return error(401,'Entre com sua conta cadastrada.');}catch{return error(502,'Não foi possível validar sua sessão. Tente novamente.');}
 const now=Date.now();for(const [id,b]of users)if(now-b.started>3600000)users.delete(id);
 const budget=users.get(user.id)||{started:now,minute:now,minuteCount:0,total:0};
 if(now-budget.minute>=60000){budget.minute=now;budget.minuteCount=0;}
 // Per-instance abuse guard, not a durable account-wide billing cap. Browser also runs sequentially.
 if(budget.minuteCount>=30||budget.total>=320){res.setHeader('Retry-After','60');return error(429,'Limite do teste atingido. Aguarde antes de continuar.');}
 if(!configured.geoapify||!configured.tomtom)return error(503,'Configure as duas chaves de comparação e publique uma nova versão.');
 budget.minuteCount++;budget.total++;users.set(user.id,budget);
 const [geoapify,tomtom]=await Promise.all([compareProvider('geoapify',q,process.env.GEO_BENCH_GEOAPIFY_KEY),compareProvider('tomtom',q,process.env.GEO_BENCH_TOMTOM_KEY)]);
 return res.status(200).json({readOnly:true,query:q,checkedAt:new Date().toISOString(),results:{geoapify,tomtom},combined:combine({geoapify,tomtom})});
}

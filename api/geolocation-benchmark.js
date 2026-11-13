import {randomUUID} from 'node:crypto';
import {validateQuery,compareProvider,combine} from '../lib/geolocation-benchmark.mjs';
const users=new Map();
const nativeOrigins=['https://localhost','capacitor://localhost','http://localhost'];
const AUTH='https://ggsptbcgpdakxsdjrldd.supabase.co';
const PUBLIC_KEY='sb_publishable_n0MBYWwtja-mxyrzGJ-yVA_otDB8Kwn';
export default async function handler(req,res){
 const origin=req.headers.origin,requestId=randomUUID(),started=Date.now();res.setHeader('X-Traxelo-Request-Id',requestId);
 if(nativeOrigins.includes(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Vary','Origin');res.setHeader('Access-Control-Expose-Headers','X-Traxelo-Request-Id, Retry-After');}
 if(req.method==='OPTIONS')return nativeOrigins.includes(origin)?res.status(204).end():res.status(403).end();
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const configured={geoapify:!!process.env.GEO_BENCH_GEOAPIFY_KEY,tomtom:!!process.env.GEO_BENCH_TOMTOM_KEY};
 if(req.method==='GET')return res.status(200).json({readOnly:true,configured});
 const error=(status,message,code='service')=>{console.warn(JSON.stringify({event:'geolocation_failure',requestId,status,code,elapsedMs:Date.now()-started}));return res.status(status).json({error:message,code,requestId});};
 if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return error(405,'Método não permitido.');}
 if(req.headers.origin&&!['https://traxio-preview.vercel.app','http://127.0.0.1:4173',...nativeOrigins].includes(req.headers.origin))return error(403,'Origem não permitida.','origin');
 const authorization=req.headers.authorization||'';if(!/^Bearer \S+$/.test(authorization))return error(401,'Entre na sua conta do aplicativo.','session');
 let q;try{const body=typeof req.body==='string'?JSON.parse(req.body):req.body;if(JSON.stringify(body||{}).length>4096)throw Error('Endereço muito longo.');q=validateQuery(body);}catch(e){return error(400,e.message,'invalid_query');}
 let user;
 try{const r=await fetch(AUTH+'/auth/v1/user',{headers:{Authorization:authorization,apikey:PUBLIC_KEY},signal:AbortSignal.timeout(8000),redirect:'error'});if(!r.ok)return r.status>=500?error(502,'Não foi possível validar sua sessão. Tente novamente.','auth_unavailable'):error(401,'Sessão inválida ou expirada.','session');user=await r.json();if(!user.id||user.is_anonymous)return error(401,'Entre com sua conta cadastrada.','session');}catch{return error(502,'Não foi possível validar sua sessão. Tente novamente.','auth_unavailable');}
 const now=Date.now();for(const [id,b]of users)if(now-b.started>3600000)users.delete(id);
 const budget=users.get(user.id)||{started:now,minute:now,minuteCount:0,total:0};
 if(now-budget.minute>=60000){budget.minute=now;budget.minuteCount=0;}
 // Per-instance abuse guard, not a durable account-wide billing cap. Browser also runs sequentially.
 if(budget.minuteCount>=30||budget.total>=320){res.setHeader('Retry-After','60');return error(429,'Limite do teste atingido. Aguarde antes de continuar.','quota');}
 if(!configured.geoapify||!configured.tomtom)return error(503,'Configure as duas chaves de comparação e publique uma nova versão.','configuration');
 budget.minuteCount++;budget.total++;users.set(user.id,budget);
 try{const [geoapify,tomtom]=await Promise.all([compareProvider('geoapify',q,process.env.GEO_BENCH_GEOAPIFY_KEY),compareProvider('tomtom',q,process.env.GEO_BENCH_TOMTOM_KEY)]);
 const summary=Object.fromEntries(Object.entries({geoapify,tomtom}).map(([name,p])=>[name,{status:p.status,attempts:p.attempts.map(a=>({method:a.method,status:a.status,httpStatus:a.httpStatus,code:a.code}))}]));console.info(JSON.stringify({event:'geolocation_result',requestId,elapsedMs:Date.now()-started,providers:summary}));
 return res.status(200).json({readOnly:true,requestId,query:q,checkedAt:new Date().toISOString(),results:{geoapify,tomtom},combined:combine({geoapify,tomtom})});}catch{return error(502,'Falha temporária na consulta dos provedores.','providers_unavailable');}
}

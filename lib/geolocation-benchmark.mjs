// Read-only comparison. Never imported by normal geocoding or customer synchronization.
import '../assets/traxio-geolocation.js';
const Geo=globalThis.TraxioGeo;
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const clean=v=>String(v??'').trim();
export function validateQuery(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Endereço inválido.');
 const query={};
 for(const key of ['name','street','house','city','district','state','zip']){
  const v=value[key]??'';if(typeof v!=='string'||v.length>250)throw Error('Campos inválidos ou muito longos.');query[key]=clean(v);
 }
 query.zip=query.zip.replace(/\D/g,'');
 if(query.street.length<3||query.city.length<2)throw Error('Informe logradouro e município.');
 if(query.zip&&query.zip.length!==8)throw Error('CEP deve conter 8 dígitos.');
 return query;
}
export function tomtomCandidates(data,method){
 if(!Array.isArray(data.results))throw Error('Formato inesperado do TomTom.');
 return data.results.slice(0,5).map(p=>{
  const a=p.address||{},xy=p.position?.coordinates||[];
  return {lat:xy[1],lon:xy[0],street:a.street||'',house:a.houseNumber||'',city:a.municipality||'',district:a.municipalitySubdivision||'',state:Geo.stateCode(a.countrySubdivisionCodeIso?.split('-').at(-1)||a.countrySubdivision),zip:a.postalCode||'',country:a.countryCodeIso2||'',name:method==='name'?p.title||'':'',label:p.title||[a.street,a.houseNumber,a.municipality].filter(Boolean).join(', '),provider:'tomtom',method,interpolated:!['address','poi'].includes(p.type),precisionEvidence:p.type==='address'?'address_record':p.type==='poi'?'poi_record':'approximate',attribution:'© TomTom'};
 });
}
export function geoapifyCandidates(data,method){
 if(!Array.isArray(data.features))throw Error('Formato inesperado do Geoapify.');
 return Geo.geoapify(data).slice(0,5).map((p,i)=>({...p,method,name:method==='name'?data.features[i].properties?.name||'':'',precisionEvidence:p.interpolated?'approximate':'building_record'}));
}
export function classify(candidates,q){
 candidates=candidates.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180&&!(p.lat===0&&p.lon===0));
 const ranked=Geo.rank(candidates,q);
 if(!candidates.length)return {status:'not_found',reason:'Nenhum resultado retornado.',candidates:[]};
 if(!ranked.best)return {status:'review',reason:'Os resultados não correspondem ao logradouro e município cadastrados.',candidates};
 const best=ranked.best;
 const regionOK=!!q.state&&Geo.stateCode(q.state)===Geo.stateCode(best.state);
 const nameOK=best.method!=='name'||!!q.name&&norm(best.name)===norm(q.name);
 // Even compatible address records are candidates, not surveyed entrance coordinates.
 const compatible=ranked.status==='matched'&&regionOK&&nameOK;
 return {status:compatible?'compatible':'review',reason:compatible?'Rua, número, município e UF compatíveis. A precisão física ainda não foi aferida.':!regionOK?'UF ausente ou diferente; exige conferência.':!nameOK?'Nome comercial não coincide exatamente; exige conferência.':ranked.reason,candidates:ranked.candidates.length?ranked.candidates:candidates,best};
}
export function combine(results){
 const points=Object.values(results).filter(r=>r.status==='compatible').map(r=>r.best);
 if(points.length>1&&Geo.meters(points[0],points[1])>60)return 'conflict';
 return points.length?'compatible':'review';
}
export async function compareProvider(provider,q,key,fetcher=fetch){
 const isTom=provider==='tomtom';let count=0;const attempts=[];let all=[];
 const call=async(method)=>{
  count++;let url,options={signal:AbortSignal.timeout(10000),redirect:'error'};
  if(isTom){
   const headers={'TomTom-Api-Key':key,'TomTom-Api-Version':method==='name'?'3':'2',Attributes:'results(type,title,position,address)', 'Accept-Language':'pt-BR'};
   const address=[q.street,q.house,q.district,q.city,q.state,q.zip,'Brasil'].filter(Boolean).join(', ');
   if(method==='address'){
    url=new URL('https://api.tomtom.com/maps/orbis/places/geocode');url.searchParams.set('query',address);url.searchParams.set('countryCodesIso2','BR');url.searchParams.set('maxResults','5');options={...options,headers};
   }else{
    url=new URL('https://api.tomtom.com/maps/orbis/places/discover');options={...options,method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({query:[q.name,address].join(', '),filters:{countryCodesIso2:['BR'],types:['poi']},maxResults:5})};
   }
  }else{
   url=new URL('https://api.geoapify.com/v1/geocode/search');
   const params=method==='address'?{street:q.street,housenumber:q.house,city:q.city,state:q.state,postcode:q.zip}:{text:[q.name,q.street,q.house,q.district,q.city,q.state,q.zip,'Brasil'].filter(Boolean).join(', ')};
   for(const [k,v]of Object.entries({...params,country:'Brazil',filter:'countrycode:br',limit:'5',format:'geojson',apiKey:key}))if(v)url.searchParams.set(k,v);
  }
  try{
   const response=await fetcher(url,options);
   if(!response.ok){attempts.push({method,status:'error',httpStatus:response.status,code:[401,403].includes(response.status)?'permission':response.status===429?'quota':response.status>=500?'upstream':'provider_request'});return;}
   const data=await response.json();all.push(...(isTom?tomtomCandidates(data,method):geoapifyCandidates(data,method)));attempts.push({method,status:'ok'});
  }catch(e){attempts.push({method,status:'error',code:e.name==='TimeoutError'?'timeout':e.name==='SyntaxError'?'invalid_response':'network',message:'Falha de rede, prazo excedido ou resposta inválida.'});}
 };
 await call('address');
 if(classify(all,q).status!=='compatible'&&q.name&&!attempts.some(a=>[401,403,429].includes(a.httpStatus)))await call('name');
 const result=classify(all,q);const failed=attempts.some(a=>a.status==='error');
 if(!all.length&&failed){result.status='error';result.reason='A consulta ao provedor falhou; consulte o código HTTP nas tentativas.';}
 return {...result,provider,attempts,requests:count,partialFailure:failed};
}

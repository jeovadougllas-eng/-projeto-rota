/* Address parsing and evidence-based geocoding shared by the UI and tests. */
(function(root){
'use strict';
const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const digits=v=>clean(v).replace(/\D/g,'');
const valid=(lat,lon)=>Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180;
const states={AC:'Acre',AL:'Alagoas',AP:'Amapá',AM:'Amazonas',BA:'Bahia',CE:'Ceará',DF:'Distrito Federal',ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',MT:'Mato Grosso',MS:'Mato Grosso do Sul',MG:'Minas Gerais',PA:'Pará',PB:'Paraíba',PR:'Paraná',PE:'Pernambuco',PI:'Piauí',RJ:'Rio de Janeiro',RN:'Rio Grande do Norte',RS:'Rio Grande do Sul',RO:'Rondônia',RR:'Roraima',SC:'Santa Catarina',SP:'São Paulo',SE:'Sergipe',TO:'Tocantins'};
const stateCode=v=>Object.keys(states).find(k=>norm(k)===norm(v)||norm(states[k])===norm(v))||'';
function field(c,aliases){return clean((c.importFields||[]).find(f=>aliases.includes(norm(f.label))&&clean(f.value))?.value);}
function parse(c){
 const company=Object.fromEntries((c.companyData?.fields||[]).map(([k,v])=>[norm(k),v]));
 const raw=clean(c.geocodingAddressOverride)||field(c,['endereco','logradouro','rua'])||clean(c.address);
 const regionOverride=c.geocodingRegionOverride;
 const cityValue=regionOverride?clean(regionOverride.city):field(c,['cidade','municipio','localidade'])||clean(c.city)||clean(company.municipio);
 const embedded=cityValue.match(/^(.+?)\s*[-/]\s*([A-Za-z]{2})$/);const city=embedded?clean(embedded[1]):cityValue;
 const district=regionOverride?clean(regionOverride.district):field(c,['bairro','distrito','neighborhood'])||clean(c.neighborhood)||clean(company.bairro);
 const state=stateCode(regionOverride?regionOverride.state:field(c,['uf','estado'])||c.state||c.uf||company.uf||embedded?.[2])||stateCode(raw.split(',').map(clean).find(v=>stateCode(v)))||'';
 let street=raw.split(/[,·]/)[0].trim();
 const found=raw.match(/(?:^|[,·])\s*(?:n[º°o.]?\s*)?(\d{1,6}\s*[a-z]?)\b/i)||raw.match(/\bn[º°o.]\s*(\d{1,6}\s*[a-z]?)\b/i);
 const house=(c.geocodingAddressOverride?clean(c.houseNumber):field(c,['numero','numerodologradouro','numerodoimovel','nro','num'])||clean(c.houseNumber))||clean(found?.[1]);
 street=street.replace(/\s+n[º°o.]\s*\d{1,6}\s*[a-z]?\b.*$/i,'').trim();
 const inferredCity=city||raw.split(',').slice(1).map(clean).reverse().find(v=>regionName(v)&&!/^\d/.test(v))||'';
 return {street,house:/^(s\/?n|semnumero)$/i.test(norm(house))?'':house,city:regionName(inferredCity)?inferredCity:'',district,state,zip:digits(clean(c.cep)||field(c,['cep','codigopostal'])||c.zip_code||company.cep),country:'BR'};
}
function regionName(v){return /[A-Za-zÀ-ÿ]{2}/.test(v)&&!/^\d/.test(v)&&!(/^[A-Za-z]{2}$/.test(clean(v))&&stateCode(v))&&!/^brasil$/i.test(v);}
function streetKey(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\bdr\.?\b/g,'doutor').replace(/\bdra\.?\b/g,'doutora').replace(/\bprof\.?\b/g,'professor').replace(/^(?:rua|r\.?|avenida|av\.?|travessa|tv\.?|praca|rodovia|estrada)\s+/,'').replace(/[^a-z0-9]/g,'');}
const houseKey=v=>norm(v).replace(/^0+(?=\d)/,'');
function meters(a,b){const r=Math.PI/180,x=(a.lon-b.lon)*r*Math.cos((a.lat+b.lat)*r/2),y=(a.lat-b.lat)*r;return Math.hypot(x,y)*6371000;}
function assess(item,q){
 if(!valid(item.lat,item.lon)||norm(item.country)!=='br')return null;
 if(q.city&&item.city&&norm(q.city)!==norm(item.city))return null;
 if(q.state&&item.state&&stateCode(q.state)!==stateCode(item.state))return null;
 const sameStreet=!!(streetKey(q.street)&&[q.street,q.postal?.street].filter(Boolean).some(street=>streetKey(street)===streetKey(item.street)));
 if(!sameStreet)return null;
 const exactNumber=!!(q.house&&item.house&&houseKey(q.house)===houseKey(item.house));
 const cityMatched=!!(q.city&&item.city&&norm(q.city)===norm(item.city));
 const zipMatched=!q.zip||(item.zip?digits(q.zip)===digits(item.zip):!!q.postal?.street);
 const mismatchedNumber=!!(q.house&&item.house&&!exactNumber);
 const districtMatched=!q.district||!item.district||norm(q.district)===norm(item.district);
 return {...item,exactNumber,cityMatched,confidence:exactNumber&&cityMatched&&zipMatched&&districtMatched&&!q.postalIssue&&!item.interpolated?'address':'street',score:(cityMatched?4:0)+(exactNumber?8:0)+(zipMatched?1:0)-(mismatchedNumber?10:0),mismatchedNumber};
}
function rank(items,q){
 const ranked=items.map(i=>assess(i,q)).filter(Boolean).sort((a,b)=>b.score-a.score),best=ranked[0];
 if(!best)return {status:'not_found',query:q,candidates:[]};
 const conflict=ranked.some(x=>x!==best&&x.confidence==='address'&&best.confidence==='address'&&meters(x,best)>40);
 return {status:best.confidence==='address'&&!conflict?'matched':'review',query:q,best,candidates:ranked.slice(0,6),reason:q.postalIssue|| (conflict?'Há mais de um imóvel compatível em pontos diferentes.':best.mismatchedNumber?'O número encontrado difere do cadastro.':'As buscas automáticas não confirmaram o imóvel. Confira os dados antes de recorrer ao ajuste no mapa.')};
}
function photon(data){return (data.features||[]).map(f=>{const p=f.properties||{},xy=f.geometry?.coordinates||[];return {lat:xy[1],lon:xy[0],street:p.street||p.name||'',house:p.housenumber||'',city:p.city||p.town||p.village||'',district:p.district||p.suburb||'',state:p.state||'',zip:p.postcode||'',country:p.countrycode||'',label:[p.name,p.street,p.housenumber,p.district,p.city,p.state].filter(Boolean).join(', '),provider:'photon_osm',attribution:'© OpenStreetMap contributors',interpolated:p.osm_value==='interpolation'};});}
function geoapify(data){return (data.features||[]).map(f=>{const p=f.properties||{},xy=f.geometry?.coordinates||[];return {lat:p.lat??xy[1],lon:p.lon??xy[0],street:p.street||'',house:p.housenumber||'',city:p.city||p.town||p.village||'',district:p.suburb||'',state:p.state_code||p.state||'',zip:p.postcode||'',country:p.country_code||'',label:p.formatted||'',provider:'geoapify',attribution:p.datasource?.attribution||'Powered by Geoapify · © OpenStreetMap contributors',interpolated:p.result_type!=='building'||(p.rank?.confidence_building_level??0)<0.9};});}
function ensureAttribution(){
 const doc=root.document,target=doc?.getElementById('map');if(!target||doc.getElementById('traxio-geocoding-credit'))return;
 const credit=doc.createElement('p'),link=doc.createElement('a');credit.id='traxio-geocoding-credit';credit.className='muted';credit.style.display='block';credit.style.fontSize='12px';credit.style.padding='8px';link.href='https://www.geoapify.com/';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Geocoding by Geoapify';credit.append(link,' · © OpenStreetMap contributors');target.after(credit);
}
const cache=new Map(),postalCache=new Map();let queue=Promise.resolve(),lastCall=0,additionalProvider=true;
async function getJSON(url,signal){
 const work=queue.catch(()=>{}).then(async()=>{
  for(let attempt=0;attempt<2;attempt++){
   const wait=Math.max(0,1600-(Date.now()-lastCall));if(wait)await new Promise(r=>setTimeout(r,wait));
   signal?.throwIfAborted();lastCall=Date.now();
   try{
    const response=await fetch(url,{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(14000)]):AbortSignal.timeout(14000)});
    if(!response.ok){const error=Error('Busca indisponível (HTTP '+response.status+')');error.retryable=response.status===429||response.status>=500;throw error;}
    return await response.json();
   }catch(error){if(signal?.aborted||attempt>0||!(error.retryable||error instanceof TypeError||error.name==='TimeoutError'))throw error;}
  }
 });
 queue=work.catch(()=>{});return work;
}
async function locate(client,{signal,token}={}){
 let q=parse(client);
 if(q.street.length<3)throw Error('Informe o logradouro do cliente.');
 // CEP verifies postal street/locality only; its centroid never becomes the client point.
 if(q.zip&&q.zip.length!==8)throw Error('CEP inválido: informe os 8 dígitos na planilha ou no cadastro.');
 if(q.zip.length===8){
  const stored=client.locationEvidence?.query?.postal||client.locationCandidate?.query?.postal;
  let zip=postalCache.get(q.zip);
  if(!zip&&stored?.zip===q.zip&&Date.now()-Date.parse(stored.checkedAt)<86400000)zip=stored;
  if(!zip){
   try{
    const data=await getJSON('https://viacep.com.br/ws/'+q.zip+'/json/',signal);
    if(data.erro){const error=Error('CEP não encontrado. Confira o CEP informado na planilha.');error.invalidPostalCode=true;throw error;}
    zip={zip:q.zip,street:clean(data.logradouro),city:clean(data.localidade),district:clean(data.bairro),state:stateCode(data.uf),checkedAt:new Date().toISOString(),source:'ViaCEP'};
    postalCache.set(q.zip,zip);
   }catch(e){if(signal?.aborted||e.invalidPostalCode)throw e;}
  }
  if(zip){
   const issues=[];
   if(q.city&&zip.city&&norm(q.city)!==norm(zip.city))issues.push('município');
   if(q.state&&zip.state&&q.state!==zip.state)issues.push('UF');
   if(q.street&&zip.street&&streetKey(q.street)!==streetKey(zip.street))issues.push('logradouro');
   q={...q,postal:zip,city:q.city||zip.city,state:q.state||zip.state,district:q.district||zip.district,postalIssue:issues.length?'O CEP corresponde a '+[zip.street,zip.city,zip.state].filter(Boolean).join(', ')+', com divergência de '+issues.join(', ')+'. Confira os dados da planilha.':''};
  }
 }
 if(!q.city)throw Error('Informe cidade e UF ou um CEP válido para localizar este endereço.');
 const key=JSON.stringify(q),saved=cache.get(key);if(saved&&Date.now()-saved.at<600000)return saved.result;
 let result,commercial=[];
 if(token&&additionalProvider){
  try{const r=await fetch((root.TraxioNative?.apiBase||'')+'/api/geocode',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(q),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(16000)]):AbortSignal.timeout(16000)});if(r.status===503||r.status===404)additionalProvider=false;if(r.ok){ensureAttribution();commercial=geoapify(await r.json());result=rank(commercial,q);if(result.status==='matched'){cache.set(key,{at:Date.now(),result});return result;}}}catch(e){if(signal?.aborted)throw e;}
 }
 let all=[...commercial],lastError;
 const structured=new URL('https://photon.komoot.io/structured');
 for(const [key,value] of Object.entries({countrycode:'BR',lang:'default',limit:'8',street:q.street,housenumber:q.house,city:q.city,state:states[q.state]||q.state,postcode:q.zip,district:q.district}))if(value)structured.searchParams.set(key,value);
 const terms=[[q.street,q.house,q.district,q.zip,q.city,states[q.state]||q.state,'Brasil'],[q.street,q.city,states[q.state]||q.state,'Brasil']].map(x=>x.filter(Boolean).join(', '));
 if(q.postal?.street&&streetKey(q.postal.street)!==streetKey(q.street))terms.push([q.postal.street,q.house,q.zip,q.city,states[q.state]||q.state,'Brasil'].filter(Boolean).join(', '));
 const urls=[structured.href,...[...new Set(terms)].map(term=>'https://photon.komoot.io/api/?limit=8&lang=default&q='+encodeURIComponent(term))];
 for(const url of urls){
  try{const data=await getJSON(url,signal);all.push(...photon(data));result=rank(all,q);if(result.status==='matched')break;}catch(e){lastError=e;if(signal?.aborted)throw e;}
 }

 result=rank(all,q);if(q.postalIssue)result.reason=q.postalIssue;if(result.status==='not_found'&&lastError)throw lastError;
 cache.set(key,{at:Date.now(),result});return result;
}
root.TraxioGeo={parse,rank,assess,photon,geoapify,locate,meters,stateCode,ensureAttribution};
})(globalThis);

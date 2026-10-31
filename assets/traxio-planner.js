/* Shared planning rules. No credentials, account data or provider substitution. */
(function(root){
'use strict';
class IdSet extends Set {
 constructor(values=[]){super();for(const id of values)this.add(id);}
 add(id){return super.add(String(id));}
 has(id){return super.has(String(id));}
 delete(id){return super.delete(String(id));}
}
function coordinate(value){if(value===null||value===undefined||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)?n:null;}
function location(c){
 const lat=coordinate(c.lat),lon=coordinate(c.lon);
 if(lat===null||lon===null||Math.abs(lat)>90||Math.abs(lon)>180||(lat===0&&lon===0))return {kind:c.locationCandidate?'approximate':'unavailable',ready:false};
 const verification=c.locationVerification||'unverified';
 // Recover only independent evidence of a saved manual confirmation; never promote unknown points.
 const legacyManual=!c.locationVerification&&c.locationSource==='manual_confirmation'&&Number.isFinite(Date.parse(c.locationConfirmedAt));
 if(['approx','approximate','street','city','pending'].includes(verification))return {kind:'approximate',ready:false};
 if(legacyManual||['manual_reviewed','automatic_housenumber'].includes(verification))return {kind:legacyManual||verification==='manual_reviewed'?'confirmed':'precise',ready:true,lat,lon};
 return {kind:'unverified',ready:false,consent:true,lat,lon};
}
function hasSavedPoint(c){const point=location(c);if(point.lat!==undefined)return true;const candidate=c.locationCandidate;return !!candidate&&coordinate(candidate.lat)!==null&&coordinate(candidate.lon)!==null&&Math.abs(Number(candidate.lat))<=90&&Math.abs(Number(candidate.lon))<=180&&!(Number(candidate.lat)===0&&Number(candidate.lon)===0)||coordinate(c.lat)!==null&&coordinate(c.lon)!==null&&Math.abs(Number(c.lat))<=90&&Math.abs(Number(c.lon))<=180&&!(Number(c.lat)===0&&Number(c.lon)===0);}
function partition(records,ids,{allowUnverified=false}={}){
 const selected=new IdSet(ids),ready=[],blocked=[],unverified=[],found=new IdSet();
 for(const c of records){if(!selected.has(c.id))continue;found.add(c.id);const point=location(c);
  if(point.ready||(point.consent&&allowUnverified))ready.push({...c,lat:point.lat,lon:point.lon});
  else if(point.consent)unverified.push(c);else blocked.push(c);
 }
 const unloaded=[...selected].filter(id=>!found.has(id));
 return {ready,blocked,unverified,unloaded,total:selected.size};
}
function signature(records,ids,origin){
 const selected=new IdSet(ids);
 return JSON.stringify([origin,[...selected].sort(),records.filter(c=>selected.has(c.id)).map(c=>[String(c.id),c.lat,c.lon,c.address,c.cep,c.houseNumber,c.locationVerification,c.locationSource,c.locationConfirmedAt]).sort((a,b)=>a[0].localeCompare(b[0]))]);
}
root.TraxioPlanner={IdSet,coordinate,location,hasSavedPoint,partition,signature};
})(globalThis);


/* Deterministic road-distance sequencing and current-leg navigation geometry. */
(function(root){
'use strict';
const key=c=>String(c.id??'')+'|'+Number(c.lat)+'|'+Number(c.lon);
function canonical(points){return [...points].sort((a,b)=>key(a)<key(b)?-1:key(a)>key(b)?1:0);}
function cost(path,matrix){let sum=0;for(let i=1;i<path.length;i++){const value=matrix[path[i-1]]?.[path[i]];if(!Number.isFinite(value)||value<0)return Infinity;sum+=value;}return sum;}
function distanceOrder(matrix){
 const n=matrix.length,remaining=new Set(Array.from({length:Math.max(0,n-1)},(_,i)=>i+1)),path=n?[0]:[];let current=0;
 while(remaining.size){let best=-1,score=Infinity;for(const next of remaining){const d=matrix[current]?.[next];if(Number.isFinite(d)&&d>=0&&d<score){score=d;best=next;}}if(best<0)throw Error('Há locais sem ligação rodoviária na matriz.');path.push(best);remaining.delete(best);current=best;}
 // Keep the closest first stop anchored. Improvements of the remaining open path
 // use directed road distances and deterministic, strictly improving tie handling.
 let changed=true;while(changed){changed=false;for(let i=2;i<path.length-1;i++)for(let j=i+1;j<path.length;j++){const candidate=path.slice();candidate.splice(i,j-i+1,...path.slice(i,j+1).reverse());if(cost(candidate,matrix)+1e-5<cost(path,matrix)){path.splice(0,path.length,...candidate);changed=true;}}}
 return path;
}
function projection(lat,lon,a,b){
 const sx=111320*Math.cos(lat*Math.PI/180),sy=111320,dx=(b[0]-a[0])*sx,dy=(b[1]-a[1])*sy;
 const t=Math.max(0,Math.min(1,(((lon-a[0])*sx)*dx+((lat-a[1])*sy)*dy)/(dx*dx+dy*dy||1)));
 return {distance:Math.hypot((lon-a[0])*sx-t*dx,(lat-a[1])*sy-t*dy),point:[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])],t};
}
function deviation(point,geometry){const coords=geometry?.coordinates;if(!coords?.length)return Infinity;let min=Infinity;for(let i=1;i<coords.length;i++)min=Math.min(min,projection(point[1],point[0],coords[i-1],coords[i]).distance);return min;}
function throughFirstStop(geometry,stop){
 const coords=geometry?.coordinates;if(!coords?.length||!stop)return geometry;
 let best=null;for(let i=1;i<coords.length;i++){const p=projection(stop.lat,stop.lon,coords[i-1],coords[i]);if(!best||p.distance<best.distance-0.01)best={...p,index:i};}
 if(!best)return geometry;return {type:'LineString',coordinates:[...coords.slice(0,best.index),best.point]};
}
function firstLeg(geometry,legs,stop){return legs?.[0]?.geometry?.coordinates?.length>=2?legs[0].geometry:throughFirstStop(geometry,stop);}
root.TraxeloNavigationModel={canonical,cost,distanceOrder,projection,deviation,throughFirstStop,firstLeg};
})(globalThis);

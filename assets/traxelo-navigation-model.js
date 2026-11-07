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
function normalizeBearing(value){return Number.isFinite(value)?((value%360)+360)%360:null;}
function bearingDelta(from,to){return ((to-from+540)%360+360)%360-180;}
function metres(a,b){const lat=(a[1]+b[1])/2*Math.PI/180;return Math.hypot((b[0]-a[0])*111320*Math.cos(lat),(b[1]-a[1])*111320);}
function bearingBetween(a,b){
 if(!a||!b||metres(a,b)<1)return null;
 const r=Math.PI/180,p1=a[1]*r,p2=b[1]*r,dl=(b[0]-a[0])*r;
 return normalizeBearing(Math.atan2(Math.sin(dl)*Math.cos(p2),Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl))/r);
}
// Used only to initialize direction when a device has not reported a course yet.
function roadBearing(point,geometry){
 const coords=geometry?.coordinates;if(!point||!coords?.length)return null;
 let best=null;for(let i=1;i<coords.length;i++){if(metres(coords[i-1],coords[i])<1)continue;const p=projection(point[1],point[0],coords[i-1],coords[i]);if(!best||p.distance<best.distance-.01)best={...p,index:i};}
 if(!best)return null;
 for(let i=best.index;i<coords.length;i++)if(metres(best.point,coords[i])>=5)return bearingBetween(best.point,coords[i]);
 return bearingBetween(coords[best.index-1],coords[best.index]);
}
// heading is course of travel, not phone compass orientation. Ignore stationary
// headings and small coordinate jitter; retain the last course at traffic lights.
function courseForFix(fix,anchor,lastCourse=null,geometry=null){
 const accuracy=fix?.accuracy;if(!fix||!Number.isFinite(accuracy)||accuracy<0||accuracy>100)return normalizeBearing(lastCourse);
 const speed=Number.isFinite(fix.speed)?fix.speed:null;
 if(accuracy<=60&&Number.isFinite(fix.heading)&&fix.heading>=0&&fix.heading<=360&&(speed===null||speed>=1))return normalizeBearing(fix.heading);
 if(anchor&&speed!==0){const dt=(fix.at-anchor.at)/1000,d=metres(anchor.coord,fix.coord),threshold=Math.max(8,Math.min(30,(accuracy+anchor.accuracy)/2));
  if(dt>=.4&&dt<=20&&d>=threshold&&d/dt>=1&&d/dt<=80)return bearingBetween(anchor.coord,fix.coord);
 }
 return normalizeBearing(lastCourse)??roadBearing(fix.coord,geometry);
}
root.TraxeloNavigationModel={canonical,cost,distanceOrder,projection,deviation,throughFirstStop,firstLeg,normalizeBearing,bearingDelta,metres,bearingBetween,roadBearing,courseForFix};
})(globalThis);

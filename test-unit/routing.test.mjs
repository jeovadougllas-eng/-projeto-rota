import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('async function fetchRoadRoute('),html.indexOf('let routeLookupBusy='));
function engine(fetch){return runInNewContext(source+';({fetchRoadRoute,roadMatrix,optimizeStrategy})',{fetch,AbortSignal,setTimeout:fn=>{fn();},Number,Error,Math,Promise,Set,Array});}
const json=data=>({ok:true,json:async()=>data});
test('road matrix supports 157 selected clients with bounded blocks and directed distances',async()=>{
 const nodes=Array.from({length:158},(_,i)=>({lat:-5.8+i/10000,lon:-35.2+i/10000}));let calls=0;
 const e=engine(async url=>{calls++;const u=new URL(url),pairs=u.pathname.split('/').at(-1).split(';'),ids=pairs.map(p=>nodes.findIndex(n=>n.lon+','+n.lat===p));assert.ok(pairs.length<=80);const rows=u.searchParams.get('sources').split(';').map(Number),cols=u.searchParams.get('destinations').split(';').map(Number);return json({code:'Ok',distances:rows.map(i=>cols.map(j=>ids[i]*1000+ids[j]))});});
 const matrix=await e.roadMatrix(nodes);assert.equal(calls,16);assert.equal(matrix.length,158);assert.equal(matrix[157][1],157001);assert.equal(matrix[1][157],1157);
});
test('multi-leg requests keep all destinations and merge geometry, duration and distance',async()=>{
 const nodes=Array.from({length:158},(_,i)=>({lat:-5.8+i/10000,lon:-35.2+i/10000}));let calls=0;
 const e=engine(async url=>{calls++;const coords=new URL(url).pathname.split('/').at(-1).split(';').map(p=>p.split(',').map(Number));return json({code:'Ok',routes:[{distance:coords.length-1,duration:(coords.length-1)*2,geometry:{type:'LineString',coordinates:coords}}]});});
 const road=await e.fetchRoadRoute(nodes);assert.equal(calls,3);assert.equal(road.geometry.coordinates.length,158);assert.equal(road.distance,157);assert.equal(road.duration,314);
});
test('priority is strict, balanced remains distance-aware, and unreachable links are rejected',()=>{
 const e=engine(()=>{}),nodes=[{}, {priority:1},{priority:3}],matrix=[[0,10,100000],[10,0,100000],[100000,100000,0]];
 assert.deepEqual([...e.optimizeStrategy(nodes,matrix,'priority')],[0,2,1]);
 assert.deepEqual([...e.optimizeStrategy(nodes,matrix,'distance')],[0,1,2]);
 assert.deepEqual([...e.optimizeStrategy(nodes,[[0,10,100000],[10,0,20],[100000,20,0]],'balanced')],[0,1,2]);
 assert.throws(()=>e.optimizeStrategy(nodes,[[0,null,null],[null,0,10],[null,10,0]],'distance'));
 assert.throws(()=>e.optimizeStrategy(nodes,[[0,null,null],[null,0,10],[null,10,0]],'balanced'));
});

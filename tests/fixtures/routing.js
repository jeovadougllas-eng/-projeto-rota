export const records=Array.from({length:7},(_,i)=>({id:i+1,name:'Visita de teste '+(i+1),address:'Avenida Prudente de Morais, '+(1000+i*100)+', Natal, RN',city:i===6?'Parnamirim':'Natal',neighborhood:i%2?'Tirol':'Lagoa Nova',lat:-5.805-i*.001,lon:-35.208-i*.001,locationVerification:'manual_reviewed',priority:i%3+1,importFields:[]}));
export async function fakeMap(page){
 await page.evaluate(()=>{
  const sources=new Map(),layers=new Set();window.maplibregl={LngLatBounds:class{extend(){return this;}},Marker:class{constructor(o){this.el=o?.element||document.createElement('div');}setLngLat(){return this;}setPopup(){return this;}addTo(){return this;}remove(){}on(){return this;}getElement(){return this.el;}},Popup:class{setText(){return this;}}};
  map={__traxioPalette:true,__traxioOrigin:true,isStyleLoaded:()=>true,getSource:id=>sources.get(id),getLayer:id=>layers.has(id),addSource:(id,o)=>sources.set(id,{...o,setData(data){this.data=data;}}),addLayer:o=>layers.add(o.id),removeLayer:id=>layers.delete(id),removeSource:id=>sources.delete(id),setPaintProperty(){},getStyle:()=>({layers:[]}),resize(){},fitBounds(){},flyTo(){},easeTo(){},jumpTo(){},on(){},once(){},off(){}};
 });
}
export async function services(page,{tableFail=false,roadFail=false,hold=null}={}){
 await page.route('https://router.project-osrm.org/**',async r=>{
  const url=new URL(r.request().url()),coords=url.pathname.split('/').at(-1).split(';').map(p=>p.split(',').map(Number));
  if(url.pathname.includes('/table/')){if(tableFail)return r.abort();return r.fulfill({json:{code:'Ok',distances:coords.map((_,i)=>coords.map((_,j)=>i===j?0:1000+Math.abs(i-j)*100))}});}
  if(hold)await hold;if(roadFail)return r.abort();await r.fulfill({json:{code:'Ok',routes:[{geometry:{type:'LineString',coordinates:coords},distance:7400,duration:1260}]}}).catch(()=>{});
 });
}

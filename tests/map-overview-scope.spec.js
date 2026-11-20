import {test,expect} from 'playwright/test';
import {setupLinks} from './fixtures/links.js';import{fakeMap}from'./fixtures/routing.js';
test.setTimeout(60000);
const records=[{id:'manual',name:'Confirmado manual',lat:-5.8,lon:-35.2,locationVerification:'manual_reviewed'},{id:'auto',name:'Confirmado automático',lat:-5.81,lon:-35.21,locationVerification:'automatic_housenumber'},{id:'approx',name:'Aproximado',lat:-5.82,lon:-35.22,locationVerification:'approximate'},{id:'candidate',name:'Candidato salvo',locationCandidate:{lat:-5.83,lon:-35.23}},{id:'missing',name:'Sem ponto'}].map(c=>({...c,city:'Natal',state:'RN',neighborhood:'Tirol'}));
test('general map shows the full portfolio with distinct states; planning shows only its selection',async({page})=>{
 await setupLinks(page,{records});await fakeMap(page);
 await page.evaluate(()=>{RotaMapaTopics.go('mapa');renderMarkers();});
 const pins=()=>page.evaluate(()=>markers.map(m=>{const e=m.getElement();return{id:e.dataset.clientId,state:e.dataset.locationState,label:e.getAttribute('aria-label')};}));
 expect((await pins()).map(p=>p.id).sort()).toEqual(['approx','auto','candidate','manual']);expect((await pins()).filter(p=>p.state==='confirmed')).toHaveLength(2);expect((await pins()).filter(p=>p.state==='approximate')).toHaveLength(2);
 await page.evaluate(()=>{RotaMapaTopics.go('mapa','clientes');selectedIds.clear();selectedIds.add('manual');syncRouteChoices();renderMarkers();});
 expect((await pins())).toHaveLength(1);expect((await pins())[0].label).toContain('Confirmado manual');
 await page.evaluate(()=>document.querySelector('nav.tabs [data-tab=mapa]').click());
 expect((await pins())).toHaveLength(4);expect(await page.evaluate(()=>[...selectedIds])).toEqual(['manual']);
});
test('pin adjustment enables only the native Google Street View control and disables it on close',async({page})=>{
 await setupLinks(page,{records});await fakeMap(page);
 await page.evaluate(()=>{RotaMapaTopics.go('mapa');window.__streetOptions=[];window.__streetHidden=[];map.__google=true;map.native={setOptions:o=>window.__streetOptions.push(o),getStreetView:()=>({setVisible:v=>window.__streetHidden.push(v)})};document.getElementById('pinConfirmPanel').hidden=false;});
 await expect(page.locator('#pinStreetViewHint')).toBeVisible();expect(await page.evaluate(()=>window.__streetOptions.at(-1).streetViewControl)).toBe(true);
 await page.evaluate(()=>document.getElementById('pinConfirmPanel').hidden=true);
 await expect(page.locator('#pinStreetViewHint')).toBeHidden();expect(await page.evaluate(()=>window.__streetOptions.at(-1).streetViewControl)).toBe(false);expect(await page.evaluate(()=>window.__streetHidden.at(-1))).toBe(false);
});

import {test,expect} from 'playwright/test';
import {prepare,ready} from './fixtures/browser.js';

test('live Photon geocodes Brazilian address queries without the unsupported Portuguese-language parameter',async({page},info)=>{
 test.setTimeout(60000);
 await prepare(page,{records:[],theme:info.project.metadata.theme});
 const responses=[];
 await page.route('https://photon.komoot.io/api/**',async route=>{
  expect(new URL(route.request().url()).searchParams.get('lang')).toBe('default');await route.continue();
 });
 page.on('response',r=>{if(r.url().startsWith('https://photon.komoot.io/api/'))responses.push(r.status());});
 await ready(page);
 const result=await page.evaluate(()=>TraxioGeo.locate({address:'Rua Luiz XV, 770, Natal',city:'Natal',state:'RN'}));
 expect(responses.length).toBeGreaterThan(0);expect(responses.every(s=>s===200)).toBe(true);
 expect(['matched','review']).toContain(result.status);
 expect(result.candidates.length).toBeGreaterThan(0);
 for(const p of result.candidates){expect(p.city.toLowerCase()).toBe('natal');expect(p.provider).toBe('photon_osm');}
 // A street centroid is never promoted into a verified client coordinate.
 if(result.best.confidence!=='address')expect(result.status).toBe('review');
 await info.attach('Real-provider lookup (no production records changed)',{body:JSON.stringify({responses,result},null,2),contentType:'application/json'});
});

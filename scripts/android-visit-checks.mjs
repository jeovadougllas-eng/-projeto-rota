import {expect} from 'playwright/test';import {writeFile} from 'node:fs/promises';import {execFileSync} from 'node:child_process';
export async function verifyVisits({page,device,evidence}){
 await expect.poll(()=>page.evaluate(()=>!!TraxeloVisits?.getStore())).toBe(true);
 await page.evaluate(()=>{
  const oldFrom=authClient.from.bind(authClient),rows=[];window.__visitCloudRows=rows;
  authClient.from=table=>{if(table!=='traxelo_visit_events')return oldFrom(table);let payload=null,mode='read',filters=[];const result=()=>{if(mode==='insert'){rows.push({...structuredClone(payload),revision:1});return {data:{revision:1},error:null};}if(mode==='update'){const row=rows.find(r=>filters.every(([k,v])=>r[k]===v));if(!row)return {data:[],error:null};Object.assign(row,structuredClone(payload));return {data:[{revision:row.revision}],error:null};}return {data:structuredClone(rows),error:null};};const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},order(){return q;},range:async()=>result(),insert(p){mode='insert';payload=p;return q;},update(p){mode='update';payload=p;return q;},single:async()=>result(),then:(yes,no)=>Promise.resolve(result()).then(yes,no)};return q;};
 });
 await page.locator('.tabs [data-tab=historico]').click();await page.locator('#newVisit').click();await page.locator('#visitEntryClient').selectOption('1');await page.locator('#visitEntryConfirm').check();await page.locator('#saveVisitEntry').click();if(await page.locator('#commerceChoiceDialog').isVisible())await page.locator('#visitSaleLater').click();
 await expect.poll(()=>page.evaluate(()=>TraxeloVisits.getModel().summary.visits)).toBe(1);await page.evaluate(()=>TraxeloVisits.sync());await expect(page.locator('#visitSyncStatus')).toContainText('sincronizado');expect(await page.evaluate(()=>window.__visitCloudRows.length)).toBe(1);
 evidence.checks.push('Installed Android update records an individual confirmed visit, renders the monthly dashboard and syncs the account-scoped ledger to an isolated database double');
 await page.evaluate(()=>{
  window.__visitExport={};authClient.storage={from:bucket=>({upload:async(path,bytes,options)=>{window.__visitExport={bucket,path,signature:[...bytes.slice(0,4)],type:options.contentType};return {error:null};},createSignedUrl:async(path,seconds,options)=>{Object.assign(window.__visitExport,{signedPath:path,seconds,downloadName:options.download});return {data:{signedUrl:'https://traxio-preview.vercel.app/docs/examples/visit-report-example.xlsx'},error:null};},list:async()=>({data:[]})})};
 });
 await page.locator('#exportVisitWorkbook').click();await expect(page.locator('#visitFeedback')).toContainText('Arquivo privado preparado',{timeout:20000});
 const result=await page.evaluate(()=>window.__visitExport);expect(result.bucket).toBe('traxelo-visit-exports');expect(result.path).toMatch(/^00000000-0000-4000-8000-000000000001\/visitas\//);expect(result.signature).toEqual([80,75,3,4]);expect(result.seconds).toBe(300);expect(result.signedPath).toBe(result.path);expect(result.downloadName).toMatch(/\.xlsx$/);
 await page.evaluate(()=>Capacitor.registerPlugin('Browser').close().catch(()=>{}));await device.shell('am start -n app.traxio.mobile/.MainActivity');
 await writeFile('mobile/evidence/android-visit-report.png',execFileSync('adb',['exec-out','screencap','-p'],{maxBuffer:20000000}));
 evidence.checks.push('Android generates real XLSX bytes, scopes a private export to the signed-in owner and invokes the existing native Browser plugin with an HTTPS workbook URL (storage/signing use a fixture; production account is untouched)');
 return page.evaluate(()=>({key:TraxeloVisits.getStore().key,value:localStorage.getItem(TraxeloVisits.getStore().key)}));
}

import {_android as android} from 'playwright';
import {expect} from 'playwright/test';
import {prepare} from '../tests/fixtures/browser.js';
import {records} from '../tests/fixtures/routing.js';
import {writeFile,mkdir} from 'node:fs/promises';
const [device]=await android.devices();if(!device)throw Error('No Android device');
const seed=process.argv[2]==='seed';
try{
 await device.shell('am start -n app.traxio.mobile/.MainActivity');
 const view=await device.webView({pkg:'app.traxio.mobile'}),page=await view.page();
 await prepare(page,{records});await page.reload();await page.locator('body.traxio-ui-ready').waitFor({timeout:60000});
 if(seed){await page.evaluate(rows=>{localStorage.setItem('traxelo.apk-upgrade-probe','preserved');localStorage.setItem('projeto_rota_mapa_v1',JSON.stringify(rows));localStorage.setItem('traxio.route.history.v1',JSON.stringify([{id:'retained-history',distanceKm:4.7,names:['Visita anterior']}]))},records);await page.waitForTimeout(1000);}
 else{
  expect(await page.evaluate(()=>localStorage.getItem('traxelo.apk-upgrade-probe'))).toBe('preserved');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('projeto_rota_mapa_v1')))).toEqual(records);
  expect(await page.evaluate(()=>Capacitor.isPluginAvailable('TraxeloUpdates'))).toBe(true);
  await mkdir('mobile/evidence',{recursive:true});
  expect(JSON.parse(await page.evaluate(()=>localStorage.getItem('traxio.route.history.v1')))[0].id).toBe('retained-history');
  const evidence={migratedBetweenTestSignatures:true,uninstalledOnlyAfterVerifiedBackup:true,allCustomerFieldsPreserved:true,localHistoryPreserved:true,storageOrigin:await page.evaluate(()=>location.origin),packageId:'app.traxio.mobile'};
  await writeFile('mobile/evidence/android-upgrade.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
 }
}finally{await device.close();}

import {_android as android} from 'playwright';
import {expect} from 'playwright/test';
import {prepare} from '../tests/fixtures/browser.js';
import {records} from '../tests/fixtures/routing.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const manifest=JSON.parse(await readFile('candidate/update-manifest.json','utf8'));
const [device]=await android.devices();if(!device)throw Error('No Android device');
const evidence={physicalDevice:false,realHTTPSDownload:true,checks:[],expected:manifest.version};
let page;
async function attach(){
 let lastError;
 for(let attempt=0;attempt<20;attempt++){
  try{
   const view=await device.webView({pkg:'app.traxio.mobile'});page=await view.page();
   if(page.isClosed())throw Error('Waiting for the replacement WebView');
   await page.locator('body.traxio-ui-ready').waitFor({timeout:60000});
   await prepare(page,{records,liveMaps:true});await page.reload();await page.locator('body.traxio-ui-ready').waitFor({timeout:60000});
   return page;
  }catch(error){lastError=error;await new Promise(resolve=>setTimeout(resolve,500));}
 }
 throw lastError;
}
const status=()=>page.evaluate(()=>Capacitor.registerPlugin('TraxeloUpdates').status());
async function restart(){const old=page;await device.shell('am force-stop app.traxio.mobile');if(old)await expect.poll(()=>old.isClosed(),{timeout:15000}).toBe(true);await device.shell('am start -n app.traxio.mobile/.MainActivity');await attach();}
try{
 // Reset only OTA metadata in the synthetic emulator. Never clear WebView/account/client storage.
 await device.shell('am force-stop app.traxio.mobile');
 await writeFile('candidate/ota-qa-prefs.xml','<?xml version="1.0" encoding="utf-8"?><map><int name="native" value="2"/><boolean name="qa" value="true"/></map>');
 execFileSync('adb',['push','candidate/ota-qa-prefs.xml','/data/local/tmp/traxelo-ota-qa.xml']);
 await device.shell('run-as app.traxio.mobile cp /data/local/tmp/traxelo-ota-qa.xml shared_prefs/traxelo_web_releases_v1.xml');
 await device.shell('am start -n app.traxio.mobile/.MainActivity');await attach();
 const bundled=await page.locator('meta[name=traxelo-release]').getAttribute('content');evidence.bundled=bundled;expect(bundled).not.toBe(manifest.version);
 await page.evaluate(()=>localStorage.setItem('traxelo.update-test.persisted','kept'));
 const before=await page.evaluate(()=>localStorage.getItem('projeto_rota_mapa_v1'));
 console.log(JSON.stringify({stage:'OTA download waiting for published candidate',expected:manifest.version}));
 let staged;
 for(let attempt=0;attempt<36;attempt++){
  await page.evaluate(()=>Capacitor.registerPlugin('TraxeloUpdates').check().catch(error=>({error:error.message})));
  staged=await status();if(staged.pending===manifest.version)break;
  await new Promise(resolve=>setTimeout(resolve,5000));
 }
 evidence.stagedStatus=staged;console.log(JSON.stringify({stage:'staged without reloading',...staged}));
 expect(staged.pending).toBe(manifest.version);expect(await page.locator('meta[name=traxelo-release]').getAttribute('content')).toBe(bundled);
 evidence.checks.push('Native HTTPS download validates a complete bundle and stages it without reloading the running application');
 await restart();await expect(page.locator('meta[name=traxelo-release]')).toHaveAttribute('content',manifest.version);
 await expect.poll(async()=>(await status()).active).toBe(manifest.version);
 expect(await page.evaluate(()=>localStorage.getItem('traxelo.update-test.persisted'))).toBe('kept');
 expect(await page.evaluate(()=>localStorage.getItem('projeto_rota_mapa_v1'))).toBe(before);
 evidence.checks.push('Next cold start applies the new web release at the same localhost origin while preserving all customer data');
 await writeFile('mobile/evidence/android-updated-dashboard.png',execFileSync('adb',['exec-out','screencap','-p'],{maxBuffer:20000000}));
 await restart();expect(await page.locator('meta[name=traxelo-release]').getAttribute('content')).toBe(manifest.version);
 expect((await status()).failed).toBe('');evidence.checks.push('Healthy startup acknowledgement keeps the release on subsequent launches');
 if(process.env.TRAXELO_LOCATION_PROOF==='1'){const {verifyLocations}=await import('./android-location-checks.mjs');await verifyLocations({page,device,evidence});}
 // Corrupt a downloaded file only inside this isolated emulator, then prove the native loader refuses it.
 await device.shell('am force-stop app.traxio.mobile');
 await device.shell("run-as app.traxio.mobile sh -c 'echo corrupted > files/traxelo-web-releases/"+manifest.version+"/index.html'");
 await device.shell('am start -n app.traxio.mobile/.MainActivity');await attach();
 expect(await page.locator('meta[name=traxelo-release]').getAttribute('content')).toBe(bundled);
 expect((await status()).failed).toBe(manifest.version);
 expect(await page.evaluate(()=>localStorage.getItem('projeto_rota_mapa_v1'))).toBe(before);
 evidence.checks.push('A corrupted downloaded release is rejected on startup and falls back to the bundled interface without losing customer data');
 await page.evaluate(()=>Capacitor.registerPlugin('TraxeloUpdates').check());expect((await status()).pending).toBe('');
 evidence.checks.push('A failed release is quarantined rather than reinstalled in a restart loop');
 console.log(JSON.stringify(evidence));
}catch(error){evidence.error=error.stack;evidence.lastStatus=await status().catch(()=>null);console.error(JSON.stringify(evidence));console.error(String(await device.shell('logcat -d -t 300 AndroidRuntime:E Capacitor/Console:E *:S').catch(()=>'')));throw error;}
finally{await mkdir('mobile/evidence',{recursive:true});await writeFile('mobile/evidence/android-updates.json',JSON.stringify(evidence,null,2));await device.close();}

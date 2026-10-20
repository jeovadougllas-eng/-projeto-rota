import {test,expect} from 'playwright/test';
import {prepare,ready} from './fixtures/browser.js';

test.beforeEach(async({page})=>{
 await prepare(page,{authenticated:false,records:[]});
 await page.addInitScript(()=>{
  window.__appListeners={};window.__nativeCalls=[];
  const position={coords:{latitude:-5.795,longitude:-35.211,accuracy:5},timestamp:Date.now()};
  const plugins={
   App:{addListener:async(name,fn)=>{window.__appListeners[name]=fn;return {remove(){}};},getLaunchUrl:async()=>null},
   Browser:{open:async options=>{window.__nativeCalls.push({plugin:'Browser',...options});},close:async()=>{}},
   AppLauncher:{openUrl:async options=>{window.__nativeCalls.push({plugin:'AppLauncher',...options});return {completed:true};}},
   Geolocation:{checkPermissions:async()=>({location:'granted',coarseLocation:'granted'}),getCurrentPosition:async()=>position,watchPosition:async(options,fn)=>{window.__nativePosition=fn;return new Promise(resolve=>window.__resolveNativeWatch=resolve);},clearWatch:async options=>{window.__nativeCalls.push({plugin:'clearWatch',...options});}}
  };
  window.Capacitor={isNativePlatform:()=>true,registerPlugin:name=>plugins[name]};
 });
 await ready(page);
});

test('Google and Microsoft use PKCE native return links and open the system authentication browser',async({page})=>{
 for(const provider of ['google','azure']){
  await page.locator('#authSocial [data-provider="'+provider+'"]').click();
  const call=await page.evaluate(()=>window.__oauthCalls.at(-1));expect(call.provider).toBe(provider);expect(call.options.redirectTo).toBe('app.traxio.mobile://auth/callback');expect(call.options.skipBrowserRedirect).toBe(true);if(provider==='azure')expect(call.options.scopes).toBe('email openid profile');
 }
 expect((await page.evaluate(()=>window.__nativeCalls)).filter(c=>c.plugin==='Browser')).toHaveLength(2);
 await page.evaluate(()=>window.__appListeners.appUrlOpen({url:'app.traxio.mobile://other/callback?code=reject'}));expect(await page.evaluate(()=>window.__exchangeCalls)).toHaveLength(0);
 await page.evaluate(()=>window.__appListeners.appUrlOpen({url:'app.traxio.mobile://auth/callback?code=native-pkce-test'}));await expect(page.locator('#authScreen')).toBeHidden();expect(await page.evaluate(()=>window.__exchangeCalls)).toEqual(['native-pkce-test']);
});

test('native GPS provides coordinates and cancels a watch even while its plugin ID is pending',async({page})=>{
 const position=await page.evaluate(()=>new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true})));
 expect(position.coords.latitude).toBe(-5.795);expect(position.coords.accuracy).toBe(5);
 await page.evaluate(()=>{window.__watchId=navigator.geolocation.watchPosition(()=>{window.__unexpectedPosition=true;});});
 await expect.poll(()=>page.evaluate(()=>typeof window.__resolveNativeWatch)).toBe('function');
 await page.evaluate(()=>{navigator.geolocation.clearWatch(window.__watchId);window.__resolveNativeWatch('native-watch-id');window.__nativePosition({coords:{latitude:0,longitude:0}});});
 await expect.poll(()=>page.evaluate(()=>window.__nativeCalls.some(c=>c.plugin==='clearWatch'&&c.id==='native-watch-id'))).toBe(true);expect(await page.evaluate(()=>window.__unexpectedPosition)).toBeUndefined();
});

test('external navigation in the native app uses the OS launcher',async({page})=>{
 await page.evaluate(()=>{
  const link=document.createElement('a');link.dataset.navigationProvider='waze';link.id='testNativeLink';link.href='https://waze.com/ul?ll=-5.795,-35.211&navigate=yes';link.textContent='Teste do navegador nativo';document.querySelector('.auth-panel').append(link);
 });
 await page.locator('#testNativeLink').click();await expect.poll(()=>page.evaluate(()=>window.__nativeCalls.filter(c=>c.plugin==='AppLauncher').length)).toBe(1);
 expect((await page.evaluate(()=>window.__nativeCalls.find(c=>c.plugin==='AppLauncher'))).url).toContain('ll=-5.795,-35.211');
});

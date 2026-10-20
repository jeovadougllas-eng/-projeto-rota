import {_android as android} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const [device]=await android.devices();if(!device)throw Error('No Android emulator available.');
await device.shell('am start -n app.traxio.mobile/.MainActivity');
const view=await device.webView({pkg:'app.traxio.mobile'}),page=await view.page();
await page.locator('body.traxio-ui-ready').waitFor({timeout:60000});
if(await page.evaluate(()=>innerWidth)<=650&&await page.locator('.auth-approved-scene>.original-login-art').isVisible())throw Error('Duplicate background wordmark on a small screen.');
await page.locator('#authSocial [data-provider="google"]').waitFor();await page.locator('#authSocial [data-provider="azure"]').waitFor();
const native=await page.evaluate(()=>({native:Capacitor.isNativePlatform(),platform:Capacitor.getPlatform(),geo:Capacitor.isPluginAvailable('Geolocation'),launcher:Capacitor.isPluginAvailable('AppLauncher'),browser:Capacitor.isPluginAvailable('Browser'),redirect:TraxioNative.authRedirect}));
if(!native.native||native.platform!=='android'||!native.geo||!native.launcher||!native.browser||native.redirect!=='app.traxio.mobile://auth/callback')throw Error('Native bridge or GPS plugin missing.');
await device.shell('pm grant app.traxio.mobile android.permission.ACCESS_FINE_LOCATION');await device.shell('pm grant app.traxio.mobile android.permission.ACCESS_COARSE_LOCATION');
const emit=()=>execFileSync('adb',['emu','geo','fix','-35.211','-5.795'],{stdio:'ignore'});emit();const gpsTimer=setInterval(emit,2000);
let position;try{position=await page.evaluate(()=>new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy}),reject,{enableHighAccuracy:true,timeout:30000,maximumAge:10000})));}finally{clearInterval(gpsTimer);}
if(Math.abs(position.lat+5.795)>.01||Math.abs(position.lon+35.211)>.01)throw Error('Unexpected simulated GPS location.');
await mkdir('mobile/evidence',{recursive:true});await page.screenshot({path:'mobile/evidence/android-login.png'});await writeFile('mobile/evidence/android-runtime.json',JSON.stringify({native,position,simulated:true},null,2));
console.log('Android installed and launched: approved interface, OAuth buttons, native bridge, GPS permission and simulated coordinates verified.');
await device.close();

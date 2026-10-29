import{expect}from'playwright/test';import{writeFile}from'node:fs/promises';import{execFileSync}from'node:child_process';
export async function verifyNavigationCamera({page,evidence}){
 await page.evaluate(()=>window.__fieldGPS({coords:{latitude:-5.80,longitude:-35.219,accuracy:8,heading:90,speed:7},timestamp:Date.now()}));
 await expect.poll(()=>page.evaluate(()=>Math.round(TraxeloNavigationModel.normalizeBearing(map.getBearing())))).toBe(90);
 await expect(page.locator('#navigationRecenter')).toBeHidden();
 await page.locator('#map .maplibregl-ctrl-zoom-in').click();await expect(page.locator('#navigationRecenter')).toBeVisible();
 expect(await page.evaluate(()=>TraxeloNavigation.state().following)).toBe(false);
 await page.evaluate(()=>window.__fieldGPS({coords:{latitude:-5.80,longitude:-35.2188,accuracy:8,heading:180,speed:7},timestamp:Date.now()}));
 expect(Math.round(await page.evaluate(()=>TraxeloNavigationModel.normalizeBearing(map.getBearing())))).toBe(90);
 await page.locator('#navigationRecenter').click();await expect.poll(()=>page.evaluate(()=>Math.round(TraxeloNavigationModel.normalizeBearing(map.getBearing())))).toBe(180);
 expect(await page.evaluate(()=>TraxeloNavigation.state().following&&TraxeloNavigation.state().tracking)).toBe(true);
 await expect(page.locator('#navigationRecenter')).toBeHidden();
 await writeFile('mobile/evidence/android-course-up-and-recenter.png',execFileSync('adb',['exec-out','screencap','-p'],{maxBuffer:20000000}));
 evidence.checks.push('Real MapLibre in the installed Android WebView rotates to simulated GPS course; native zoom pauses camera follow, GPS remains active and Recenter restores course-up navigation');
}

import{expect}from'playwright/test';import{writeFile}from'node:fs/promises';import{execFileSync}from'node:child_process';
export async function verifyInterfaceTheme({page,evidence}){
 await expect(page.locator('#mobileNavToggle,.mobile-nav-toggle,.nav-backdrop')).toHaveCount(0);
 const icons=await page.locator('.tabs .kit-nav-icon').evaluateAll(ns=>ns.map(n=>n.innerHTML));
 for(const tab of['painel','clientes','mapa','historico','dados']){await page.locator('[data-tab='+tab+']').click();await expect(page.locator('body')).toHaveAttribute('data-screen',tab);await expect(page.locator('nav.tabs')).toBeVisible();}
 await page.locator('[data-tab=painel]').click();if(await page.locator('body').evaluate(n=>n.classList.contains('traxio-dark')))await page.locator('#themeToggle').click();
 const scene=()=>page.locator('.app-scenery img').evaluate(n=>{const s=getComputedStyle(n);return{src:n.getAttribute('src'),fit:s.objectFit,position:s.objectPosition,opacity:s.opacity,filter:s.filter};});
 const before=await scene();const light=await page.locator('#painel .stat').first().evaluate(n=>getComputedStyle(n).backgroundColor);expect(Number(light.match(/[\d.]+/g)[0])).toBeGreaterThan(220);
 await writeFile('mobile/evidence/android-theme-light.png',execFileSync('adb',['exec-out','screencap','-p'],{maxBuffer:20000000}));await page.locator('#themeToggle').click();const dark=await page.locator('#painel .stat').first().evaluate(n=>getComputedStyle(n).backgroundColor);expect(Number(dark.match(/[\d.]+/g)[0])).toBeLessThan(40);expect(await scene()).toEqual(before);expect(await page.locator('.tabs .kit-nav-icon').evaluateAll(ns=>ns.map(n=>n.innerHTML))).toEqual(icons);
 await writeFile('mobile/evidence/android-theme-dark.png',execFileSync('adb',['exec-out','screencap','-p'],{maxBuffer:20000000}));
 evidence.checks.push('All five sidebar pages remain usable without the duplicate header menu; light/dark surfaces visibly differ while scenic image rendering and menu icons remain identical');
}

import { test, expect } from 'playwright/test';
import { prepare, ready } from './fixtures/browser.js';

test('login — approved composition',async({page},testInfo)=>{
  await prepare(page,{authenticated:false,theme:testInfo.project.metadata.theme}); await ready(page);
  await expect(page.getByRole('heading',{name:'Acesse sua conta'})).toBeVisible();
  await expect(page.locator('.auth-brand-panel .brand-crop img')).toHaveAttribute('src','assets/visual-kit/assets/login_hero_reference.png');
  await expect(page).toHaveScreenshot('login.png',{animations:'disabled'});
});

for(const [id,name] of [['painel','Painel'],['clientes','Clientes'],['mapa','Mapa e Rotas'],['historico','Histórico'],['dados','Planilhas']]) {
  test(`${name} — desktop/tablet/phone and theme`,async({page},testInfo)=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await prepare(page,{theme:testInfo.project.metadata.theme});await ready(page);
    await page.locator(`.tabs [data-tab="${id}"]`).click();
    await expect(page.locator('#'+id)).toBeVisible();
    await expect(page.locator('#total')).toHaveText('157');
    if(id==='painel'){const copy=page.locator('.traxio-hero h2');await expect(copy).toContainText('Seu território');expect(await copy.evaluate(n=>getComputedStyle(n).clipPath)).toBe('none');expect((await copy.boundingBox()).width).toBeGreaterThan(100);}
    await expect(page).toHaveScreenshot(`${id}.png`,{animations:'disabled'});
    const overflow=await page.locator('main').evaluate(n=>n.scrollWidth>n.clientWidth+1);
    expect(overflow).toBe(false); expect(errors).toEqual([]);
  });
}

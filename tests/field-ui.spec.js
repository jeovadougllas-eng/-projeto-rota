import {test,expect} from 'playwright/test';
import {prepare,ready} from './fixtures/browser.js';
import {records,fakeMap} from './fixtures/routing.js';
import {setup as setupAgenda,appointment} from './fixtures/scheduling.js';
const rows=records.map((c,i)=>({...c,cnpj:'123456780001'+String(90+i),...(i===3?{locationVerification:'imported_coordinates'}:{})}));
const errors=new WeakMap();
test.beforeEach(({page})=>{errors.set(page,[]);page.on('pageerror',e=>errors.get(page).push(e.message));});
test.afterEach(({page})=>expect(errors.get(page)).toEqual([]));
async function setup(page,theme='dark'){
 await prepare(page,{records:rows,theme,lockAuthFixture:true});
 if(process.env.TRAXELO_PWA_BASE)await page.route(process.env.TRAXELO_PWA_BASE+'/**',r=>r.continue());
 await ready(page);await page.waitForFunction(()=>!!window.RotaMapaFieldUI);await fakeMap(page);
}
test('all six screens keep the approved scenes, responsive navigation and readable themes',async({page},info)=>{
 await setup(page);const original=await page.evaluate(()=>localStorage.getItem('projeto_rota_mapa_v1'));
 for(const theme of ['dark','light']){
  if((await page.locator('body').evaluate(b=>b.classList.contains('traxio-dark')))!==(theme==='dark'))await page.locator('#themeToggle').click();
  for(const tab of ['painel','clientes','mapa','agendamentos','historico','dados']){
   await page.locator(`nav.tabs [data-tab=${tab}]`).click();await expect(page.locator('#'+tab)).toBeVisible();
   await expect(page.locator('#'+tab+' .field-hero-image')).toHaveAttribute('src',new RegExp('assets/scenes/'+({agendamentos:'historico'}[tab]||tab)+'.webp'));
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   expect(await page.locator('.tabs [aria-current=page]').getAttribute('data-tab')).toBe(tab);
   await page.screenshot({path:info.outputPath(tab+'-'+theme+'.png')});
  }
 }
 expect(await page.evaluate(()=>localStorage.getItem('projeto_rota_mapa_v1'))).toBe(original);
});
test('dashboard puts the real portfolio and main route action before live counters',async({page})=>{
 await setup(page);
 expect(await page.locator('#painel').evaluate(n=>[...n.children].slice(0,4).map(c=>c.id||c.className))).toEqual(['traxio-hero','portfolioPanel','fieldNextStep','card dashboard-overview']);
 await expect(page.locator('#total')).toHaveText(String(rows.length));await expect(page.locator('#locationRecoveryText')).toHaveText('1 ponto para revisar');
 await page.locator('#fieldPortfolioManagement>summary').click();await expect(page.locator('#updatePortfolio')).toBeVisible();await expect(page.locator('#portfolioVersions')).toBeVisible();
 await page.locator('#fieldNextStep button').click();await expect(page.locator('body')).toHaveAttribute('data-screen','mapa');
});
test('customer cards retain CNPJ search, selection, contrast and complete client details',async({page})=>{
 await setup(page);await page.locator('[data-tab=clientes]').click();
 await page.locator('#registrySearch').fill('12.345.678/0001-91');await expect(page.locator('#registryRows tr')).toHaveCount(1);
 await expect(page.locator('#registryRows .client-cnpj')).toHaveText('12.345.678/0001-91');
 await page.locator('#registryRows input').check();expect(await page.evaluate(()=>[...selectedIds])).toEqual(['2']);
 const badge=await page.locator('#registryRows .registry-location-status').evaluate(n=>({fg:getComputedStyle(n).color,bg:getComputedStyle(n).backgroundColor}));expect(badge.fg).toBe('rgb(23, 76, 35)');expect(badge.bg).toBe('rgb(212, 243, 167)');
 await page.locator('#registryRows .client-link').click();await expect(page.locator('#clientDialog')).toBeVisible();await expect(page.locator('#clientDetail')).toContainText(rows[1].name);
});
test('map filters expose their results immediately and focused pins retain manual adjustment',async({page})=>{
 await setup(page);await page.locator('[data-tab=mapa]').click();
 expect(await page.locator('#priorityFilters').evaluate(n=>n.nextElementSibling.id)).toBe('mapClientListDisclosure');
 await page.locator('#mapClientListDisclosure>summary').click();await page.locator('#mapClientSearch').fill('12345678000190');await expect(page.locator('#mapClientList .client-tile')).toHaveCount(1);
 await page.evaluate(()=>TraxeloMapActions.showClient(1,{fly:false}));await expect(page.locator('#focusedClientNavigate')).toBeVisible();
 await page.locator('#focusedClientAdjust').click();await expect(page.locator('#pinConfirmPanel')).toBeVisible();await expect(page.locator('#backToClient')).toBeVisible();
 await page.locator('#cancelClientPin').click();expect(await page.evaluate(()=>clients[0].lat)).toBe(rows[0].lat);
});
test('history shows actual visit bars and preserves sales, visits and advanced reporting',async({page})=>{
 await setup(page);await page.locator('[data-tab=historico]').click();
 await expect(page.locator('#visitMetrics [data-visit-list]')).toHaveCount(4);await expect(page.locator('#visitDailyChart svg')).toBeVisible();
 await page.locator('#fieldReportSettings>summary').click();await page.locator('#newVisit').click();await page.locator('#visitEntryClient').selectOption('1');await page.locator('#visitEntryConfirm').check();await page.locator('#saveVisitEntry').click();
 if(await page.locator('#visitSaleLater').isVisible())await page.locator('#visitSaleLater').click();
 await expect(page.locator('#visitMetrics [data-visit-list=visits] strong')).toHaveText('1');
 await expect(page.locator('#visitDailyChart rect title').filter({hasText:': 1 visita(s)'})).toHaveCount(1);
 await page.locator('#fieldHistoryActions button').first().click();await expect(page.locator('#saleClient')).toBeVisible();
});
test('import surface opens the native file chooser and hands the name to existing confirmation',async({page})=>{
 await setup(page);await page.locator('[data-tab=dados]').click();await page.locator('#fieldImportName').fill('Carteira teste de campo');
 const chooser=page.waitForEvent('filechooser');await page.locator('.field-upload').click();await chooser;
 const original=await page.evaluate(()=>localStorage.getItem('projeto_rota_mapa_v1'));
 await page.evaluate(()=>RotaMapaPortfolios.beginImport({fileName:'teste.csv',rows:[['Nome','CNPJ'],['Cliente teste','12345678000190']]}));
 await expect(page.locator('#portfolioNameDialog')).toBeVisible();await expect(page.locator('#portfolioName')).toHaveValue('Carteira teste de campo');
 expect(await page.evaluate(()=>localStorage.getItem('projeto_rota_mapa_v1'))).toBe(original);
});
test('agenda timeline uses saved hours and keeps editing behind explicit visit options',async({page})=>{
 await setupAgenda(page,{rows:[appointment('a','1','2026-11-05','09:00'),appointment('b','2','2026-11-06','14:30')],clock:'2026-11-05T10:00:00-03:00'});
 await page.locator('#appointmentListTab').click();await expect(page.locator('#appointmentList .field-appointment-time')).toHaveText(['09:00','14:30']);
 await page.locator('#appointmentList .field-disclosure>summary').first().click();await page.locator('#appointmentList').getByRole('button',{name:'Editar',exact:true}).first().click();await expect(page.locator('#scheduleTime')).toHaveValue('09:00');
});

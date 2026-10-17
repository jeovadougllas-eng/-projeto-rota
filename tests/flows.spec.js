import { test, expect } from 'playwright/test';
import { prepare, ready } from './fixtures/browser.js';
import { clients } from './fixtures/clients.js';

test.beforeEach(async({page},testInfo)=>{await prepare(page,{theme:testInfo.project.metadata.theme});await ready(page);});

test('filters and dialog retain complete client data',async({page})=>{
  await page.locator('.tabs [data-tab="clientes"]').click();
  await expect(page.locator('#registryCount')).toHaveText('157 clientes');
  await page.locator('#registrySearch').fill('GUARARAPES');
  await expect(page.locator('#registryRows tr')).toHaveCount(1);
  await page.locator('#registryRows .client-link').click();
  await expect(page.locator('#clientDialog')).toBeVisible();
  await expect(page.locator('#clientDetail')).toContainText('Dados originais da planilha');
  await page.locator('#detailEdit').click();
  await expect(page.locator('#clientEditDialog')).toBeVisible();
  await expect(page.locator('#name')).toHaveValue(clients[2].name);
  await page.locator('#name').fill(clients[2].name+' — EDITADO');await page.locator('#saveClient').click();
  await expect(page.locator('#clientEditDialog')).not.toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('projeto_rota_mapa_v1')));
  expect(saved).toHaveLength(157);expect(saved[2].importFields).toEqual(clients[2].importFields);expect(saved[2].name).toContain('EDITADO');
});

test('city, neighborhood, category and selection filters',async({page})=>{
  await page.locator('.tabs [data-tab="clientes"]').click();
  await page.locator('#registryCity').selectOption('Parnamirim');await expect(page.locator('#registryCount')).toHaveText('7 clientes de 157');
  await page.locator('#registrySelectAll').check();await expect(page.locator('#registrySelection')).toHaveText('7 clientes selecionados');
  await page.locator('#registryClear').click();await expect(page.locator('#registryCount')).toHaveText('157 clientes');
  await page.locator('#registryNeighborhood').selectOption('Tirol');await expect(page.locator('#registryCount')).toContainText('26 clientes');
  await page.locator('#registryPlan').click();await expect(page.locator('#mapa')).toBeVisible();
  await expect(page.locator('#selectedCount')).toContainText('7 selecionados');
});

test('theme, account menu, settings dialog and keyboard',async({page})=>{
  const before=await page.locator('body').evaluate(n=>n.classList.contains('traxio-dark'));
  await page.locator('#themeToggle').click();expect(await page.locator('body').evaluate(n=>n.classList.contains('traxio-dark'))).toBe(!before);
  await page.locator('#accountToggle').click();await expect(page.locator('#accountMenu')).toBeVisible();
  await page.locator('[data-account="settings"]').click();await expect(page.locator('#accountDialog')).toBeVisible();
  await page.locator('#accountSettings [name="theme"]').selectOption('dark');await expect(page.locator('body')).toHaveClass(/traxio-dark/);
  await page.keyboard.press('Escape');await expect(page.locator('#accountDialog')).toBeHidden();
  await page.reload();await expect(page.locator('body')).toHaveClass(/traxio-dark/);
});

test('quick actions, data accordions and weekly planner',async({page})=>{
  await page.getByRole('button',{name:'Importar clientes',exact:true}).click();await expect(page.locator('#dados')).toBeVisible();
  await page.locator('.traxio-data-guide button').nth(3).click();await expect(page.getByText('Baixar backup JSON',{exact:true})).toBeVisible();
  await page.locator('.tabs [data-tab="mapa"]').click();await page.locator('#route-mode-weekly').click();
  await expect(page.locator('#visitDate')).toBeVisible();await page.locator('#saveVisitDay').click();await expect(page.locator('#visitDayStatus')).toContainText('selecione os clientes');
  await page.locator('#route-mode-cities').click();await page.locator('#tripCity').selectOption({label:'Parnamirim'});await expect(page.locator('#regionCity')).toHaveValue('parnamirim');
});

test('JSON backup contains all 157 original records',async({page})=>{
  await page.locator('.tabs [data-tab="dados"]').click();
  await page.locator('.traxio-data-expand').nth(1).locator('summary').click();
  const downloadPromise=page.waitForEvent('download');await page.locator('#backup').click();const download=await downloadPromise;
  const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);
  const data=JSON.parse(Buffer.concat(chunks).toString());expect(Array.isArray(data)?data:data.clients).toHaveLength(157);
});

test('pin adjustment returns to the editor and keeps the unsaved client',async({page})=>{
  await page.evaluate(()=>{const rows=JSON.parse(localStorage.getItem('projeto_rota_mapa_v1'));rows[0].lat=-5.795;rows[0].lon=-35.211;localStorage.setItem('projeto_rota_mapa_v1',JSON.stringify(rows));});
  await page.reload();await page.locator('body.traxio-ui-ready').waitFor();
  await page.locator('.tabs [data-tab="clientes"]').click();
  await page.locator('#registryRows .client-link').first().click();await page.locator('#detailEdit').click();
  await page.locator('#name').fill('RASCUNHO DE CLIENTE');
  await page.locator('#adjustPin').click();await expect(page.locator('#clientEditDialog')).toBeHidden();
  await expect(page.locator('#backToClient')).toBeVisible();await page.locator('#backToClient').click();
  await expect(page.locator('#clientEditDialog')).toBeVisible();await expect(page.locator('#name')).toHaveValue('RASCUNHO DE CLIENTE');
  await expect(page.locator('#lat')).toHaveValue('-5.795');await page.keyboard.press('Escape');
  await page.locator('.tabs [data-tab="mapa"]').click();await page.locator('#mapClientListDisclosure summary').click();
  await page.locator('#mapClientList').getByRole('button',{name:'Localizar cliente',exact:true}).first().click();
  await expect(page.locator('#clientEditDialog')).toBeVisible();
  await page.locator('#adjustPin').click();await expect(page.locator('#clientEditDialog')).toBeVisible();
  await expect(page.locator('#saveStatus')).toContainText('Primeiro escolha uma sugestão');
});

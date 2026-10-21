import { test, expect } from 'playwright/test';
import { prepare, ready } from './fixtures/browser.js';

test.beforeEach(async({page},testInfo)=>{await prepare(page,{authenticated:false,theme:testInfo.project.metadata.theme});await ready(page);});
for(const provider of ['google','azure'])test('OAuth contract: '+provider,async({page})=>{
  await page.locator(`[data-provider="${provider}"]`).click();
  const calls=await page.evaluate(()=>window.__oauthCalls);expect(calls).toHaveLength(1);expect(calls[0].provider).toBe(provider);
  expect(calls[0].options.redirectTo).toBe('http://127.0.0.1:4173/');
  if(provider==='azure')expect(calls[0].options.scopes).toBe('email openid profile');
  expect(await page.evaluate(()=>window.__dataCalls)).toEqual([]);
});
test('password visibility and original password login',async({page})=>{
  await page.locator('#authEmail').fill('teste@exemplo.com');await page.locator('#authPassword').fill('test-password');
  await page.getByRole('button',{name:'Mostrar senha'}).click();await expect(page.locator('#authPassword')).toHaveAttribute('type','text');
  await page.locator('#authLogin').click();await expect(page.locator('#authScreen')).toBeHidden();
  const calls=await page.evaluate(()=>window.__passwordCalls);expect(calls[0].email).toBe('teste@exemplo.com');
});
test('register and recovery forms remain available',async({page})=>{
  await page.locator('#authRegisterToggle').click();await expect(page.locator('#authRegisterForm')).toBeVisible();
  await page.locator('#authBack').click();await expect(page.locator('#authForm')).toBeVisible();
  await page.locator('#authForgotToggle').click();await expect(page.locator('#authForgotForm')).toBeVisible();
});

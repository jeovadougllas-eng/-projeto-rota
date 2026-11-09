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

test('repeated Web callbacks exchange the same PKCE code only once',async({page})=>{
 await page.evaluate(async()=>{
  history.replaceState(null,'','/?code=synthetic-callback');
  await Promise.all([authInitialize(),authInitialize()]);
  history.replaceState(null,'','/?code=synthetic-callback');
  await authInitialize();
 });
 await expect(page.locator('#authScreen')).toBeHidden();
 expect(await page.evaluate(()=>window.__exchangeCalls)).toEqual(['synthetic-callback']);
 expect(new URL(page.url()).search).toBe('');
});

test('missing verifier leaves the account and its local data intact and explains the same-origin return',async({page})=>{
 const before=await page.evaluate(()=>localStorage.getItem('projeto_rota_mapa_v1'));
 await page.evaluate(async()=>{
  authClient.auth.exchangeCodeForSession=async()=>({data:{session:null},error:{name:'AuthApiError',message:'both auth code and code verifier should be non-empty private-provider-detail'}});
  history.replaceState(null,'','/?code=synthetic-invalid');await authInitialize();
 });
 await expect(page.locator('#authScreen')).toBeVisible();
 await expect(page.locator('#authMessage')).toContainText('mesmo navegador');
 await expect(page.locator('#authMessage')).not.toContainText('private-provider-detail');
 expect(await page.evaluate(()=>localStorage.getItem('projeto_rota_mapa_v1'))).toBe(before);
 expect(await page.evaluate(()=>window.__dataCalls)).toEqual([]);
});

test('fallback login and registration preserve RotaMapa textual identity',async({page})=>{
 await expect(page.locator('.scene-brand')).toContainText('RotaMapa');
 await page.locator('#authRegisterToggle').click();
 await expect(page.locator('#authRegisterForm h2')).toHaveText('Criar conta RotaMapa');
});

import {test,expect} from 'playwright/test';
import {prepare,ready} from './fixtures/browser.js';

test('account menu, settings, client details and editor — visual review',async({page},testInfo)=>{
  await prepare(page,{theme:testInfo.project.metadata.theme});await ready(page);
  await page.locator('#accountToggle').click();
  await expect(page.locator('#accountMenu')).toBeVisible();
  await expect(page).toHaveScreenshot('account-menu.png',{animations:'disabled'});
  await page.locator('[data-account="settings"]').click();
  await expect(page.locator('#accountDialog')).toBeVisible();
  await expect(page).toHaveScreenshot('settings-dialog.png',{animations:'disabled'});
  await page.keyboard.press('Escape');
  await page.locator('.tabs [data-tab="clientes"]').click();
  await page.locator('#registryRows .client-link').first().click();
  await expect(page.locator('#clientDialog')).toBeVisible();
  await expect(page).toHaveScreenshot('client-details.png',{animations:'disabled'});
  await page.locator('#detailEdit').click();
  await expect(page.locator('#clientEditDialog')).toBeVisible();
  await expect(page).toHaveScreenshot('client-editor.png',{animations:'disabled'});
  const bounds=await page.locator('#clientEditDialog').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x+bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
});


test('registration and password recovery — visual review',async({page},testInfo)=>{
  await prepare(page,{authenticated:false,theme:testInfo.project.metadata.theme});await ready(page);
  await page.locator('#authRegisterToggle').click();await expect(page.locator('#authRegisterForm')).toBeVisible();
  if(page.viewportSize().width<=650)await expect(page.locator('.auth-approved-scene>.original-login-art')).toBeHidden();
  await expect(page).toHaveScreenshot('register.png',{animations:'disabled'});
  await page.locator('#authBack').click();await page.locator('#authForgotToggle').click();
  await expect(page.locator('#authForgotForm')).toBeVisible();
  await expect(page).toHaveScreenshot('recovery.png',{animations:'disabled'});
});

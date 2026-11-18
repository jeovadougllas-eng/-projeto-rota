import{defineConfig}from'playwright/test';import base from'./playwright.pwa-updates.config.js';
export default defineConfig({...base,testMatch:'pwa-update-guards.spec.js',use:{...base.use,baseURL:'https://traxio-preview.vercel.app',serviceWorkers:'block'},webServer:undefined,outputDir:'test-results-pwa-update-published',reporter:'list'});

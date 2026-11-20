import{defineConfig}from'playwright/test';import base from'./playwright.route-flow-published.config.js';export default defineConfig({...base,testMatch:'order-excel.spec.js'});

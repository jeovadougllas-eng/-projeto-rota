import{defineConfig}from'playwright/test';import base from'./playwright.topics.config.js';
export default defineConfig({...base,testMatch:'topics.spec.js',outputDir:'test-results-topics-published',use:{...base.use,baseURL:'https://traxio-preview.vercel.app',serviceWorkers:'block'},webServer:undefined});

import{defineConfig}from'playwright/test';import base from'./playwright.config.js';
export default defineConfig({...base,testMatch:['topics.spec.js','future-campaign.spec.js','client-export.spec.js'],timeout:90000,workers:2,reporter:'list',outputDir:'test-results-topics',use:{...base.use,serviceWorkers:'block'},projects:base.projects.filter(p=>['desktop-light','phone-light'].includes(p.name))});

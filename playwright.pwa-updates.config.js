import{defineConfig}from'playwright/test';import base from'./playwright.config.js';
export default defineConfig({...base,testMatch:['pwa-updates.spec.js','pwa-update-guards.spec.js'],projects:base.projects.filter(p=>['desktop-light','phone-light'].includes(p.name)),timeout:60000,workers:1,outputDir:'test-results-pwa-updates'});

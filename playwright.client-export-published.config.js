import{defineConfig}from'playwright/test';import base from'./playwright.future-campaign-published.config.js';
export default defineConfig({...base,testMatch:'client-export.spec.js',timeout:120000,outputDir:'test-results-client-export-published'});

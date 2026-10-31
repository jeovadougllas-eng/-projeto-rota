import{defineConfig}from'playwright/test';import iphone from'./playwright.iphone.config.js';
export default defineConfig({...iphone,testMatch:['visit-details.spec.js','visits.spec.js','commerce.spec.js'],workers:2,timeout:45000,reporter:[['list'],['json',{outputFile:'test-results-visit-details/results.json'}]],outputDir:'test-results-visit-details'});

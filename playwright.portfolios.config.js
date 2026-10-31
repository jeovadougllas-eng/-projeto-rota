import{defineConfig}from'playwright/test';import iphone from'./playwright.iphone.config.js';
export default defineConfig({...iphone,testMatch:['portfolios.spec.js','visit-details.spec.js','commerce.spec.js','visits.spec.js'],workers:2,timeout:45000,reporter:[['list'],['json',{outputFile:'test-results-portfolios/results.json'}]],outputDir:'test-results-portfolios'});

import {defineConfig}from'playwright/test';import base from'./playwright.iphone.config.js';
export default defineConfig({...base,testMatch:'premium.spec.js',timeout:45000,outputDir:'test-results-premium',reporter:[['list'],['json',{outputFile:'test-results-premium/results.json'}]]});

import {defineConfig} from 'playwright/test';import iphone from './playwright.iphone.config.js';
export default defineConfig({...iphone,testMatch:['commerce.spec.js','visits.spec.js'],workers:2,timeout:45000,reporter:[['list'],['json',{outputFile:'test-results-commerce-final/results.json'}]],outputDir:'test-results-commerce-final'});

import {defineConfig} from 'playwright/test';import iphone from './playwright.iphone.config.js';
export default defineConfig({...iphone,testMatch:['commerce.spec.js','visits.spec.js','field-navigation.spec.js'],workers:2,timeout:45000,reporter:[['list'],['json',{outputFile:'test-results-commerce-release/results.json'}]],outputDir:'test-results-commerce-release'});

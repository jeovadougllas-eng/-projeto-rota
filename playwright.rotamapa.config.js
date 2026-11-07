import {defineConfig} from 'playwright/test';import iphone from './playwright.iphone.config.js';
export default defineConfig({...iphone,testMatch:['field-navigation.spec.js','rotamapa.spec.js','interface-theme.spec.js','iphone-pwa.spec.js'],workers:2,timeout:45000,reporter:[['list'],['json',{outputFile:'test-results-rotamapa/results.json'}]],outputDir:'test-results-rotamapa'});

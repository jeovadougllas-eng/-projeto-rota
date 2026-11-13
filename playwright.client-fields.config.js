import {defineConfig} from 'playwright/test';
import iphone from './playwright.iphone.config.js';
export default defineConfig({...iphone,testMatch:'client-fields.spec.js',reporter:[['list'],['json',{outputFile:'test-results-client-fields/results.json'}]],outputDir:'test-results-client-fields'});

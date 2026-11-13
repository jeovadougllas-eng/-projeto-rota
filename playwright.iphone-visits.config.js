import {defineConfig} from 'playwright/test';import base from './playwright.iphone.config.js';
export default defineConfig({...base,testMatch:'visits.spec.js',projects:base.projects.filter(p=>p.name.startsWith('iphone-')),reporter:[['list'],['json',{outputFile:'test-results-iphone-visits/results.json'}]],outputDir:'test-results-iphone-visits'});

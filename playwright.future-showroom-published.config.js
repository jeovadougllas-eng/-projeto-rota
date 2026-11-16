import {defineConfig} from 'playwright/test';
import base from './playwright.future-campaign-published.config.js';
export default defineConfig({...base,testMatch:'future-showroom.spec.js',outputDir:'test-results-future-showroom-published'});

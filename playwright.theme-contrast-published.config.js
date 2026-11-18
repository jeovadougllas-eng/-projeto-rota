import {defineConfig} from 'playwright/test';
import base from './playwright.future-campaign-published.config.js';
export default defineConfig({...base,testMatch:'theme-contrast-behavior.spec.js',timeout:240000,outputDir:'test-results-contrast-published'});

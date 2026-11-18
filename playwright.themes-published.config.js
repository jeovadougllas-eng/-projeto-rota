import {defineConfig} from 'playwright/test';
import base from './playwright.future-campaign-published.config.js';
// Real-worker offline reload is tested locally; published checks block workers and mock auth/data.
export default defineConfig({...base,testMatch:'themes.spec.js',grepInvert:/preferences gallery/,outputDir:'test-results-themes-published'});

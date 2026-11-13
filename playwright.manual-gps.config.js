import {defineConfig} from 'playwright/test';
import base from './playwright.locations.config.js';
export default defineConfig({...base,testMatch:['manual-gps-pin.spec.js','location-workflow.spec.js'],reporter:'list',outputDir:'test-results-manual-gps'});

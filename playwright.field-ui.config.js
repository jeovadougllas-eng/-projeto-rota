import {defineConfig} from 'playwright/test';
import base from './playwright.iphone.config.js';
export default defineConfig({...base,testMatch:['field-ui.spec.js','interface-theme.spec.js','manual-gps-pin.spec.js','client-identity.spec.js'],timeout:45000,reporter:'list',outputDir:'test-results-field-ui',use:{...base.use,locale:'pt-BR'}});

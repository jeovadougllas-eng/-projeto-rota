import {defineConfig} from 'playwright/test';
import base from './playwright.iphone.config.js';
export default defineConfig({...base,testMatch:'field-published.spec.js',timeout:60000,reporter:'list',outputDir:'test-results-field-published',use:{...base.use,baseURL:'https://traxio-preview.vercel.app',locale:'pt-BR'},webServer:undefined});

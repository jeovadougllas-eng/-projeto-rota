import {defineConfig} from 'playwright/test';
import base from './playwright.iphone.config.js';
export default defineConfig({...base,testMatch:['routes.spec.js','scheduling.spec.js','portfolios.spec.js','location-workflow.spec.js','visit-details.spec.js'],timeout:45000,reporter:'list',outputDir:'test-results-field-regression',use:{...base.use,locale:'pt-BR'}});

import {defineConfig} from 'playwright/test';
import base from './playwright.config.js';
export default defineConfig({...base,testMatch:'future-campaign.spec.js',timeout:60000,workers:1,reporter:'list',outputDir:'test-results-future-published',use:{...base.use,baseURL:'https://traxio-preview.vercel.app',serviceWorkers:'block'},projects:base.projects.filter(p=>['desktop-light','phone-light'].includes(p.name)),webServer:undefined});

import {defineConfig} from 'playwright/test';
import base from './playwright.config.js';
export default defineConfig({...base,testMatch:'billing-notice-dismiss.spec.js',timeout:60000,reporter:'list',use:{...base.use,baseURL:'https://traxio-preview.vercel.app',serviceWorkers:'block'},projects:base.projects.filter(p=>['desktop-light','phone-light'].includes(p.name)),webServer:undefined});

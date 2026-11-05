import {defineConfig} from 'playwright/test';
import base from './playwright.iphone.config.js';
export default defineConfig({...base,testMatch:'registry-filters.spec.js',outputDir:'test-results-registry-filters',reporter:'list',projects:base.projects.filter(p=>['iphone-safari','android-browser','desktop'].includes(p.name))});

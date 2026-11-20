import {defineConfig} from 'playwright/test';import base from './playwright.route-flow-published.config.js';
export default defineConfig({...base,testMatch:['map-overview-scope.spec.js','route-topic-flow.spec.js']});

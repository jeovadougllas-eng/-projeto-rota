import {defineConfig} from 'playwright/test';
import base from './playwright.config.js';
export default defineConfig({...base,testMatch:'themes.spec.js',grep:/copper image|real Feira/,timeout:120000,workers:1,reporter:'list',outputDir:'test-results-themes-webkit',use:{...base.use,browserName:'webkit',launchOptions:{}},projects:[{name:'iphone-webkit',use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3}}]});

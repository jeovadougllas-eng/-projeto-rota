// Chromium with iPhone UI inputs. This exercises the real service worker, not the Safari engine.
import base from './playwright.iphone.config.js';
export default {...base,projects:[{name:'iphone-ui-in-chromium',use:{...base.projects[0].use,browserName:'chromium',launchOptions:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}}}],outputDir:'test-results-pwa-development',reporter:[['list'],['json',{outputFile:'test-results-pwa-development/results.json'}]]};

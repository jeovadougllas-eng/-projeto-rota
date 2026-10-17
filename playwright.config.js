import { defineConfig } from 'playwright/test';

const resolutions = [
  {name:'desktop',width:1440,height:1000},
  {name:'tablet-landscape',width:1024,height:768},
  {name:'tablet-portrait',width:768,height:1024},
  {name:'phone',width:390,height:844}
];
export default defineConfig({
  testDir:'./tests', fullyParallel:true, forbidOnly:!!process.env.CI,
  retries:0, workers:2, maxFailures:4,
  timeout:15000, expect:{timeout:5000,toHaveScreenshot:{maxDiffPixelRatio:0.005}},
  reporter:[['list'],['html',{open:'never'}],['json',{outputFile:'test-results/results.json'}]],
  outputDir:'test-results',
  use:{baseURL:'http://127.0.0.1:4173',browserName:'chromium',trace:'retain-on-failure',screenshot:'only-on-failure',launchOptions:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {}},
  projects:resolutions.flatMap(({name,width,height})=>['light','dark'].map(theme=>({name:`${name}-${theme}`,use:{viewport:{width,height},colorScheme:theme},metadata:{theme}}))),
  webServer:{command:'node scripts/serve.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:15000}
});

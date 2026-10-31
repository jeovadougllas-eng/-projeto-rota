import {defineConfig} from 'playwright/test';
const safari='Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',chromeIOS='Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.41 Mobile/15E148 Safari/604.1';
const chrome=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}}:{};
export default defineConfig({testDir:'./tests',testMatch:'iphone-pwa.spec.js',workers:2,retries:0,timeout:35000,expect:{timeout:7000},reporter:[['list'],['json',{outputFile:'test-results-iphone/results.json'}]],outputDir:'test-results-iphone',use:{baseURL:process.env.TRAXELO_PWA_BASE||'http://127.0.0.1:4173',screenshot:'only-on-failure',trace:'retain-on-failure'},projects:[
 {name:'iphone-safari',use:{browserName:'webkit',userAgent:safari,viewport:{width:390,height:844},isMobile:true,hasTouch:true}},
 {name:'iphone-chrome',use:{browserName:'webkit',userAgent:chromeIOS,viewport:{width:390,height:844},isMobile:true,hasTouch:true}},
 {name:'iphone-small',use:{browserName:'webkit',userAgent:safari,viewport:{width:320,height:568},isMobile:true,hasTouch:true}},
 {name:'iphone-landscape',use:{browserName:'webkit',userAgent:safari,viewport:{width:844,height:390},isMobile:true,hasTouch:true}},
 {name:'android-browser',use:{...chrome,browserName:'chromium',userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',viewport:{width:390,height:844}}},
 {name:'desktop',use:{...chrome,browserName:'chromium',viewport:{width:1440,height:1000}}}
],webServer:process.env.TRAXELO_PWA_BASE?undefined:{command:'node tests/fixtures/iphone-server.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI}});

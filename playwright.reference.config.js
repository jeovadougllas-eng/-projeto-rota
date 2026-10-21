import {defineConfig} from 'playwright/test';
export default defineConfig({
  testDir:'./tests',testMatch:'reference.spec.js',fullyParallel:false,workers:1,
  timeout:60000,retries:0,reporter:'list',outputDir:'test-results-reference',
  use:{baseURL:process.env.TRAXIO_REVIEW_ORIGIN||'http://127.0.0.1:4173',browserName:'chromium',screenshot:'only-on-failure'},
  webServer:{command:'node scripts/serve.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI}
});

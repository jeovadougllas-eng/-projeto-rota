// Keep all account/provider requests mocked. Only static files from the deployed app are real.
import{test}from'playwright/test';
const origin='https://traxio-preview.vercel.app';
if(new URL(process.env.TRAXELO_PWA_BASE||origin).origin!==origin)throw Error('Use the established RotaMapa test deployment.');
test.beforeEach(async({page})=>{const register=page.route.bind(page);page.route=(pattern,handler,options)=>register(pattern,route=>{
 const staticIsolationRule=pattern instanceof RegExp&&pattern.source.includes('127');
 if(staticIsolationRule&&new URL(route.request().url()).origin===origin)return route.continue();
 return handler(route);
},options);});
await import('./billing.spec.js');
await import('./buyer-routes.spec.js');
await import('./plan-testing.spec.js');
await import('./portfolio-update.spec.js');

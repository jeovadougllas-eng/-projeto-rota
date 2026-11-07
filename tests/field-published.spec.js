// Real deployed static files; synthetic accounts and intercepted provider/data requests.
import {test} from 'playwright/test';
const origin='https://traxio-preview.vercel.app';
if(new URL(process.env.TRAXELO_PWA_BASE||origin).origin!==origin)throw Error('Use the established RotaMapa deployment.');
test.beforeEach(({page})=>{
 const register=page.route.bind(page);
 page.route=(pattern,handler,options)=>register(pattern,route=>{
  const url=new URL(route.request().url()),isolation=pattern instanceof RegExp&&pattern.source.includes('127');
  const staticFile=url.pathname==='/'||url.pathname==='/index.html'||url.pathname.startsWith('/assets/')||/^\/iphone(?:-sw\.js|-offline\.html|\.webmanifest)$/.test(url.pathname);
  if(isolation&&url.origin===origin&&staticFile)return route.continue();
  return handler(route);
 },options);
});
await import('./field-ui.spec.js');
await import('./interface-theme.spec.js');

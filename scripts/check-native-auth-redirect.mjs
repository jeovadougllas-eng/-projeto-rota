import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';

const authBase='https://ggsptbcgpdakxsdjrldd.supabase.co/auth/v1/';
const appReturn='app.traxio.mobile://auth/callback';
const rejectedReturn='https://traxio-invalid-redirect.example/native-auth-check';
const publicKey='sb_publishable_n0MBYWwtja-mxyrzGJ-yVA_otDB8Kwn';
const results=[];
const baseOf=url=>url.protocol+'//'+url.host+url.pathname;
const request=url=>fetch(url,{redirect:'manual',headers:{apikey:publicKey},signal:AbortSignal.timeout(20000)});
async function check(provider,redirectTo,allowed){
 const challenge=createHash('sha256').update(randomBytes(32)).digest('base64url');
 const authorize=new URL('authorize',authBase);
 for(const [key,value] of Object.entries({provider,redirect_to:redirectTo,code_challenge:challenge,code_challenge_method:'s256',...(provider==='azure'?{scopes:'email openid profile'}:{})}))authorize.searchParams.set(key,value);
 const start=await request(authorize);
 if(start.status!==302){const data=await start.json().catch(()=>({}));console.log(JSON.stringify({provider,stage:'authorize',status:start.status,errorCode:data.error_code||data.code,message:data.msg||data.error_description||data.error||'Provider did not start'}));}
 assert.equal(start.status,302,provider+': Supabase did not start the provider redirect.');
 const location=new URL(start.headers.get('location'));
 assert.ok(provider==='google'?location.hostname==='accounts.google.com':location.hostname==='login.microsoftonline.com',provider+': Unexpected identity provider.');
 const state=location.searchParams.get('state');assert.ok(state,provider+': Missing OAuth state.');
 const callback=new URL('callback',authBase);
 callback.searchParams.set('state',state);callback.searchParams.set('error','access_denied');callback.searchParams.set('error_description','Traxio controlled cancellation test');
 const returned=await request(callback);
 assert.equal(returned.status,302,provider+': Supabase did not return the canceled flow.');
 const target=new URL(returned.headers.get('location'));
 const actual=baseOf(target);
 assert.ok(!target.searchParams.has('code')&&!target.hash.includes('access_token='),'Cancellation must not generate a session.');
 if(allowed)assert.equal(actual,appReturn,provider+': The return URL was not accepted; check Supabase Redirect URLs.');
 else{assert.notEqual(actual,rejectedReturn,'An unapproved redirect was accepted.');assert.notEqual(actual,appReturn,'The default Site URL appears to have been changed to the native return.');}
 const evidence={provider,allowed,authorizeStatus:start.status,callbackStatus:returned.status,returnedTo:actual,cancellationOnly:true};results.push(evidence);console.log(JSON.stringify(evidence));
}
const settings=await request(new URL('settings',authBase));
if(settings.ok){const data=await settings.json();console.log(JSON.stringify({publicAuthSettings:{google:data.external?.google,azure:data.external?.azure}}));}
await check('google',appReturn,true);
await check('google',rejectedReturn,false);
await check('azure',appReturn,true);
console.log(JSON.stringify({passed:true,checks:results,personalLogin:false,customerWrites:false}));

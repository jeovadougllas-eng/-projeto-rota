import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({});vm.runInContext(readFileSync('assets/rotamapa-auth.js','utf8'),ctx);const M=ctx.RotaMapaAuth;
test('Web and native duplicates share one exchange, including repeated callbacks after completion',async()=>{
 let calls=0,finish;const client={auth:{exchangeCodeForSession:async()=>{calls++;return new Promise(r=>finish=r);}}};
 const a=M.exchange(client,'synthetic-code'),b=M.exchange(client,'synthetic-code');assert.equal(a,b);await Promise.resolve();assert.equal(calls,1);
 const session={data:{session:{user:{id:'synthetic'}}},error:null};finish(session);assert.equal(await a,session);assert.equal(await M.exchange(client,'synthetic-code'),session);assert.equal(calls,1);
});
test('new attempts and clients remain independent, empty callbacks never reach the SDK',async()=>{
 const codes=[],client={auth:{exchangeCodeForSession:async c=>{codes.push(c);return{data:{session:null},error:null};}}};
 await M.exchange(client,'first');await M.exchange(client,'second');await M.exchange({...client},'second');assert.deepEqual(codes,['first','second','second']);
 for(const code of ['',null,undefined,' '])await assert.rejects(M.exchange(client,code));assert.equal(codes.length,3);
});
test('failed PKCE callbacks are not exchanged twice and diagnostics never expose provider error secrets',async()=>{
 let calls=0;const error={message:'both auth code and code verifier should be non-empty secret-code'};const client={auth:{exchangeCodeForSession:async()=>{calls++;return{error};}}};
 assert.equal((await M.exchange(client,'failed')).error,error);await M.exchange(client,'failed');assert.equal(calls,1);
 assert.match(M.message(error),/mesmo navegador/);assert.ok(!M.message(error).includes('secret-code'));assert.ok(!M.message({message:'raw secret'}).includes('raw secret'));
});

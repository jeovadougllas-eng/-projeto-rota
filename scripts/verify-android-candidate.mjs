import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const apk='candidate/app-debug.apk',hash=b=>createHash('sha256').update(b).digest('hex');
const bytes=await readFile(apk),files={};
for(const file of ['traxio-route-ui.js','traxio-planner.js','traxio-geolocation.js','traxio-routes.css','traxio-native.js','traxio-ui.js','traxelo-shell.css','traxelo/approved/visual/assets/branding/logo_horizontal_fundo_escuro.png']){
 const bundled=execFileSync('unzip',['-p',apk,'assets/public/assets/'+file],{maxBuffer:2000000}),source=await readFile('assets/'+file);
 assert.equal(hash(bundled),hash(source),'APK source mismatch: '+file);files[file]=hash(bundled);
}
const html=execFileSync('unzip',['-p',apk,'assets/public/index.html'],{maxBuffer:2000000});
const expected=(await readFile('index.html','utf8')).replace('<script src="assets/traxio-native.js"></script>','<script src="assets/capacitor-runtime.js"></script><script src="assets/traxio-native.js"></script>');
assert.equal(hash(html),hash(expected),'APK HTML source mismatch');
const config=JSON.parse(execFileSync('unzip',['-p',apk,'assets/capacitor.config.json'],{encoding:'utf8'}));
assert.equal(config.appId,'app.traxio.mobile');assert.equal(config.plugins.Keyboard.resizeOnFullScreen,true);
await mkdir('mobile/evidence',{recursive:true});
const evidence={compiledRun:Number(process.env.TRAXELO_COMPILED_RUN||39656428669),compiledSource:process.env.TRAXELO_COMPILED_SOURCE||'1ae259c1c91608cdd70905b7c7e6186f96824b3f',sha256:hash(bytes),apkBytes:bytes.length,files,html:hash(html),packageId:config.appId,keyboardResizeOnFullScreen:true};
await writeFile('mobile/evidence/android-candidate.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));


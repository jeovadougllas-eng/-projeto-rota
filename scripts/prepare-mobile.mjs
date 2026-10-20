import {readFile,writeFile,access,copyFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const mobile=new URL('../mobile/',import.meta.url);
const exists=async path=>access(new URL(path,mobile)).then(()=>true,()=>false);
for(const platform of ['android','ios'])if(!await exists(platform))execFileSync('npx',['cap','add',platform],{cwd:mobile,stdio:'inherit'});
const manifest=new URL('android/app/src/main/AndroidManifest.xml',mobile);
let xml=await readFile(manifest,'utf8');
if(!xml.includes('app.traxio.mobile'))xml=xml.replace('</activity>',`<intent-filter>
 <action android:name="android.intent.action.VIEW"/>
 <category android:name="android.intent.category.DEFAULT"/>
 <category android:name="android.intent.category.BROWSABLE"/>
 <data android:scheme="app.traxio.mobile" android:host="auth" android:pathPrefix="/callback"/>
</intent-filter></activity>`);
for(const permission of ['ACCESS_FINE_LOCATION','ACCESS_COARSE_LOCATION'])if(!xml.includes(permission))xml=xml.replace('</manifest>',`<uses-permission android:name="android.permission.${permission}"/></manifest>`);
xml=xml.replace(/android:icon="[^"]+"/, 'android:icon="@drawable/traxio_icon"').replace(/android:roundIcon="[^"]+"/, 'android:roundIcon="@drawable/traxio_icon"');
await mkdir(new URL('android/app/src/main/res/drawable/',mobile),{recursive:true});await copyFile(new URL('../assets/visual-kit/assets/app_icon_dark.png',import.meta.url),new URL('android/app/src/main/res/drawable/traxio_icon.png',mobile));
await writeFile(manifest,xml);
const plist=new URL('ios/App/App/Info.plist',mobile);let info=await readFile(plist,'utf8');
const additions={NSLocationWhenInUseUsageDescription:'A Traxio usa sua localização durante a navegação para planejar rotas, recalcular desvios e registrar a chegada aos clientes.'};
for(const [key,value] of Object.entries(additions))if(!info.includes('<key>'+key+'</key>'))info=info.replace('</dict>','<key>'+key+'</key><string>'+value+'</string>\n</dict>');
if(!info.includes('CFBundleURLTypes'))info=info.replace('</dict>',`<key>CFBundleURLTypes</key><array><dict><key>CFBundleURLName</key><string>Traxio authentication</string><key>CFBundleURLSchemes</key><array><string>app.traxio.mobile</string></array></dict></array></dict>`);
await writeFile(plist,info);
console.log('Configured foreground GPS permissions and the authenticated app return link on Android/iOS.');

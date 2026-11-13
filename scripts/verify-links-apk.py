"""Check the actual native installer and its compatible web update before publication."""
from pathlib import Path
import hashlib,json,zipfile,subprocess,os,re
sha=lambda b:hashlib.sha256(b).hexdigest()
apk=Path('mobile/android/app/build/outputs/apk/debug/app-debug.apk')
m=json.loads(Path('candidate/updateweb/manifest.json').read_text())
bundle=Path('candidate/updateweb')/m['bundle'].removeprefix('/updates/android/')
assert sha(bundle.read_bytes())==m['sha256'] and bundle.stat().st_size==m['bytes']
assert len(m['files'])>=121 and m['nativeVersion']==2
with zipfile.ZipFile(bundle) as z:
 for n,h in m['files'].items():assert sha(z.read(n))==h,n
with zipfile.ZipFile(apk) as z:
 for n,h in m['files'].items():assert sha(z.read('assets/public/'+n))==h,n
 html=z.read('assets/public/index.html').decode();assert 'assets/rotamapa-ranking-ui.js' in html and 'assets/rotamapa-ranking.css' in html and 'iphone.webmanifest' not in html
 assert 'assets/rotamapa-links-ui.js' in html and 'assets/rotamapa-links.css' in html
 assert b'https://mercadofarma.com.br/' in z.read('assets/public/assets/rotamapa-links-model.js')
 assert b'Copiar CNPJ' in z.read('assets/public/assets/rotamapa-billing-ui.js')
 assert json.loads(z.read('assets/public/assets/rotamapa-release.json'))['version']=='1.6.0'
 assert z.read('assets/public/assets/rotamapa/icon-512.png')==Path('assets/rotamapa/icon-512.png').read_bytes()
tools=sorted(Path(os.environ['ANDROID_HOME']).glob('build-tools/*/aapt'))[-1].parent
call=lambda tool,*args:subprocess.check_output([str(tools/tool),*map(str,args)],text=True)
badging=call('aapt','dump','badging',apk)
assert "package: name='app.traxio.mobile' versionCode='6' versionName='1.6.0'" in badging
assert "application-label:'RotaMapa'" in badging
icon=re.search(r"application-icon-\d+:'([^']+)'",badging)[1]
with zipfile.ZipFile(apk) as z:Path('candidate/packaged-launcher.png').write_bytes(z.read(icon))
subprocess.run(['node','--input-type=module','-e',"""
import{createRequire}from'node:module';import{strict as assert}from'node:assert';const sharp=createRequire(new URL('./mobile/package.json',import.meta.url))('sharp');assert.deepEqual(await sharp('candidate/packaged-launcher.png').removeAlpha().raw().toBuffer(),await sharp('assets/rotamapa/icon-512.png').removeAlpha().raw().toBuffer());
"""],check=True)
def cert(path):
 values=set(re.findall(r'certificate SHA-256 digest:\s*([a-fA-F0-9]{64})',call('apksigner','verify','--print-certs',path),re.I));assert len(values)==1;return values.pop().lower()
signer=cert(apk);previous=cert('downloads/rotamapa-android-1.5.0-testes.apk');stable=cert('downloads/rotamapa-android-testes.apk')
assert sha(Path('downloads/traxio-android-testes.apk').read_bytes())=='6d9fe54fc87beac1e1da5200858ab5232468449f40733548d58ad75139fdcdc2'
proof={'version':'1.6.0','source':os.environ['GITHUB_SHA'],'run':os.environ['GITHUB_RUN_ID'],'packageId':'app.traxio.mobile','nativeVersion':6,'apkSha256':sha(apk.read_bytes()),'apkBytes':apk.stat().st_size,'signerSha256':signer,'previous150SignerSha256':previous,'inPlaceUpgradeFrom150':signer==previous,'inPlaceUpgradeFromStable':signer==stable,'otaVersion':m['version'],'otaSha256':m['sha256'],'otaBytes':m['bytes'],'bundledFiles':len(m['files']),'minimumOtaNativeVersion':m['nativeVersion'],'launcherResource':icon,'originalInstallerPreserved':True}
Path('candidate/links-release-proof.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof))

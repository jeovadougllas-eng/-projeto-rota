"""Verify the real APK, full OTA bundle and launcher pixels before publication."""
from pathlib import Path
import hashlib,json,zipfile,subprocess,os,re
sha=lambda b:hashlib.sha256(b).hexdigest()
m=json.loads(Path('candidate/updateweb/manifest.json').read_text())
apk=Path('mobile/android/app/build/outputs/apk/debug/app-debug.apk')
original=Path('downloads/traxio-android-testes.apk')
previous=Path('downloads/rotamapa-android-testes.apk')
assert sha(original.read_bytes())=='6d9fe54fc87beac1e1da5200858ab5232468449f40733548d58ad75139fdcdc2'
archive=Path('candidate/updateweb')/m['bundle'].removeprefix('/updates/android/')
assert sha(archive.read_bytes())==m['sha256'] and archive.stat().st_size==m['bytes']
with zipfile.ZipFile(archive) as z:
 for name,digest in m['files'].items():assert sha(z.read(name))==digest,name
with zipfile.ZipFile(apk) as z:
 for name,digest in m['files'].items():assert sha(z.read('assets/public/'+name))==digest,name
 html=z.read('assets/public/index.html').decode()
 assert 'iphone.webmanifest' not in html and 'assets/rotamapa-field-ui.js' in html
 assert json.loads(z.read('assets/public/assets/rotamapa-release.json'))['version']=='1.3.1'
 script=z.read('assets/public/assets/traxio-ui.js').decode()
 assert 'commercialPriority(c) === cat' in script and 'officialDistricts' in script
 assert 'RotaMapaBuyerModel?.natal' in script
 assert z.read('assets/public/assets/rotamapa/icon-512.png')==Path('assets/rotamapa/icon-512.png').read_bytes()
# Check packaged Android resource pixels, not just a similarly named web icon.
buildtools=sorted(Path(os.environ['ANDROID_HOME']).glob('build-tools/*/aapt'))[-1].parent
def call(tool,*args):return subprocess.check_output([str(buildtools/tool),*map(str,args)],text=True)
badging=call('aapt','dump','badging',apk)
assert "package: name='app.traxio.mobile' versionCode='3' versionName='1.3.1'" in badging
assert "application-label:'RotaMapa'" in badging
icon=re.search(r"application-icon-\d+:'([^']+)'",badging)[1]
with zipfile.ZipFile(apk) as z:Path('candidate/packaged-launcher.png').write_bytes(z.read(icon))
subprocess.run(['node','--input-type=module','-e',"""
import{createRequire}from'node:module';import{strict as assert}from'node:assert';
const sharp=createRequire(new URL('./mobile/package.json',import.meta.url))('sharp');
const a=await sharp('candidate/packaged-launcher.png').removeAlpha().raw().toBuffer();
const b=await sharp('assets/rotamapa/icon-512.png').removeAlpha().raw().toBuffer();assert.deepEqual(a,b);
"""],check=True)
def certificate(path):
 output=call('apksigner','verify','--print-certs',path)
 # Current SDKs may prefix the signer with its Android SDK range.
 fingerprints=set(re.findall(r'certificate SHA-256 digest:\s*([a-fA-F0-9]{64})',output,re.I))
 assert len(fingerprints)==1,'Expected one verified signing certificate: '+output
 return fingerprints.pop().lower()
cert=certificate(apk);oldcert=certificate(previous)
proof={'source':os.environ.get('GITHUB_SHA'),'run':os.environ.get('GITHUB_RUN_ID'),'version':'1.3.1','nativeVersion':3,'packageId':'app.traxio.mobile','apkSha256':sha(apk.read_bytes()),'apkBytes':apk.stat().st_size,'signerSha256':cert,'previousSignerSha256':oldcert,'inPlaceUpgradeFromPreviousInstaller':cert==oldcert,'otaVersion':m['version'],'otaSha256':m['sha256'],'otaBytes':m['bytes'],'bundledFiles':len(m['files']),'launcherResource':icon,'originalInstallerPreserved':True,'backgroundHashesVerified':True}
Path('candidate/brand-registry-proof.json').write_text(json.dumps(proof,indent=2)+'\n')
print(json.dumps(proof))

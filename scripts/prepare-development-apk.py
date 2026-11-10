"""Optionally sign a development APK only with the certificate used by the current 1.7.0 artifact.

No new signing key is generated. Secrets stay in runner environment/temp files. No deployment.
"""
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent.parent


def certificate(signer, apk):
    result = subprocess.run([str(signer), 'verify', '--print-certs', str(apk)], capture_output=True, text=True)
    if result.returncode:
        return None
    found = re.search(r'Signer #1 certificate SHA-256 digest: ([a-fA-F0-9]+)', result.stdout)
    return found.group(1).lower() if found else None


def main():
    sdk = Path(os.environ.get('ANDROID_HOME', os.environ.get('ANDROID_SDK_ROOT', '')))
    signer = sdk / 'build-tools' / '36.0.0' / 'apksigner'
    if not signer.is_file():
        raise RuntimeError('Android build-tools 36.0.0 required')
    source = ROOT / 'mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk'
    baseline = ROOT / 'downloads/rotamapa-android-1.7.0-testes.apk'
    expected = certificate(signer, baseline)
    if not expected:
        raise RuntimeError('Could not verify the current baseline signing certificate')
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    if subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip() != 'dev/rotamapa-atualizacao-integral':
        raise RuntimeError('Unauthorized source branch')
    output = Path(os.environ.get('ROTAMAPA_ANDROID_OUTPUT', '/workspace/rotamapa-android-artifacts'))
    output.mkdir(parents=True, exist_ok=True)
    verified = []
    with zipfile.ZipFile(source) as archive:
        for asset in sorted((ROOT / 'assets').rglob('*')):
            if asset.is_file():
                relative = asset.relative_to(ROOT).as_posix()
                if archive.read('assets/public/' + relative) != asset.read_bytes():
                    raise RuntimeError('Android source mismatch: ' + relative)
                verified.append(relative)
        native_html = archive.read('assets/public/index.html')
        if native_html != (ROOT / 'mobile/www/index.html').read_bytes() or b'iphone-pwa:start' in native_html:
            raise RuntimeError('Native HTML differs from the shared build or includes web-only PWA controls')
    unsigned = output / ('rotamapa-' + commit[:7] + '-unsigned.apk')
    shutil.copyfile(source, unsigned)
    proof = {'sourceCommit': commit, 'nativeId': 'app.traxio.mobile', 'versionName': '1.7.0',
             'baselineCertificateSha256': expected, 'unsignedSha256': hashlib.sha256(unsigned.read_bytes()).hexdigest(),
             'unsignedBytes': unsigned.stat().st_size, 'signed': False, 'published': False,
             'deviceTested': False, 'verifiedCommonFiles': verified,
             'signingStatus': 'Original compatible key not available'}
    with tempfile.TemporaryDirectory(prefix='rotamapa-signing-') as temporary:
        key = Path(temporary) / 'original.jks'
        env = os.environ.copy()
        supplied = env.get('ROTAMAPA_ANDROID_KEYSTORE_BASE64')
        cached = Path(os.environ.get('ROTAMAPA_ANDROID_EXISTING_KEYSTORE', str(Path.home() / '.android/debug.keystore')))
        try:
            has_cached = cached.is_file()
        except PermissionError:
            has_cached = False
        if supplied:
            key.write_bytes(base64.b64decode(supplied, validate=True))
            key.chmod(0o600)
            alias = env.get('ROTAMAPA_ANDROID_KEY_ALIAS')
            if not alias or not env.get('ROTAMAPA_ANDROID_STORE_PASSWORD') or not env.get('ROTAMAPA_ANDROID_KEY_PASSWORD'):
                raise RuntimeError('Complete the configured Android signing secret names; do not print their values')
        elif has_cached:
            key = cached
            alias = 'androiddebugkey'
            env['ROTAMAPA_ANDROID_STORE_PASSWORD'] = 'android'
            env['ROTAMAPA_ANDROID_KEY_PASSWORD'] = 'android'
        else:
            alias = None
        if alias:
            candidate = Path(temporary) / 'candidate.apk'
            result = subprocess.run([str(signer), 'sign', '--ks', str(key), '--ks-key-alias', alias,
                '--ks-pass', 'env:ROTAMAPA_ANDROID_STORE_PASSWORD', '--key-pass', 'env:ROTAMAPA_ANDROID_KEY_PASSWORD',
                '--out', str(candidate), str(source)], env=env, capture_output=True)
            if result.returncode == 0 and certificate(signer, candidate) == expected:
                signed = output / ('rotamapa-' + commit[:7] + '-signed.apk')
                shutil.copyfile(candidate, signed)
                proof.update(signed=True, signingStatus='Verified matching baseline certificate',
                             signedSha256=hashlib.sha256(signed.read_bytes()).hexdigest(), signedBytes=signed.stat().st_size)
            else:
                proof['signingStatus'] = 'Available key could not produce an APK matching the baseline certificate; no signed artifact retained'
    (output / 'android-proof.json').write_text(json.dumps(proof, indent=2) + '\n')
    print(json.dumps(proof))


if __name__ == '__main__':
    main()

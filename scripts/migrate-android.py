#!/usr/bin/env python3
"""One-time, owner-operated migration between test APK signatures. Never runs inside the app."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import tarfile
import time

PACKAGE = 'app.traxio.mobile'
NEW_SHA256 = '6d9fe54fc87beac1e1da5200858ab5232468449f40733548d58ad75139fdcdc2'

def run(*args, **kwargs):
    result = subprocess.run(['adb', *args], check=False, stderr=subprocess.PIPE, **kwargs)
    if result.returncode:
        raise RuntimeError('ADB falhou: ' + result.stderr.decode(errors='replace')[:1000])
    return result

def text(*args):
    return run(*args, stdout=subprocess.PIPE).stdout.decode().strip()

def digest(path):
    with open(path, 'rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def contents(path):
    result = {}
    with tarfile.open(path, 'r:') as archive:
        for member in archive.getmembers():
            name = PurePosixPath(member.name)
            if name.is_absolute() or '..' in name.parts or member.issym() or member.islnk():
                raise RuntimeError('Caminho inesperado no backup. Nada sera apagado.')
            if member.isfile():
                with archive.extractfile(member) as stream:
                    result[str(name)] = hashlib.file_digest(stream, 'sha256').hexdigest()
    if not any(name.startswith('app_webview/') for name in result):
        raise RuntimeError('Backup sem armazenamento WebView. Nada sera apagado.')
    return result

def capture(path, directories):
    with open(path, 'wb') as stream:
        run('exec-out', 'run-as', PACKAGE, 'tar', '-cf', '-', *directories, stdout=stream)
        stream.flush()
        os.fsync(stream.fileno())
    return contents(path)

def install_and_restore(apk, backup, directories, expected, output):
    # This destructive step is reached only after a complete verified backup and explicit MIGRAR input.
    text('uninstall', PACKAGE)
    text('install', str(apk))
    text('shell', 'monkey', '-p', PACKAGE, '1')
    time.sleep(2)
    text('shell', 'am', 'force-stop', PACKAGE)
    text('shell', 'run-as', PACKAGE, 'rm', '-rf', *directories)
    with open(backup, 'rb') as stream:
        run('shell', '-T', 'run-as', PACKAGE, 'tar', '-xf', '-', stdin=stream, stdout=subprocess.DEVNULL)
    restored = output / 'restored-verification.tar'
    actual = capture(restored, directories)
    if any(actual.get(name) != value for name, value in expected.items()):
        raise RuntimeError('A verificacao dos arquivos restaurados falhou; o backup original permanece intacto.')
    restored.unlink()
    text('shell', 'am', 'start', '-n', PACKAGE + '/.MainActivity')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apk', type=Path, default=Path('traxio-android-testes.apk'))
    parser.add_argument('--output', type=Path)
    parser.add_argument('--migrate', action='store_true', help='Solicita confirmacao antes de substituir o APK antigo.')
    args = parser.parse_args()
    if not shutil.which('adb'):
        raise RuntimeError('Instale o Android Platform Tools oficial e adicione adb ao PATH.')
    devices = [line for line in text('devices').splitlines()[1:] if line.endswith('\tdevice')]
    if len(devices) != 1:
        raise RuntimeError('Conecte somente um aparelho e autorize a depuracao USB nele.')
    text('shell', 'run-as', PACKAGE, 'id')
    if args.migrate and (not args.apk.is_file() or digest(args.apk) != NEW_SHA256):
        raise RuntimeError('O APK nao corresponde a versao testada. Nada sera apagado.')
    stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    output = args.output or Path('traxelo-backup-' + stamp)
    output.mkdir(mode=0o700, parents=True, exist_ok=False)
    text('shell', 'am', 'force-stop', PACKAGE)
    directories = []
    for name in ('app_webview', 'shared_prefs', 'files', 'databases'):
        probe = subprocess.run(['adb', 'shell', 'run-as', PACKAGE, 'test', '-d', name], capture_output=True)
        if probe.returncode == 0:
            directories.append(name)
    backup = output / 'private-device-backup.tar'
    expected = capture(backup, directories)
    previous = output / 'previous.apk'
    apk_path = next((line[8:] for line in text('shell', 'pm', 'path', PACKAGE).splitlines() if line.startswith('package:') and line.endswith('/base.apk')), None)
    if not apk_path:
        raise RuntimeError('Nao foi possivel preservar o APK anterior. Nada sera apagado.')
    text('pull', apk_path, str(previous))
    evidence = {'packageId': PACKAGE, 'backupSha256': digest(backup), 'previousApkSha256': digest(previous), 'preservedFiles': len(expected), 'directories': directories, 'migrated': False}
    (output / 'verification.json').write_text(json.dumps(evidence, indent=2), encoding='utf-8')
    print('Backup completo verificado em:', output.resolve())
    print('Este backup contem dados privados e sessoes. Guarde-o com seguranca; nao o envie no chat.')
    if not args.migrate:
        text('shell', 'am', 'start', '-n', PACKAGE + '/.MainActivity')
        return
    answer = input('Backup preservado. Para substituir o APK e restaurar os dados, digite MIGRAR: ')
    if answer != 'MIGRAR':
        print('Cancelado. O aplicativo anterior permanece instalado.')
        text('shell', 'am', 'start', '-n', PACKAGE + '/.MainActivity')
        return
    try:
        install_and_restore(args.apk, backup, directories, expected, output)
    except Exception:
        print('A migracao falhou. Tentando restaurar o aplicativo anterior com o backup verificado.')
        # A partial installation can leave either APK installed; remove it only in this already-approved migration.
        subprocess.run(['adb', 'uninstall', PACKAGE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        text('install', str(previous))
        text('shell', 'monkey', '-p', PACKAGE, '1')
        time.sleep(2)
        text('shell', 'am', 'force-stop', PACKAGE)
        text('shell', 'run-as', PACKAGE, 'rm', '-rf', *directories)
        with open(backup, 'rb') as stream:
            run('shell', '-T', 'run-as', PACKAGE, 'tar', '-xf', '-', stdin=stream, stdout=subprocess.DEVNULL)
        text('shell', 'am', 'start', '-n', PACKAGE + '/.MainActivity')
        raise
    evidence.update(migrated=True, allOriginalFilesVerified=True, newApkSha256=NEW_SHA256)
    (output / 'verification.json').write_text(json.dumps(evidence, indent=2), encoding='utf-8')
    print('Migracao concluida. Os arquivos originais foram restaurados e conferidos.')

if __name__ == '__main__':
    main()

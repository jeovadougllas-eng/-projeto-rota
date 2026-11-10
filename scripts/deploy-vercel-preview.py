"""Deploy only the prepared public runtime to the existing Vercel project's Preview environment.

Uses the injected HTTP secret with normal TLS/proxy handling. Never prints credentials,
changes project settings, assigns production aliases, or reads environment variable values.
"""
import argparse
import concurrent.futures
import hashlib
import json
import os
import pathlib
import urllib.error
import urllib.request

PROJECT = 'prj_Bes4oJLB9Nsv4tosvzI29F5sfytu'
TEAM = 'team_nkA7YdysnXiPjmhoqbOoTBzc'


def request(path, data=None, headers=None):
    url = 'https://api.vercel.com' + path + '?teamId=' + TEAM
    req = urllib.request.Request(url, data=data, headers={
        'Authorization': 'Bearer ' + os.environ['VERCEL_TOKEN'], **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return json.load(response) if 'application/json' in response.headers.get('Content-Type', '') else {}
    except urllib.error.HTTPError as error:
        # Only bounded service error JSON; never request headers or the token.
        raise RuntimeError('Vercel HTTP ' + str(error.code) + ': ' + error.read(1000).decode()) from None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('directory')
    parser.add_argument('--create-preview', action='store_true', help='Explicitly create a development deployment')
    args = parser.parse_args()
    root = pathlib.Path(args.directory).resolve()
    if root.parent != pathlib.Path('/workspace') or not root.name.startswith('rotamapa-preview-'):
        raise RuntimeError('Use a separate directory produced by prepare-vercel-preview.mjs')
    manifest = json.loads((root / 'rotamapa-preview-build.json').read_text())
    if manifest['target'] != 'preview':
        raise RuntimeError('Preview only')
    files = []
    allowed_roots = {'index.html', 'privacidade.html', 'termos.html', 'iphone.webmanifest', 'iphone-sw.js',
                     'iphone-offline.html', 'assets', 'api', 'lib', 'package.json', 'vercel.json', 'rotamapa-preview-build.json'}
    for path in root.rglob('*'):
        if path.is_symlink():
            raise RuntimeError('Symlink in prepared upload')
        if not path.is_file():
            continue
        name = path.relative_to(root).as_posix()
        if name.split('/')[0] not in allowed_roots:
            raise RuntimeError('Unexpected upload path: ' + name)
        data = path.read_bytes()
        if name != 'rotamapa-preview-build.json' and hashlib.sha256(data).hexdigest() != manifest['files'].get(name):
            raise RuntimeError('Upload changed after preparation: ' + name)
        files.append((name, hashlib.sha1(data).hexdigest(), len(data), path))
    if set(manifest['files']) != {name for name, _, _, _ in files if name != 'rotamapa-preview-build.json'}:
        raise RuntimeError('Prepared files do not match the complete manifest')
    if not args.create_preview:
        print(json.dumps({'validatedFiles': len(files), 'sourceCommit': manifest['sourceCommit'], 'deployed': False}))
        return
    before = request('/v9/projects/' + PROJECT)
    if before['id'] != PROJECT or before['accountId'] != TEAM:
        raise RuntimeError('Unexpected Vercel project')
    production = before['targets']['production']['id']
    cache_path = pathlib.Path('/workspace/rotamapa-vercel-upload-receipts.json')
    cache = set(json.loads(cache_path.read_text())) if cache_path.exists() else set()

    def upload(item):
        _, sha, size, path = item
        if sha not in cache:
            request('/v2/files', path.read_bytes(), {'Content-Type': 'application/octet-stream',
                    'x-vercel-digest': sha, 'x-vercel-size': str(size)})
        return sha

    # Cache only acknowledged content digests; no source, file values or credentials.
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        for sha in pool.map(upload, {item[1]: item for item in files}.values()):
            cache.add(sha)
            cache_path.write_text(json.dumps(sorted(cache)) + '\n')
    body = {'name': 'traxio-preview', 'project': PROJECT,
            # Omitted target is Preview in this API. Literal "preview" is rejected.
            # Never set "production", "staging", aliases or a production domain.
            'files': [{'file': name, 'sha': sha, 'size': size} for name, sha, size, _ in files],
            'projectSettings': {'framework': None, 'buildCommand': '', 'installCommand': '', 'outputDirectory': '.'},
            'meta': {'rotamapaSourceCommit': manifest['sourceCommit'], 'rotamapaBranch': 'dev/rotamapa-atualizacao-integral',
                     'rotamapaPurpose': 'authorized-development-preview'}}
    deployment = request('/v13/deployments', json.dumps(body).encode(), {'Content-Type': 'application/json'})
    result = {key: deployment.get(key) for key in ['id', 'url', 'readyState', 'target']}
    result.update(sourceCommit=manifest['sourceCommit'], productionBefore=production)
    receipt = root / 'deployment-receipt.json'
    receipt.write_text(json.dumps(result, indent=2) + '\n')
    if result['target'] == 'production':
        raise RuntimeError('Unexpected production target: investigate without making further changes')
    after = request('/v9/projects/' + PROJECT)
    if after['targets']['production']['id'] != production:
        raise RuntimeError('Production changed concurrently: investigate without mutating it')
    print(json.dumps({**result, 'productionUnchanged': True, 'receipt': str(receipt)}))


if __name__ == '__main__':
    main()

"""Package only the self-contained Chrome extension, excluding dev fixtures."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
archive = root / 'dist' / f"Imageseec-v{manifest['version']}.zip"
archive.parent.mkdir(exist_ok=True)
files = [
    'manifest.json', 'i18n.js', 'background.js', 'settings.js', 'controls.js', 'preferences.js', 'gallery.js', 'viewer.js', 'quick-open.js',
    'options.html', 'options.css', 'options.js', 'standalone.html', 'standalone.js',
    'README.md', 'PRIVACY.md', 'LICENSE', 'icons/16.png', 'icons/48.png', 'icons/128.png',
]
files += sorted(p.relative_to(root).as_posix() for p in (root / '_locales').glob('*/messages.json'))
for name in files:
    assert (root / name).is_file(), name
with ZipFile(archive, 'w', ZIP_DEFLATED) as bundle:
    for name in files:
        bundle.write(root / name, name)
with ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    assert set(bundle.namelist()) == set(files)
    assert json.loads(bundle.read('manifest.json')) == manifest
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
print(json.dumps({'archive': str(archive), 'bytes': archive.stat().st_size, 'files': len(files), 'sha256': digest}, ensure_ascii=False))

// Check only the exact tracked source set, not ignored local backups or secrets.
const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const files = execFileSync('git', ['ls-files', '-c', '-o', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
if (!files.length) throw Error('No project files found to audit.');
const problems = [];
const reviewedStoreScreenshots = new Set([
  'release/artwork/imageseec-mark.png',
  'release/assets/store-screenshot-01-viewer-1280x800.png',
  'release/assets/store-screenshot-02-navigation-1280x800.png',
  'release/assets/store-icon-128.png',
  'release/assets/promo-small-440x280.png',
  'release/assets/promo-marquee-1400x560.png',
  'release/assets/store-screenshot-03-compare-1280x800.png',
  'release/assets/store-screenshot-04-overview-1280x800.png'
]);
const rules = [
  ['absolute local path', /\b[A-Za-z]:[\\/](?:Users|Documents|MyBrowser|Program Files)\b|\/(?:Users|home)\/[^/\s]+\//],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['credential', /\b(?:gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,}|sk-(?:proj-)?[A-Za-z0-9_-]{25,}|AKIA[A-Z0-9]{16})\b/],
  ['embedded URL credentials', /https?:\/\/[^\s/:'"]+:[^\s/@'"]+@/]
];
for (const file of files) {
  if (/^(?:tests\/(?:backups|local-only)\/|dist\/)|(?:^|\/)\.env(?:\.|$)|\.(?:pem|key|crx|zip)$/i.test(file)) problems.push(`${file}: excluded material is tracked`);
  if (/\.png$/i.test(file) && !/^icons\/\d+\.png$/.test(file) && !reviewedStoreScreenshots.has(file)) problems.push(`${file}: screenshot requires explicit publication review`);
  if (!/\.(?:[cm]?js|json|md|html|css|py|ya?ml|txt)$/.test(file) && !/^\.(?:gitignore|gitattributes)$|^LICENSE$/.test(file)) continue;
  if (!fs.existsSync(path.join(root, file))) continue;
  const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const [label, pattern] of rules) if (pattern.test(line)) problems.push(`${file}:${index + 1}: ${label}`);
    if (['README.md', 'PRIVACY.md', 'docs/STORE-LISTING.md'].includes(file) && /127\.0\.0\.1|localhost|18766|node tests\//i.test(line)) problems.push(`${file}:${index + 1}: development endpoint in product text`);
  });
}
if (problems.length) { process.stderr.write(problems.join('\n') + '\n'); process.exitCode = 1; }
else console.log(`Public-source audit passed for ${files.length} tracked and untracked project files. Manual review is still required for future releases.`);

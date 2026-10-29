// Check only the exact tracked source set, not ignored local backups or secrets.
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
if (!files.length) throw Error('Stage the intended source files before auditing.');
const problems = [];
const rules = [
  ['absolute local path', /\b[A-Za-z]:[\\/](?:Users|Documents|MyBrowser|Program Files)\b|\/(?:Users|home)\/[^/\s]+\//],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['credential', /\b(?:gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,}|sk-(?:proj-)?[A-Za-z0-9_-]{25,}|AKIA[A-Z0-9]{16})\b/],
  ['embedded URL credentials', /https?:\/\/[^\s/:'"]+:[^\s/@'"]+@/]
];
for (const file of files) {
  if (/^(?:tests\/(?:backups|local-only)\/|dist\/)|(?:^|\/)\.env(?:\.|$)|\.(?:pem|key|crx|zip)$/i.test(file)) problems.push(`${file}: excluded material is tracked`);
  if (/\.png$/i.test(file) && !/^icons\/\d+\.png$/.test(file)) problems.push(`${file}: screenshot requires explicit publication review`);
  if (!/\.(?:[cm]?js|json|md|html|css|py|ya?ml|txt)$/.test(file) && !/^\.(?:gitignore|gitattributes)$|^LICENSE$/.test(file)) continue;
  const lines = execFileSync('git', ['show', `:${file}`], { cwd: root, encoding: 'utf8' }).split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const [label, pattern] of rules) if (pattern.test(line)) problems.push(`${file}:${index + 1}: ${label}`);
    if (['README.md', 'PRIVACY.md', 'docs/STORE-LISTING.md'].includes(file) && /127\.0\.0\.1|localhost|18766|node tests\//i.test(line)) problems.push(`${file}:${index + 1}: development endpoint in product text`);
  });
}
if (problems.length) { process.stderr.write(problems.join('\n') + '\n'); process.exitCode = 1; }
else console.log(`Public-source audit passed for ${files.length} tracked files. Manual review is still required for future releases.`);

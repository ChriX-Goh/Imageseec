#!/usr/bin/env node
// Compare the checked-in architecture graph's source fingerprints with the
// current Git worktree. Run after source edits; exit 1 until the graph is
// regenerated from the changed source, then rerun and confirm it is fresh.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const graphPath = path.join(root, '.ua', 'knowledge-graph.json');
const ignorePath = path.join(root, '.ua', '.understandignore');
const defaultIgnores = [
  'node_modules/', '.git/', 'vendor/', 'venv/', '.venv/', '__pycache__/',
  'dist/', 'build/', 'out/', 'coverage/', '.next/', '.cache/', '.turbo/', 'target/', 'obj/',
  '*.lock', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  '*.png', '*.jpg', '*.jpeg', '*.gif', '*.svg', '*.ico', '*.woff', '*.woff2', '*.ttf', '*.eot',
  '*.mp3', '*.mp4', '*.pdf', '*.zip', '*.tar', '*.gz',
  '*.min.js', '*.min.css', '*.map', '*.generated.*',
  '.idea/', '.vscode/', 'LICENSE', '.gitignore', '.editorconfig', '.prettierrc', '.eslintrc*', '*.log',
];

function globRegExp(pattern) {
  let source = '';
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === '*' && pattern[i + 1] === '*') {
      if (pattern[i + 2] === '/') { source += '(?:.*/)?'; i += 2; }
      else { source += '.*'; i++; }
    } else if (char === '*') source += '[^/]*';
    else if (char === '?') source += '[^/]';
    else source += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(source);
}

function ignoredPatterns() {
  return fs.readFileSync(ignorePath, 'utf8').split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(pattern => {
      if (pattern.startsWith('!')) throw new Error('Negated .understandignore patterns need an explicit freshness-check update.');
      const directory = pattern.endsWith('/');
      const anchored = pattern.startsWith('/');
      const source = pattern.replace(/^\/+|\/+$/g, '');
      return { regex: new RegExp(`${anchored ? '^' : '(?:^|/)'}${globRegExp(source).source}${directory ? '(?:/.*)?$' : '$'}`), source, anchored, directory };
    });
}

function matchesGraphScope(relativePath, patterns) {
  const normalized = relativePath.replaceAll('\\', '/');
  return [...defaultIgnores.map(source => {
    const directory = source.endsWith('/');
    const trimmed = source.replace(/\/+$/g, '');
    return { source: trimmed, directory, anchored: false };
  }), ...patterns].some(({ source, directory, anchored }) =>
    new RegExp(`${anchored ? '^' : '(?:^|/)'}${globRegExp(source).source}${directory ? '(?:/.*)?$' : '$'}`).test(normalized));
}

function digest(content) {
  const text = Buffer.isBuffer(content) ? content.toString('utf8') : fs.readFileSync(content, 'utf8');
  // Git's text normalization stores LF in blobs even when Windows worktrees
  // check out CRLF. Hash the same canonical text on every operating system.
  return crypto.createHash('sha256').update(text.replace(/\r\n?/g, '\n'), 'utf8').digest('hex');
}

function indexDigest(relativePath) {
  try {
    const blob = execFileSync('git', ['show', `:${relativePath}`], { cwd: root, maxBuffer: 32 * 1024 * 1024 });
    return digest(blob);
  } catch (error) {
    if (error.status === 128) return null;
    throw error;
  }
}

function main() {
  if (process.argv.includes('--help')) {
    process.stdout.write('Usage: node scripts/graph-freshness.cjs [--check-index]\nCompares the current worktree scope and canonical-text SHA-256 hashes with .ua/knowledge-graph.json. --check-index also compares staged Git blobs. Exit 0 when fresh, 1 when changed, and 2 on an invalid graph or scope.\n');
    return;
  }
  if (!fs.existsSync(graphPath)) throw new Error('Architecture graph is missing; run the documented graph update workflow first.');
  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const patterns = ignoredPatterns();
  const paths = execFileSync('git', ['ls-files', '-c', '-o', '--exclude-standard', '-z'], { cwd: root })
    .toString('utf8').split('\0').filter(Boolean)
    .map(value => value.replaceAll('\\', '/'))
    .filter(value => !matchesGraphScope(value, patterns))
    .sort();
  const current = new Set(paths);
  const graphFiles = new Map(graph.nodes.filter(node => node.filePath && node.sourceHash)
    .map(node => [node.filePath.replaceAll('\\', '/'), node]));
  const checkIndex = process.argv.includes('--check-index');
  const changed = [], added = [], deleted = [], indexChanged = [], indexMissing = [];
  for (const relativePath of paths) {
    if (!graphFiles.has(relativePath)) { added.push(relativePath); continue; }
    const node = graphFiles.get(relativePath);
    if (!fs.existsSync(path.join(root, relativePath)) || digest(path.join(root, relativePath)) !== node.sourceHash) changed.push(relativePath);
    if (checkIndex) {
      const stagedHash = indexDigest(relativePath);
      if (stagedHash === null) indexMissing.push(relativePath);
      else if (stagedHash !== node.sourceHash) indexChanged.push(relativePath);
    }
  }
  for (const relativePath of graphFiles.keys()) if (!current.has(relativePath)) deleted.push(relativePath);

  const stalePaths = new Set([...changed, ...added, ...deleted, ...indexChanged, ...indexMissing]);
  const impacted = new Set();
  const sourceNodeIds = new Set([...stalePaths].flatMap(filePath =>
    graph.nodes.filter(node => node.filePath?.replaceAll('\\', '/') === filePath).map(node => node.id)));
  for (const edge of graph.edges) {
    if (sourceNodeIds.has(edge.source)) impacted.add(edge.target);
    if (sourceNodeIds.has(edge.target)) impacted.add(edge.source);
  }
  const report = { fresh: stalePaths.size === 0, checkedFiles: graphFiles.size, hashNormalization: 'UTF-8 text with CRLF/CR normalized to LF', changed, added, deleted, ...(checkIndex ? { indexChanged, indexMissing } : {}), directlyImpactedNodes: [...impacted].sort() };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (stalePaths.size) process.exitCode = 1;
}

try { main(); }
catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 2; }

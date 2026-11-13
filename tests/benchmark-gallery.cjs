const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'gallery.js'), 'utf8');
const context = vm.createContext({ URL, document: { baseURI: 'https://benchmark.example/' } });
vm.runInContext(source, context);
const gallery = context.ImageLens.gallery;

function referenceMerge(existing, incoming, direction = 1) {
  const result = existing.slice(), matched = new Map();
  for (const entry of incoming) {
    const found = result.find(old => gallery.sameEntry(old, entry));
    if (!found) continue;
    const id = found.key;
    const aliases = [...new Set([...(found.aliases || []), ...(entry.aliases || []), ...entry.sources.map(gallery.key)].filter(Boolean))];
    const geometry = found.thumb === entry.thumb && found.dimensions && !entry.dimensions
      ? { dimensions: found.dimensions, aspectRatio: found.aspectRatio, aspectRatioSource: found.aspectRatioSource } : {};
    Object.assign(found, entry, geometry, { key: id, aliases });
    matched.set(entry, found);
  }
  if (!matched.size) return direction < 0 ? [...incoming, ...result] : [...result, ...incoming];
  for (let n = 0; n < incoming.length; n++) {
    const entry = incoming[n];
    if (matched.has(entry)) continue;
    const previous = incoming.slice(0, n).reverse().map(item => matched.get(item)).find(Boolean);
    const next = incoming.slice(n + 1).map(item => matched.get(item)).find(Boolean);
    const at = previous ? result.indexOf(previous) + 1 : next ? result.indexOf(next) : direction < 0 ? 0 : result.length;
    result.splice(at, 0, entry); matched.set(entry, entry);
  }
  return result;
}

function makeGallery(count) {
  const existing = [], incoming = [];
  for (let index = 0; index < count; index++) {
    const key = `https://benchmark.example/photo/${index}.jpg?revision=${index % 3}`;
    const thumb = `https://benchmark.example/thumb/${index}.jpg?width=320`;
    const record = () => ({
      key,
      aliases: [key, thumb],
      sources: [key, thumb],
      thumb,
      title: `Photo ${index}`,
      aspectRatio: 1 + (index % 5) / 10,
      aspectRatioSource: 'declared',
      dimensions: null,
      node: null
    });
    existing.push(record());
    incoming.push(record());
  }
  return { existing, incoming };
}

function median(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function p95(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * .95) - 1];
}

function runTimed(merge, existing, incoming, expectedKeys) {
  const current = structuredClone(existing), next = structuredClone(incoming);
  const started = performance.now();
  const result = merge(current, next);
  const elapsed = performance.now() - started;
  assert.equal(result.length, expectedKeys.length);
  assert.deepEqual(result.map(entry => entry.key), expectedKeys);
  assert.deepEqual(result.map(entry => entry.title), expectedKeys.map((_, index) => `Photo ${index}`));
  assert.ok(result.every(entry => entry.aliases.includes(entry.key) && entry.aliases.includes(entry.thumb)));
  return elapsed;
}

const repetitions = 21;
const rows = [];
for (const count of [250, 500, 1000, 2000]) {
  const { existing, incoming } = makeGallery(count);
  const keys = existing.map(entry => entry.key);
  runTimed(referenceMerge, existing, incoming, keys);
  runTimed(gallery.mergeEntries, existing, incoming, keys);
  const reference = [], indexed = [];
  for (let repeat = 0; repeat < repetitions; repeat++) {
    if (repeat % 2 === 0) {
      reference.push(runTimed(referenceMerge, existing, incoming, keys));
      indexed.push(runTimed(gallery.mergeEntries, existing, incoming, keys));
    } else {
      indexed.push(runTimed(gallery.mergeEntries, existing, incoming, keys));
      reference.push(runTimed(referenceMerge, existing, incoming, keys));
    }
  }
  rows.push({
    images: count,
    repetitions,
    referenceMedianMs: +median(reference).toFixed(2),
    referenceP95Ms: +p95(reference).toFixed(2),
    indexedMedianMs: +median(indexed).toFixed(2),
    indexedP95Ms: +p95(indexed).toFixed(2),
    medianSpeedup: +(median(reference) / median(indexed)).toFixed(1)
  });
}

console.log('Synthetic Node benchmark only; not a browser, network, decode, scroll, or live-site performance result.');
console.table(rows);

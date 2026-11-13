const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const window = {};
vm.runInNewContext(fs.readFileSync(`${__dirname}/perf-lazy-gallery-config.js`, 'utf8'), {
  URLSearchParams,
  window
});
const read = window.PerfLazyGalleryConfig.read;

const defaults = read(new URLSearchParams());
assert.equal(defaults.mode, 'finite');
assert.equal(defaults.initial, 12);
assert.equal(defaults.batch, 8);
assert.equal(defaults.maxBatches, 8);
assert.equal(defaults.interval, 100);
assert.equal(defaults.rootMargin, 900);
assert.equal(defaults.sourceDelay, 0);
assert.equal(defaults.imageDelay, 0);
assert.equal(defaults.firstId, 300);

const explicitZero = read(new URLSearchParams('maxBatches=0&interval=0&rootMargin=0&sourceDelay=0&imageDelay=0'));
assert.equal(explicitZero.maxBatches, 0);
assert.equal(explicitZero.interval, 0);
assert.equal(explicitZero.rootMargin, 0);
assert.equal(explicitZero.sourceDelay, 0);
assert.equal(explicitZero.imageDelay, 0);

assert.equal(read(new URLSearchParams('mode=continuous')).maxBatches, 0);
assert.equal(read(new URLSearchParams('initial=0&batch=0')).initial, 1);
assert.equal(read(new URLSearchParams('initial=0&batch=0')).batch, 1);
assert.equal(read(new URLSearchParams('interval=&rootMargin=invalid')).interval, 100);
assert.equal(read(new URLSearchParams('rootMargin=20000')).rootMargin, 10000);

console.log('Performance gallery configuration checks passed.');

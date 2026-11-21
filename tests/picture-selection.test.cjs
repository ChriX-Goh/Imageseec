const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function createFixture({ currentSrc = '', src = 'https://images.example.test/fallback.jpg', imgAttributes = {}, pictureSources = [], mediaMatch = () => true } = {}) {
  const image = {
    tagName: 'IMG', currentSrc, src, complete: false, naturalWidth: 0, naturalHeight: 0,
    isConnected: true, alt: '', title: '', className: '', parentElement: null,
    getAttribute(name) { return name === 'src' ? this.src : imgAttributes[name] ?? null; },
    closest(selector) {
      if (selector === 'picture') return pictureSources.length ? picture : null;
      if (selector === 'a[href]') return null;
      return null;
    },
    getBoundingClientRect() { return { left: 0, top: 0, right: 240, bottom: 160, width: 240, height: 160 }; },
    querySelectorAll() { return []; }
  };
  const picture = { querySelectorAll(selector) { return selector === 'source' ? pictureSources : []; } };
  const document = {
    baseURI: 'https://gallery.example.test/', images: [image], body: null,
    querySelectorAll(selector) { return selector === 'img' ? [image] : []; }
  };
  const context = vm.createContext({ URL, document, innerHeight: 900, innerWidth: 1400,
    matchMedia: query => ({ matches: mediaMatch(query) }),
    getComputedStyle: () => ({ display: 'block', visibility: 'visible', backgroundImage: 'none', aspectRatio: '' }),
    ImageLens: { i18n: { text: () => 'Gallery' } } });
  vm.runInContext(fs.readFileSync(path.join(root, 'gallery.js'), 'utf8'), context, { filename: 'gallery.js' });
  return { gallery: context.ImageLens.gallery, image };
}

function source(srcset, dataFull, { media = '', type = 'image/webp', extra = {} } = {}) {
  const attrs = { srcset, ...(dataFull ? { 'data-full': dataFull } : {}), ...extra };
  return { media, type, getAttribute(name) { return attrs[name] ?? null; } };
}

function collect(fixture, openUrl = fixture.image.currentSrc || fixture.image.src) {
  return fixture.gallery.collect(openUrl, fixture.image);
}

test('currentSrc selects the matching picture source identity; unselected source metadata is excluded', () => {
  const selectedUrl = 'https://images.example.test/selected-large.webp';
  const selectedAltUrl = 'https://images.example.test/selected-small.webp';
  const otherUrl = 'https://images.example.test/other-large.webp';
  const otherLazyUrl = 'https://images.example.test/other-lazy.webp';
  const fullSelected = 'https://images.example.test/original-selected.jpg?asset=selected';
  const fullOther = 'https://images.example.test/original-other.jpg?asset=other';
  const unselectedLazy = { 'data-srcset': `${otherLazyUrl} 320w` };
  const f = createFixture({ currentSrc: selectedUrl, src: 'https://images.example.test/fallback.jpg', pictureSources: [
    source(`${selectedUrl} 1600w, ${selectedAltUrl} 640w`, fullSelected, { type: 'image/x-future' }),
    source(`${otherUrl} 1600w`, fullOther, { extra: unselectedLazy })
  ] });

  const result = collect(f);
  const entry = result.entries[result.index];
  assert.equal(entry.canonicalIdentity, fullSelected);
  assert.equal(entry.canonicalAmbiguous, false);
  assert.ok(entry.sources.includes(selectedUrl) && entry.sources.includes(selectedAltUrl), 'selected source candidates remain available for loading');
  assert.ok(entry.sources.includes(fullSelected), 'selected source full URL remains loadable');
  assert.ok(!entry.sources.includes(fullOther), 'unselected source full URL cannot become the current image resource');
  assert.ok(!entry.sources.includes(otherUrl) && !entry.sources.includes(otherLazyUrl), 'unselected source candidates cannot enter the current image resource set');
  assert.ok(!entry.identityAliases.includes(otherUrl) && !entry.identityAliases.includes(otherLazyUrl), 'unselected source candidates cannot enter identity aliases');

  const otherImage = createFixture({ currentSrc: otherUrl }).gallery.collect(otherUrl).entries[0];
  assert.equal(f.gallery.sameEntry(entry, otherImage), false, 'an unselected source URL cannot falsely identify the selected picture');
});

test('unselected data-srcset updates do not change selected resources or identity revision', () => {
  const current = 'https://images.example.test/selected-current.webp';
  const selectedFull = 'https://images.example.test/selected-original.jpg';
  const delayedA = 'https://images.example.test/unselected-lazy-a.webp';
  const delayedB = 'https://images.example.test/unselected-lazy-b.webp';
  const lazyAttributes = { 'data-srcset': `${delayedA} 640w` };
  const f = createFixture({ currentSrc: current, src: 'https://images.example.test/fallback.jpg', pictureSources: [
    source(`${current} 1600w`, selectedFull),
    source('', '', { extra: lazyAttributes })
  ] });

  const before = collect(f).entries[0];
  lazyAttributes['data-srcset'] = `${delayedB} 1280w`;
  const after = collect(f).entries[0];
  assert.deepEqual(after.sources, before.sources, 'unselected lazy hints do not restart source revision');
  assert.deepEqual(after.identityAliases, before.identityAliases, 'unselected lazy hints do not alter identity aliases');
  assert.equal(after.canonicalIdentity, selectedFull);
  assert.ok(after.sources.includes(current) && after.sources.includes(selectedFull), 'selected image remains available to the viewer');
  assert.ok(!after.sources.includes(delayedA) && !after.sources.includes(delayedB));
});

test('media-false source cannot contribute canonical identity even when its srcset contains currentSrc', () => {
  const selectedUrl = 'https://images.example.test/current.webp';
  const selectedFull = 'https://images.example.test/original-current.jpg';
  const excludedFull = 'https://images.example.test/original-media-false.jpg';
  const f = createFixture({ currentSrc: selectedUrl, pictureSources: [
    source(`${selectedUrl} 1x`, excludedFull, { media: '(max-width: 1px)' }),
    source(`${selectedUrl} 2x`, selectedFull)
  ], mediaMatch: query => query !== '(max-width: 1px)' });

  const entry = collect(f).entries[0];
  assert.equal(entry.canonicalIdentity, selectedFull);
  assert.equal(entry.canonicalAmbiguous, false);
});

test('duplicate currentSrc source candidates with the same canonical original are safe to coalesce', () => {
  const current = 'https://images.example.test/shared-current.webp';
  const original = 'https://images.example.test/shared-original.jpg?asset=42';
  const f = createFixture({ currentSrc: current, pictureSources: [
    source(`${current} 1x`, original), source(`${current} 2x`, original)
  ] });

  const entry = collect(f).entries[0];
  assert.equal(entry.canonicalIdentity, original);
  assert.equal(entry.canonicalAmbiguous, false);
});

test('duplicate currentSrc candidates with conflicting originals fail closed', () => {
  const current = 'https://images.example.test/shared-current.webp';
  const fullA = 'https://images.example.test/original-a.jpg?id=a';
  const fullB = 'https://images.example.test/original-b.jpg?id=b';
  const f = createFixture({ currentSrc: current, pictureSources: [
    source(`${current} 1x`, fullA), source(`${current} 2x`, fullB)
  ] });

  const entry = collect(f).entries[0];
  assert.equal(entry.canonicalIdentity, '');
  assert.equal(entry.canonicalAmbiguous, true);
  assert.ok(!entry.sources.includes(fullA) && !entry.sources.includes(fullB), 'ambiguous source originals are not offered as viewer resources');
});

test('empty currentSrc does not infer which lazy picture source is selected', () => {
  const fullA = 'https://images.example.test/lazy-original-a.jpg';
  const fullB = 'https://images.example.test/lazy-original-b.jpg';
  const f = createFixture({ currentSrc: '', src: 'https://images.example.test/fallback.jpg', pictureSources: [
    source('', fullA, { extra: { 'data-srcset': 'https://images.example.test/lazy-a.webp 1x' } }),
    source('', fullB, { extra: { 'data-srcset': 'https://images.example.test/lazy-b.webp 1x' } })
  ] });

  const entry = collect(f).entries[0];
  assert.equal(entry.canonicalIdentity, '');
  assert.equal(entry.canonicalAmbiguous, false, 'unselected source attributes do not poison a fallback image identity');
  assert.ok(!entry.sources.includes(fullA) && !entry.sources.includes(fullB));
});

test('currentSrc is sufficient before decode, but a matching img fallback makes source provenance ambiguous', () => {
  const current = 'https://images.example.test/same-url.webp';
  const original = 'https://images.example.test/picture-original.jpg';
  const selected = createFixture({ currentSrc: current, src: 'https://images.example.test/fallback.jpg', pictureSources: [
    source(`${current} 1x`, original)
  ] });
  assert.equal(collect(selected).entries[0].canonicalIdentity, original, 'canonical source does not wait for decode success');

  const fallback = createFixture({ currentSrc: current, src: current, pictureSources: [
    source(`${current} 1x`, original)
  ] });
  const ambiguous = collect(fallback).entries[0];
  assert.equal(ambiguous.canonicalIdentity, '');
  assert.equal(ambiguous.canonicalAmbiguous, true, 'identical URL from picture and img fallback does not reveal source provenance');
});

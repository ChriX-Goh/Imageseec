const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const i18nFixture = require('./i18n-fixture.cjs');
const locales = ['en','zh_CN','zh_TW','ja','ko','de','fr','es','ru','uk','pl'];
for (const locale of locales) test(`complete localized settings and placeholders: ${locale}`, async () => {
  const english = JSON.parse(source('_locales/en/messages.json'));
  const messages = JSON.parse(source(`_locales/${locale}/messages.json`));
  assert.deepEqual(Object.keys(messages).sort(), Object.keys(english).sort());
  for (const [key, value] of Object.entries(messages)) {
    assert.equal(typeof value.message, 'string'); assert.ok(value.message.trim(), key);
    assert.deepEqual(Object.keys(value.placeholders || {}).sort(), Object.keys(english[key].placeholders || {}).sort(), key);
    assert.deepEqual(value.placeholders, english[key].placeholders, key);
  }
  const c = vm.createContext({ setTimeout, clearTimeout, chrome: { i18n: i18nFixture.forLocale(locale.replace('_','-')) } });
  vm.runInContext(source('locale-catalogs.js'), c); vm.runInContext(source('i18n.js'), c); vm.runInContext(source('preferences.js'), c);
  assert.deepEqual(plain(c.ImageLens.catalogs[locale]), messages);
  await c.ImageLens.i18n.setLanguage(locale);
  assert.equal(c.ImageLens.i18n.locale, locale);
  assert.ok(c.ImageLens.preferences.html.includes(c.ImageLens.i18n.html('quickOpen')));
  assert.match(c.ImageLens.preferences.html, /name="language"/);
  assert.ok(c.ImageLens.i18n.text('imageCount', 3, 9).includes('3'));
  assert.ok(c.ImageLens.i18n.text('imageCount', 3, 9).includes('9'));
  assert.equal(c.ImageLens.i18n.text('zoomTo', 150).includes('150'), true);
  assert.doesNotMatch(c.ImageLens.i18n.text('imageCount', 3, 9), /\$\w+\$/);
  assert.ok(messages.extDescription.message.length <= 132, 'manifest description length');
});

test('browser UI language resolution and unsupported-language English fallback', () => {
  const c = vm.createContext({ setTimeout, clearTimeout, chrome: { i18n: i18nFixture.forLocale('sv-SE') } });
  vm.runInContext(source('i18n.js'), c);
  assert.equal(c.ImageLens.i18n.locale, 'en'); assert.equal(c.ImageLens.i18n.text('zoom'), 'Zoom');
  assert.deepEqual(plain(c.ImageLens.i18n.locales), locales);
  for (const [input, expected] of [['en-GB','en'],['ru-RU','ru'],['uk-UA','uk'],['pl-PL','pl'],['zh-CN','zh_CN'],['zh-TW','zh_TW'],['fr-CA','fr'],['pt-BR','en'],['','en']]) assert.equal(c.ImageLens.i18n.resolveLocale(input),expected);
  const manifest = JSON.parse(source('manifest.json'));
  assert.equal(manifest.default_locale,'en'); assert.equal(manifest.description,'__MSG_extDescription__');
});

test('manual language selection loads the chosen catalog and auto restores browser language', async () => {
  const chrome = {
    i18n: i18nFixture.forLocale('zh-CN'),
    runtime: { async sendMessage({ locale }) { return { locale, messages: JSON.parse(source(`_locales/${locale}/messages.json`)) }; } }
  };
  const c = vm.createContext({ setTimeout, clearTimeout, chrome });
  vm.runInContext(source('locale-catalogs.js'), c); vm.runInContext(source('i18n.js'), c);
  await c.ImageLens.i18n.setLanguage('en');
  assert.equal(c.ImageLens.i18n.locale, 'en');
  assert.equal(c.ImageLens.i18n.text('loading'), 'Loading image…');
  await c.ImageLens.i18n.setLanguage('ru');
  assert.equal(c.ImageLens.i18n.text('loading'), 'Загрузка изображения…');
  await c.ImageLens.i18n.setLanguage('auto');
  assert.equal(c.ImageLens.i18n.locale, 'zh_CN');
  assert.equal(c.ImageLens.i18n.text('loading'), '正在载入图片…');
});

test('translated HTML and substituted values are escaped before template insertion', () => {
  const c = vm.createContext({ setTimeout, clearTimeout, chrome: { i18n: i18nFixture.forLocale('en') } });
  vm.runInContext(source('i18n.js'), c);
  const value = c.ImageLens.i18n.html('viewImage', '<img src=x onerror="alert(1)">');
  assert.doesNotMatch(value, /<img/); assert.match(value, /&lt;img/); assert.match(value, /&quot;/);
});

test('packaged UI has no untranslated Chinese literals or unlisted message keys', () => {
  const messages = JSON.parse(source('_locales/en/messages.json'));
  for (const file of ['viewer.js','options.js','background.js','standalone.js','options.html','standalone.html']) {
    assert.doesNotMatch(source(file), /\p{Script=Han}/u, file);
    for (const match of source(file).matchAll(/(?:\bt|\bh|\bgetMessage)\('([A-Za-z]+)'/g)) assert.ok(messages[match[1]], `${file}: ${match[1]}`);
  }
  assert.match(source('preferences.js'), /\['zh_CN', '简体中文'\]/);
  assert.match(source('preferences.js'), /\['zh_TW', '繁體中文'\]/);
  assert.match(source('LICENSE'), /MIT License/);
  assert.match(source('LICENSE'), /2026 Imageseec contributors/);
});
test('2.0 store listings exist for all UI locales and fit Chrome text limits', () => {
  const manifest = JSON.parse(source('manifest.json'));
  const beta = manifest.version_name?.match(/^2\.0 b([1-9]\d*)$/);
  assert.ok(beta, 'test builds must display an explicit beta number');
  assert.equal(manifest.version, `2.0.0.${beta[1]}`);
  assert.ok(Number(beta[1]) <= 65535, 'Chrome version components must fit their allowed range');
  const copy = [];
  for (const locale of locales) {
    const title = source(`release/listing/${locale}-title.txt`).trim();
    const summary = source(`release/listing/${locale}-summary.txt`).trim();
    const description = source(`release/listing/${locale}-description.txt`).trim();
    assert.ok(title.length > 0 && title.length <= 75, `${locale} title length`);
    assert.ok(summary.length > 0 && summary.length <= 132, `${locale} summary length`);
    assert.ok(description.length > 0 && description.length <= 16000, `${locale} description length`);
    copy.push(title, summary, description);
  }
  assert.doesNotMatch(copy.join('\n'), /https?:\/\//i);
});
test('settings page shows the manifest build label instead of a stale hard-coded version', () => {
  assert.doesNotMatch(source('options.html'), /1\.5\.2/);
  assert.match(source('options.html'), /class="version"><\/span>/);
  assert.match(source('options.js'), /runtime\?\.getManifest\?\.\(\)/);
});
test('compare and overview controls are wired to group-scoped lazy scanning', () => {
  const viewer = source('viewer.js');
  assert.match(viewer, /on\(\$\('\.compare-toggle'\), 'click'/);
  assert.match(viewer, /on\(\$\('\.overview-toggle'\), 'click'/);
  assert.match(viewer, /function scanSegment\(signal, direction/);
  assert.match(viewer, /restorePageCoordinates/);
  assert.match(viewer, /function overviewCacheCount/);
  assert.match(viewer, /overviewCacheRange/);
  assert.match(viewer, /scrollbar-gutter/);
  assert.match(viewer, /function revealSource\(target/);
  assert.match(viewer, /divider-handle-y/);
  assert.doesNotMatch(viewer, /settings\.overviewBuffer/);
  assert.match(viewer, /settings\.compareStep/);
  assert.match(viewer, /settings\.dividerMin/);
  assert.doesNotMatch(viewer, /location\.(?:hostname|host)|\.hostname\s*(?:===|\.endsWith)/i);
});
test('overview scanner bounds placeholder waits and assigns visible holes to the active scroll direction', () => {
  const node = {};
  const c = vm.createContext({
    overviewOpen: true,
    projectedSlots: new Map([['slot-1', { key: 'reserved:slot-1', entry: null, slotKey: 'slot-1', slotNode: node }]]),
    scanStates: {
      '-1': { slotAttempts: new Map([['slot-1', 3]]) },
      '1': { slotAttempts: new Map() }
    }
  });
  vm.runInContext([
    viewerFunction('overviewSlotPending'),
    viewerFunction('scanSlotPending'),
    viewerFunction('overviewPendingForSide'),
    `globalThis.slotPending = (slot, side) => scanSlotPending(slot, side, projectedSlots);`,
    `globalThis.sidePending = (side, before, visible, after, direction) => overviewPendingForSide(side, before, visible, after, direction);`
  ].join('\n'), c);
  const slot = { key: 'slot-1', node, pending: true };
  assert.equal(c.slotPending(slot, -1), false, 'an exhausted placeholder must stop holding backward loading');
  assert.equal(c.slotPending(slot, 1), true, 'retry state remains independent for a genuinely opposite-side scan');
  assert.equal(c.sidePending(-1, false, true, false, 1), false, 'a visible hole must not start a second, reverse scan');
  assert.equal(c.sidePending(1, false, true, false, 1), true, 'the current scroll direction services the visible hole');
  assert.equal(c.sidePending(-1, false, true, false, -1), true, 'reversing scroll direction transfers visible-hole demand');
  assert.equal(c.slotPending({ ...slot, node: {} }, 1), false, 'a recycled slot node must not match the old projection');
  c.projectedSlots.clear();
  assert.equal(c.slotPending(slot, 1), false, 'a source slot outside the rendered overview must not spin as active cache work');
});
test('scanner jumps are instant for CSS-smooth document roots and nested scrollers', () => {
  const sourceScroll = viewerFunction('scrollSourceTo');
  const rootState = { x: 7, y: 11, call: null };
  const root = vm.createContext({
    scanScroller: null, scanHorizontal: false, pagePosition: { x: rootState.x },
    sourcePosition: () => rootState.y,
    window: { scrollTo(options) { rootState.call = options; rootState.x = options.left; rootState.y = options.top; } }
  });
  vm.runInContext(`${sourceScroll}\nglobalThis.move = position => scrollSourceTo(position);`, root);
  assert.equal(root.move(420), 420);
  assert.deepEqual(plain(rootState.call), { left: 7, top: 420, behavior: 'instant' });

  const nestedState = { call: null };
  const scroller = {
    scrollLeft: 13, scrollTop: 17,
    scrollTo(options) { nestedState.call = options; this.scrollLeft = options.left; this.scrollTop = options.top; }
  };
  const nested = vm.createContext({
    scanScroller: scroller, scanHorizontal: false, pagePosition: { x: 0 },
    sourcePosition: () => scroller.scrollTop,
    window: { scrollTo() { assert.fail('nested scanning must not scroll the document root'); } }
  });
  vm.runInContext(`${sourceScroll}\nglobalThis.move = position => scrollSourceTo(position);`, nested);
  assert.equal(nested.move(860), 860);
  assert.deepEqual(plain(nestedState.call), { left: 13, top: 860, behavior: 'instant' });
});
function context(hostname = 'example.com') {
  const images = [];
  const document = { baseURI: `https://${hostname}/album/`, images, body: null, querySelectorAll: s => s === 'img' ? images : [] };
  const c = vm.createContext({ setTimeout, clearTimeout, URL, document, chrome: { i18n: i18nFixture.forLocale('en') }, location: { hostname }, matchMedia: () => ({ matches: true }), getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) });
  vm.runInContext(source('i18n.js'), c);
  vm.runInContext(source('settings.js'), c); vm.runInContext(source('controls.js'), c); vm.runInContext(source('gallery.js'), c);
  function image(src, attributes = {}) {
    const node = { tagName: 'IMG', src, currentSrc: src, alt: '', title: '', className: '', isConnected: true, parentElement: null,
      getAttribute: name => name === 'src' ? src : attributes[name] || null,
      closest: () => null, getBoundingClientRect: () => ({ width: 200, height: 140 }) };
    images.push(node); return node;
  }
  return { c, image, images };
}
function viewerFunction(name) {
  const viewer = source('viewer.js');
  const lines = viewer.split(/\r?\n/);
  const start = lines.findIndex(line => new RegExp(`^\\s{4}function ${name}\\(`).test(line));
  assert.notEqual(start, -1, `missing viewer function ${name}`);
  let end = start + 1;
  while (end < lines.length && !/^\s{4}function [A-Za-z_$][\w$]*\(/.test(lines[end])) end++;
  return lines.slice(start, end).join('\n');
}
test('visible-range cache is reused only while geometry and scroll position match', () => {
  const c = vm.createContext({});
  vm.runInContext(`
    let overviewGeometry = 'layout-a', overviewRangeMemo = null, overviewSpatialIndex = [], calls = 0, gridY = 0;
    const settings = { overviewDirection: 'vertical' };
    const lens = { controls: { overviewIndexedRange(index, rect) { calls++; const first = Math.max(0, Math.floor(rect.top / 75)); return { first, last: Math.min(2, first + 1) }; } } };
    const overview = { getBoundingClientRect: () => ({ left: 0, right: 100, top: 0, bottom: 100 }) };
    const overviewGrid = { children: [0, 1, 2].map(index => ({ dataset: { index: String(index) } })),
      getBoundingClientRect: () => ({ left: 0, top: gridY }) };
    function overviewCardBox(card, grid) { calls++; const top = grid.top + Number(card.dataset.index) * 75; return { left: 0, right: 100, top, bottom: top + 70 }; }
    ${viewerFunction('overviewVisibleRange')}
    globalThis.run = () => overviewVisibleRange();
    globalThis.count = () => calls;
    globalThis.move = value => { gridY = value; };
    globalThis.relayout = () => { overviewGeometry = 'layout-b'; };
  `, c);
  assert.deepEqual(plain(c.run()), { first: 0, last: 1 });
  assert.equal(c.count(), 1);
  assert.deepEqual(plain(c.run()), { first: 0, last: 1 });
  assert.equal(c.count(), 1);
  c.move(-75);
  assert.deepEqual(plain(c.run()), { first: 1, last: 2 });
  assert.equal(c.count(), 2);
  c.relayout(); c.run(); assert.equal(c.count(), 3);
});
test('spatial index matches brute-force visibility for mixed aspect ratios and both axes', () => {
  const controls = context().c.ImageLens.controls;
  const ratios = Array.from({length: 1000}, (_, i) => [.3, .7, 1, 1.8, 3][i % 5]);
  for (const horizontal of [false, true]) for (const alignment of ['auto', 'vertical', 'horizontal']) {
    const boxes = controls.overviewLayout(ratios, 1200, 720, horizontal, false, alignment).boxes;
    const index = controls.overviewSpatialIndex(boxes, horizontal);
    for (let offset = 0; offset < 9000; offset += 237) {
      const rect = horizontal ? {left:offset, right:offset+1200, top:0, bottom:720} : {left:0, right:1200, top:offset, bottom:offset+720};
      const hits = boxes.map((b, i) => ({b, i})).filter(({b}) => b.x+b.width>rect.left && b.x<rect.right && b.y+b.height>rect.top && b.y<rect.bottom).map(x => x.i);
      assert.deepEqual(plain(controls.overviewIndexedRange(index, rect, horizontal)), {first: hits.length ? Math.min(...hits) : -1, last: hits.length ? Math.max(...hits) : -1});
    }
  }
});
test('thumbnail scheduling only touches the current and previous cache windows', () => {
  const c = vm.createContext({});
  vm.runInContext(`
    let overviewOpen = true, overviewPress = null, overviewDirty = false;
    let window = { start: 100, end: 109, first: 103, last: 106 }, touched = [], dropped = [];
    const overviewItems = Array.from({length: 1000}, (_, index) => ({key: String(index), thumb: 'image-' + index}));
    const overviewCards = new Map(overviewItems.map(item => [item.key, {
      dataset: {}, image: { loading: '', hasAttribute: () => false, removeAttribute: () => {} },
      querySelector() { touched.push(item.key); return this.image; }
    }]));
    const overviewThumbJobs = new Map(), overviewThumbQueue = [];
    let overviewThumbWindow = new Map(); const overviewThumbRetained = new Map();
    function overviewCacheWindow() { return window; }
    function queueOverviewThumbnail(item, card) { overviewThumbJobs.set(item.key, {key:item.key, status:'ready'}); }
    function dropOverviewThumbnail(job) { dropped.push(job.key); overviewThumbJobs.delete(job.key); }
    function pumpOverviewThumbnails() {} function updateOverviewStatus() {}
    ${viewerFunction('updateOverviewThumbnails')}
    globalThis.run = () => { touched = []; dropped = []; updateOverviewThumbnails(); return { touched, dropped }; };
    globalThis.move = () => { window = { start: 105, end: 114, first: 108, last: 111 }; };
  `, c);
  assert.equal(c.run().touched.length, 10);
  c.move();
  const next = plain(c.run());
  assert.equal(next.touched.length, 15);
  assert.deepEqual(next.dropped, ['100', '101', '102', '103', '104']);
  assert.ok(!next.touched.includes('999'));
});
test('recent decoded thumbnails survive reverse scrolling and retention stays bounded', () => {
  const c = vm.createContext({});
  vm.runInContext(`
    let overviewOpen = true, overviewPress = null, overviewDirty = false;
    let window = {start: 0, end: 9, first: 0, last: 9};
    const overviewItems = Array.from({length: 100}, (_, i) => ({key:String(i), thumb:'image-'+i}));
    const overviewCards = new Map(overviewItems.map(item => { const image = {src:'', loading:'', getAttribute: () => image.src,
      hasAttribute: () => !!image.src, removeAttribute: () => {image.src='';}};
      return [item.key, {dataset:{}, isConnected:true, querySelector: () => image}]; }));
    const overviewThumbJobs = new Map(), overviewThumbQueue = [], overviewThumbRetained = new Map();
    let overviewThumbWindow = new Map();
    function overviewCacheWindow() { return window; }
    function queueOverviewThumbnail(item, card) { const image = card.querySelector('img'); image.src=item.thumb;
      overviewThumbJobs.set(item.key, {key:item.key, source:item.thumb, image, status:'ready'}); }
    function dropOverviewThumbnail(job, remove = true) { if(remove)job.image.removeAttribute('src'); overviewThumbJobs.delete(job.key); }
    function pumpOverviewThumbnails() {} function updateOverviewStatus() {}
    ${viewerFunction('updateOverviewThumbnails')}
    globalThis.move = start => {window = {start, end:start+9, first:start, last:start+9}; updateOverviewThumbnails();};
    globalThis.count = () => overviewThumbRetained.size;
    globalThis.has = key => !!overviewCards.get(String(key)).querySelector('img').src;
  `, c);
  c.move(0); c.move(10); assert.equal(c.has(0), true);
  c.move(0); assert.equal(c.has(0), true);
  for (let n = 10; n <= 90; n += 10) c.move(n);
  assert.equal(c.count(), 64);
  assert.equal(c.has(0), false);
  assert.equal(c.has(89), true);
});
function overviewProjectionHarness(initial) {
  const c = vm.createContext({ state: initial, getComputedStyle: () => ({ aspectRatio: 'auto' }) });
  vm.runInContext(`
    let entries = state.entries, overviewItems = state.overviewItems, collection = state.collection;
    let overviewStartOrdinal = state.overviewStartOrdinal || 0;
    ${['ratioRank', 'ratioFromEntry', 'ratioFromSlot', 'layoutRatio', 'collectOverviewItems'].map(viewerFunction).join('\n')}
    globalThis.project = rebuild => collectOverviewItems(rebuild);
    globalThis.replaceState = next => {
      entries = next.entries; overviewItems = next.overviewItems;
      collection = next.collection; overviewStartOrdinal = next.overviewStartOrdinal || 0;
    };
    globalThis.readStartOrdinal = () => overviewStartOrdinal;
  `, c);
  return c;
}
function projectionSlot(key, { connected = true, pending = true, order = '' } = {}) {
  const node = { isConnected: connected, getAttribute: name => name === 'aria-posinset' ? order : null,
    querySelectorAll: () => [], getBoundingClientRect: () => ({ width: 240, height: 180 }) };
  return { key, node, pending, stable: true };
}
function projectionEntry(key, slot, extra = {}) {
  const node = { isConnected: true };
  const thumb = `https://img.example/${key}.jpg`;
  return { key, thumb, sources: [thumb], aliases: [thumb], node, slotKey: slot.key, slotStable: true,
    slotNode: slot.node, aspectRatio: 4 / 3, aspectRatioSource: 'intrinsic', ...extra };
}
test('settings defaults, invalid storage values and independent bounds', () => {
  const { c } = context(); const normalize = c.ImageLens.settings.normalize;
  assert.deepEqual(plain(normalize(null)), { language: 'auto', toolbarAutoHide: false, overviewScale: 100, zoomStep: 15, holdZoom: 200, cacheBefore: 2, cacheAfter: 2, previewBefore: 3, previewAfter: 3, overviewCacheBeforeMode: 'auto', overviewCacheBefore: 12, overviewCacheAfterMode: 'auto', overviewCacheAfter: 12, overviewDirection: 'vertical', overviewAlignment: 'auto', overviewGap: 12, overviewClean: false, dividerMin: 33, compareStep: 2, compareEnabled: false, zoomLocked: false, doubleClickExit: true, quickOpen: true });
  assert.deepEqual(plain(normalize({ language: 'fr', zoomStep: 0, holdZoom: 999, cacheBefore: -2, cacheAfter: 99, previewBefore: 'x', previewAfter: 0, overviewBuffer: 20, dividerMin: 1, compareStep: 0, doubleClickExit: false })), { language: 'fr', toolbarAutoHide: false, overviewScale: 100, zoomStep: 1, holdZoom: 800, cacheBefore: 0, cacheAfter: 12, previewBefore: 3, previewAfter: 0, overviewCacheBeforeMode: 'auto', overviewCacheBefore: 12, overviewCacheAfterMode: 'custom', overviewCacheAfter: 20, overviewDirection: 'vertical', overviewAlignment: 'auto', overviewGap: 12, overviewClean: false, dividerMin: 10, compareStep: 1, compareEnabled: false, zoomLocked: false, doubleClickExit: false, quickOpen: true });
  assert.equal(normalize({ overviewBuffer: 6 }).overviewCacheBeforeMode, 'auto');
  assert.equal(normalize({ overviewCacheBeforeMode: 'custom', overviewCacheBefore: 0 }).overviewCacheBefore, 0);
  assert.equal(normalize({ overviewCacheAfterMode: 'custom', overviewCacheAfter: 37 }).overviewCacheAfter, 37);
  assert.equal(normalize({ overviewCacheAfterMode: 'invalid', overviewCacheAfter: -3 }).overviewCacheAfterMode, 'auto');
  assert.equal(normalize({ language: 'pt' }).language, 'auto');
  assert.equal(normalize({ overviewDirection: 'sideways' }).overviewDirection, 'vertical');
  assert.equal(normalize({ overviewDirection: 'horizontal', overviewClean: true }).overviewDirection, 'horizontal');
  assert.equal(normalize({ overviewClean: 'true' }).overviewClean, false);
  assert.equal(normalize({ toolbarAutoHide: true }).toolbarAutoHide, true);
  assert.equal(normalize({ overviewScale: 1 }).overviewScale, 25);
  assert.equal(normalize({ overviewScale: 500 }).overviewScale, 300);
});
test('adaptive overview preserves each image ratio in masonry and justified layouts', () => {
  const { c } = context(), controls = c.ImageLens.controls;
  const ratios = Array.from({ length: 80 }, (_, i) => [.55, 1, 1.8, 2.3][i % 4]);
  for (const horizontal of [false, true]) for (const alignment of ['auto', 'vertical', 'horizontal']) {
    const result = controls.overviewLayout(ratios, 1392, 760, horizontal, false, alignment, 12, 100);
    const padding = 12, caption = 27;
    assert.equal(result.boxes.length, ratios.length);
    assert.ok(result.bandSize > 0);
    result.boxes.forEach((box, index) => {
      assert.equal(box.index, index);
      assert.equal(box.ordinal, index);
      assert.ok(Math.abs((box.width - padding) / (box.height - padding - caption) - ratios[index]) < .0001);
      assert.ok(box.width > 0 && box.height > 0);
      if (horizontal) assert.ok(box.y >= 0 && box.y + box.height <= 760 + .01);
      else assert.ok(box.x >= 0 && box.x + box.width <= 1392 + .01);
      for (const next of result.boxes.slice(index + 1)) {
        assert.ok(box.x + box.width + 12 <= next.x + .01 || next.x + next.width + 12 <= box.x + .01 ||
          box.y + box.height + 12 <= next.y + .01 || next.y + next.height + 12 <= box.y + .01);
      }
    });
  }
});

test('adaptive masonry lanes and justified bands stay attached to stable items after decode and prepend', () => {
  const { c } = context(), layout = c.ImageLens.controls.overviewLayout;
  const ratios = Array.from({ length: 36 }, (_, i) => [.55, 1, 1.8, 2.3][i % 4]);
  const initial = layout(ratios, 1392, 760, false, false, 'auto', 12, 100, 24);
  const prependRatios = [.7, 1.7, ...ratios];
  const prepended = layout(prependRatios, 1392, 760, false, false, 'auto', 12, 100, 22,
    { lanes: [null, null, ...initial.lanes] });
  for (let i = 0; i < ratios.length; i++) assert.equal(prepended.lanes[i + 2], initial.lanes[i]);
  const decoded = prependRatios.slice(); decoded[12] = 2.6;
  const afterDecode = layout(decoded, 1392, 760, false, false, 'auto', 12, 100, 22,
    { lanes: prepended.lanes });
  assert.deepEqual(afterDecode.lanes, prepended.lanes, 'a late intrinsic ratio must not move the item to another column');
  assert.ok(Math.abs((afterDecode.boxes[12].width - 12) / (afterDecode.boxes[12].height - 39) - 2.6) < .0001);

  const rows = layout(ratios, 1392, 760, false, false, 'horizontal', 12, 100, 24);
  const rowPrepend = layout([.8, 1.4, ...ratios], 1392, 760, false, false, 'horizontal', 12, 100, 22,
    { bands: [null, null, ...rows.bandIds] });
  for (let i = 0; i < ratios.length; i++) assert.equal(rowPrepend.bandIds[i + 2], rows.bandIds[i]);
  const rowRatios = [.8, 1.4, ...ratios]; rowRatios[8] = .42;
  const rowDecoded = layout(rowRatios, 1392, 760, false, false, 'horizontal', 12, 100, 22,
    { bands: rowPrepend.bandIds });
  assert.deepEqual(rowDecoded.bandIds, rowPrepend.bandIds, 'late ratios may resize within a row but cannot regroup its items');
  assert.ok(Math.abs((rowDecoded.boxes[8].width - 12) / (rowDecoded.boxes[8].height - 39) - .42) < .0001);
});

test('adaptive overview scale preserves source ratios while cross-axis tracks respond to settings', () => {
  const { c } = context(), controls = c.ImageLens.controls;
  const ratios = Array.from({ length: 80 }, (_, i) => [.6, 1, 1.8][i % 3]);
  for (const horizontal of [false, true]) {
    const base = controls.overviewLayout(ratios, 1392, 760, horizontal, false, 'auto', 12, 100);
    const smaller = controls.overviewLayout(ratios, 1392, 760, horizontal, false, 'auto', 12, 50);
    const larger = controls.overviewLayout(ratios, 1392, 760, horizontal, false, 'auto', 12, 200);
    assert.ok(smaller.bandSize >= base.bandSize);
    assert.ok(larger.bandSize <= base.bandSize);
    const cross = box => horizontal ? box.height : box.width;
    assert.ok(Math.abs(cross(base.boxes[0]) - cross(base.boxes[1])) < .001);
    assert.ok(Math.abs(cross(larger.boxes[0]) - cross(larger.boxes[1])) < .001);
    for (const [index, box] of base.boxes.entries()) {
      assert.ok(Math.abs((box.width - 12) / (box.height - 39) - ratios[index]) < .0001);
    }
  }
});

test('overview size bounds preserve 100 percent defaults and ruler mapping', () => {
  const { c } = context(), controls = c.ImageLens.controls;
  const ratios = Array.from({ length: 36 }, (_, i) => [.6, 1, 1.8][i % 3]);
  for (const horizontal of [false, true]) for (const alignment of ['auto', 'vertical', 'horizontal']) {
    const layout = (scale, w = 1250, h = 760) => controls.overviewLayout(ratios, w, h, horizontal, false, alignment, 12, scale);
    assert.deepEqual(plain(layout()), plain(layout(100)));
    assert.ok(layout(25).bandSize >= layout(100).bandSize);
    assert.ok(layout(300).bandSize <= layout(100).bandSize);
    for (const scale of [25, 100, 300]) for (const [w, h] of [[1250, 760], [300, 280]]) {
      const result = layout(scale, w, h);
      for (const box of result.boxes) {
        assert.ok(box.width > 0 && box.height > 0);
        assert.ok(horizontal ? box.y + box.height <= h + .01 : box.x + box.width <= w + .01);
      }
    }
  }
  for (const size of [25, 33, 50, 88, 100, 181, 200, 259, 300]) {
    assert.ok(Math.abs(controls.fromPosition(controls.toPosition(size, 100, true), 100, true) - size) < .00001);
  }
});
test('adaptive overview retains source order metadata, ratio, and cross-axis bounds', () => {
  const { c } = context();
  const ratios = [1.8, .6, 1.3, 2, .8, 1, 1.6, .5, 3, 1.4, .7, 1.1, 1.8, .6, 1.3, 2, .8, 1];
  for (const horizontal of [false, true]) for (const clean of [false, true]) {
    const result = c.ImageLens.controls.overviewLayout(ratios, 1000, 560, horizontal, clean);
    assert.equal(result.boxes.length, ratios.length);
    const inset = clean ? 0 : 12, caption = clean ? 0 : 27;
    result.boxes.forEach((box, n) => {
      assert.ok(Math.abs((box.width - inset) / (box.height - inset - caption) - ratios[n]) < .0001);
      assert.ok(box.width > 0 && box.height > 0);
      assert.ok(horizontal ? box.y + box.height <= 560.001 : box.x + box.width <= 1000.001);
      if (n) {
        const prior = result.boxes[n - 1];
        assert.ok(box.ordinal > prior.ordinal);
      }
    });
    assert.ok(horizontal ? result.width >= 0 : result.height >= 0);
  }
});

test('auto, column and row alignment keep gaps, ratios and direction independent', () => {
  const { c } = context(), ratios = [2, .45, 1, 3.2, .7, 1.5, 1, .5, 2.1, .9, 1.1, .4];
  for (const horizontal of [false, true]) for (const alignment of ['auto', 'vertical', 'horizontal']) for (const gap of [0, 12, 48]) for (const clean of [false, true]) {
    const { boxes, width, height } = c.ImageLens.controls.overviewLayout(ratios, 1000, 600, horizontal, clean, alignment, gap);
    const inset = clean ? 0 : 12, caption = clean ? 0 : 27;
    assert.equal(boxes.length, ratios.length);
    boxes.forEach((a, n) => {
      assert.ok(Math.abs((a.width - inset) / (a.height - inset - caption) - ratios[n]) < .00001);
      assert.ok(a.x >= 0 && a.y >= 0 && a.x + a.width <= width + .01 && a.y + a.height <= height + .01);
      for (const b of boxes.slice(n + 1)) assert.ok(a.x + a.width + gap <= b.x + .01 || b.x + b.width + gap <= a.x + .01 || a.y + a.height + gap <= b.y + .01 || b.y + b.height + gap <= a.y + .01);
    });
    if (horizontal) assert.equal(height, 600); else assert.equal(width, 1000);
    if (alignment === 'auto') assert.ok(boxes.every(box => Math.abs((horizontal ? box.height : box.width) - (horizontal ? boxes[0].height : boxes[0].width)) < .01));
  }
  const normalize = c.ImageLens.settings.normalize;
  assert.equal(normalize({ overviewAlignment: 'bogus' }).overviewAlignment, 'auto');
  assert.equal(normalize({ overviewGap: -1 }).overviewGap, 0);
  assert.equal(normalize({ overviewGap: 99 }).overviewGap, 48);
});

test('overview automatic preload follows live visual band count and custom sides clamp to gallery', () => {
  const { c } = context(), controls = c.ImageLens.controls;
  const wide = controls.overviewLayout(Array(90).fill(1.5), 1392, 760, false, false, 'auto', 12);
  const narrow = controls.overviewLayout(Array(90).fill(1.5), 720, 760, false, false, 'auto', 12);
  const horizontal = controls.overviewLayout(Array(90).fill(1.5), 1392, 760, true, false, 'auto', 12);
  assert.equal(wide.bandSize, 6);
  assert.ok(narrow.bandSize < wide.bandSize);
  assert.ok(horizontal.bandSize > 0);
  assert.deepEqual(plain(controls.overviewCacheRange(100, 20, 25, wide.bandSize * 2, wide.bandSize * 2)), { start: 8, end: 37, before: 12, after: 12 });
  assert.deepEqual(plain(controls.overviewCacheRange(100, 2, 95, 50, 50)), { start: 0, end: 99, before: 2, after: 4 });
  assert.deepEqual(plain(controls.overviewCacheRange(3, 1, 1, 0, 0)), { start: 1, end: 1, before: 0, after: 0 });
});
test('unresolved cards do not fill either side of the overview thumbnail buffer', () => {
  const { c } = context();
  const images = new Set([0, 2, 4, 5, 7, 10]);
  const range = c.ImageLens.controls.overviewCacheRange;
  assert.deepEqual(plain(range(12, 4, 5, 2, 2, i => images.has(i))), { start: 0, end: 10, before: 2, after: 2 });
  assert.deepEqual(plain(range(12, 4, 5, 0, 3, i => images.has(i))), { start: 4, end: 11, before: 0, after: 2 });
});

test('new justified bands stay distinct from existing bands after middle insertion', () => {
  const { c } = context();
  const layout = c.ImageLens.controls.overviewLayout;
  for (const horizontal of [false, true]) {
    const alignment = horizontal ? 'vertical' : 'horizontal';
    const previous = layout(Array(24).fill(1.4), 1200, 720, horizontal, false, alignment);
    const ratios = Array(25).fill(1.4), hints = [...previous.bandIds];
    hints.splice(5, 0, null);
    const updated = layout(ratios, 1200, 720, horizontal, false, alignment, 12, 100, 0, { bands: hints });
    const positions = new Map();
    updated.bandIds.forEach((key, index) => {
      if (positions.has(key)) assert.equal(positions.get(key), index - 1, 'a band may not recur after another band');
      positions.set(key, index);
    });
    assert.equal(updated.boxes.length, 25);
  }
});

test('overview virtual gallery grows ahead and behind the visible range as cache demand changes', () => {
  const { c } = context(), controls = c.ImageLens.controls;
  const cache = (total, first, last, band, beforeMode = 'auto', beforeValue = 12, afterMode = 'auto', afterValue = 12) =>
    controls.overviewCacheRange(total, first, last, beforeMode === 'auto' ? band * 2 : beforeValue, afterMode === 'auto' ? band * 2 : afterValue);
  assert.deepEqual(plain(cache(80, 30, 52, 6)), { start: 18, end: 64, before: 12, after: 12 });
  assert.deepEqual(plain(cache(80, 30, 52, 4, 'auto', 0, 'custom', 35)), { start: 22, end: 79, before: 8, after: 27 });
  assert.deepEqual(plain(cache(80, 30, 52, 6, 'custom', 0, 'custom', 0)), { start: 30, end: 52, before: 0, after: 0 });
});

test('image identity preserves query identifiers, dimensions and signatures', () => {
  const { c } = context(), g = c.ImageLens.gallery;
  for (const param of ['q', 'w', 'width', 'height', 'quality', 'fit', 'token', 'x-amz-signature']) {
    const first = `https://media.example.test/image?${param}=first`, second = `https://media.example.test/image?${param}=second`;
    assert.notEqual(g.key(first), g.key(second));
    assert.equal(g.key(first), first);
  }
});

test('gallery snapshots retain identity and order across prepend, holes, aliases and recycled nodes', () => {
  const { c } = context(), merge = c.ImageLens.gallery.mergeEntries;
  const entry = (name, extra = {}) => ({ key: name, sources: [name], aliases: [name], ...extra });
  const a = entry('a'), c1 = entry('c'), d = entry('d');
  let records = merge([c1, d], [a, entry('b'), entry('c')], -1);
  assert.deepEqual(plain(records.map(e => e.key)), ['a', 'b', 'c', 'd']);
  records = merge(records, [entry('b'), entry('hole'), entry('c')]);
  assert.deepEqual(plain(records.map(e => e.key)), ['a', 'b', 'hole', 'c', 'd']);
  const oldBlob = entry('blob:old', { slotKey: 'data-id:7', slotStable: true });
  const blobs = merge([oldBlob], [entry('blob:new', { slotKey: 'data-id:7', slotStable: true })]);
  assert.equal(blobs.length, 1); assert.equal(blobs[0].key, 'blob:old'); assert.deepEqual(plain(blobs[0].sources), ['blob:new']);
  assert.equal(merge([entry('thumb', { aliases: ['thumb', 'original'] })], [entry('original')]).length, 1);
  const node = {};
  assert.equal(merge([entry('first', { node })], [entry('unrelated', { node })]).length, 2);
  assert.deepEqual(plain(merge([entry('e'), entry('f')], [entry('a'), entry('b'), entry('c')], -1).map(e=>e.key)), ['a', 'b', 'c', 'e', 'f']);
});
test('overview projection fills a newly resolved middle slot and removes the reserved card', () => {
  const { c } = context();
  const a = projectionSlot('slot:a', { pending: false }), b = projectionSlot('slot:b'), slotC = projectionSlot('slot:c', { pending: false });
  const first = [projectionEntry('a', a), projectionEntry('c', slotC)];
  const state = { entries: first, collection: { slots: [a, b, slotC] }, overviewItems: [
    { key: 'a', entry: first[0], thumb: first[0].thumb, slotKey: a.key, slotNode: a.node, layoutRatio: 4/3, layoutRatioSource: 'intrinsic' },
    { key: 'reserved:slot:b', entry: null, thumb: '', slotKey: b.key, slotNode: b.node, layoutRatio: 4/3, layoutRatioSource: 'fallback' },
    { key: 'c', entry: first[1], thumb: first[1].thumb, slotKey: slotC.key, slotNode: slotC.node, layoutRatio: 4/3, layoutRatioSource: 'intrinsic' }
  ] };
  const vmc = overviewProjectionHarness(state);
  const resolved = projectionEntry('b', b);
  b.pending = false;
  const merged = c.ImageLens.gallery.mergeEntries(first, [first[0], resolved, first[1]]);
  vmc.replaceState({ entries: merged, collection: { slots: [a, b, slotC] }, overviewItems: state.overviewItems });
  const result = plain(vmc.project(false));
  assert.deepEqual(result.map(item => item.entry.key), ['a', 'b', 'c']);
  assert.equal(result[1].key, 'reserved:slot:b', 'filling a reserved card retains its stable projection key');
  assert.equal(result[1].thumb, resolved.thumb);
  assert.equal(result[0].lane, null);
  assert.equal(result[2].lane, null);
});
test('overview projection drops stale disconnected slots instead of preserving dead placeholders', () => {
  const a = projectionSlot('slot:a', { pending: false }), dead = projectionSlot('slot:dead', { connected: false }), c = projectionSlot('slot:c', { pending: false });
  const entries = [projectionEntry('a', a), projectionEntry('c', c)];
  const overviewItems = [
    { key: 'a', entry: entries[0], thumb: entries[0].thumb, slotKey: a.key, slotNode: a.node, layoutRatio: 4/3, layoutRatioSource: 'intrinsic' },
    { key: 'reserved:slot:dead', entry: null, thumb: '', slotKey: dead.key, slotNode: dead.node, layoutRatio: 4/3, layoutRatioSource: 'fallback' },
    { key: 'c', entry: entries[1], thumb: entries[1].thumb, slotKey: c.key, slotNode: c.node, layoutRatio: 4/3, layoutRatioSource: 'intrinsic' }
  ];
  const vmc = overviewProjectionHarness({ entries, collection: { slots: [a, dead, c] }, overviewItems });
  vmc.replaceState({ entries, collection: { slots: [a, dead, c] }, overviewItems });
  const result = plain(vmc.project(false));
  assert.deepEqual(result.map(item => item.key), ['a','c']);
  assert.equal(result.some(item => item.slotKey === dead.key), false);
});
test('overview projection bounds an unresolved tail to 24 non-selectable reservations', () => {
  const first = projectionSlot('slot:first', { pending: false }), last = projectionSlot('slot:last', { pending: false });
  const reserved = Array.from({ length: 40 }, (_, index) => ({ ...projectionSlot(`pending:${index + 1}`), stable: false }));
  const entries = [projectionEntry('first', first), projectionEntry('last', last)];
  const slots = [first, ...reserved, last];
  const overviewItems = entries.map(entry => ({ key: entry.key, entry, thumb: entry.thumb, slotKey: entry.slotKey,
    slotNode: entry.slotNode, layoutRatio: 4/3, layoutRatioSource: 'intrinsic' }));
  const vmc = overviewProjectionHarness({ entries, collection: { slots }, overviewItems });
  const result = plain(vmc.project(false));
  assert.equal(result.length, 26);
  assert.deepEqual(result.slice(1, -1).map(item => item.slotKey), reserved.slice(0, 24).map(slot => slot.key));
  assert.ok(result.slice(1, -1).every(item => item.entry === null));
});
test('stable reserved positions remain intact when a far middle image resolves first', () => {
  const slots = Array.from({ length: 102 }, (_, i) => ({ ...projectionSlot(`slot:${i}`), stable: true }));
  const entries = [0, 50, 101].map(i => { slots[i].pending = false; return projectionEntry(String(i), slots[i]); });
  const harness = overviewProjectionHarness({ entries, collection: { slots }, overviewItems: [] });
  const result = plain(harness.project(true));
  assert.equal(result.length, 102);
  assert.equal(result.findIndex(item => item.entry?.key === '50'), 50);
  assert.equal(new Set(result.map(item => item.key)).size, 102);
});

test('ARIA ordering is shared by media entries and reserved slots', () => {
  const { c, image } = context();
  const first = image('https://img.example/1.jpg'), second = image('https://img.example/2.jpg');
  const scope = { children: [] };
  for (const [position, picture] of [[3, null], [1, first], [2, second]]) {
    const card = { tagName: 'DIV', className: 'tile', parentElement: scope, attributes: [{ name: 'aria-posinset' }],
      getAttribute: name => name === 'aria-posinset' ? String(position) : null,
      closest(selector) { return selector.includes('aria-posinset') ? this : null; }, getBoundingClientRect: () => ({ width: 300, height: 200 }),
      querySelectorAll: selector => selector === 'img' && picture ? [picture] : [] };
    if (picture) picture.parentElement = card;
    scope.children.push(card);
  }
  assert.deepEqual(plain(c.ImageLens.gallery.slotsFor(scope, first, false).map(slot => slot.node.getAttribute('aria-posinset'))), ['1', '2', '3']);
});
test('confirmed thumbnail geometry survives a lazy refresh only for the same resource', () => {
  const { c, image } = context(), g = c.ImageLens.gallery;
  const first = image('https://media.example.test/one.jpg', { width: '400', height: '800' });
  const entry = g.collect(first.src).entries[0];
  assert.equal(entry.aspectRatio, .5);
  Object.assign(entry, { dimensions: [900, 1200], aspectRatio: .75, slotKey: 'stable:1', slotStable: true });
  const next = g.collect(first.src).entries[0];
  assert.equal(g.mergeEntries([entry], [next])[0].aspectRatio, .75);
  const different = { ...next, thumb: 'https://media.example.test/two.jpg', aspectRatio: 1.5, slotKey: 'stable:1', slotStable: true };
  const result = g.mergeEntries([entry], [different])[0];
  assert.equal(result.aspectRatio, 1.5);
  assert.equal(result.dimensions, null);
});

test('repeated reserved image slots exclude unrelated recommendation cards', () => {
  const { c, image } = context(), pictures = [1, 2].map(n => image(`https://media.example.test/${n}.jpg`));
  const scope = { children: [] }, attributes = id => [{ name: 'data-id', value: String(id) }];
  for (let n = 0; n < 18; n++) {
    const picture = pictures[n];
    const node = { tagName: 'DIV', className: 'image-slot centered', parentElement: scope, attributes: attributes(n), children: picture ? [picture] : [],
      getAttribute: name => name === 'data-id' ? String(n) : null, closest: () => null,
      getBoundingClientRect: () => ({ width: 1000, height: 1600 }), querySelectorAll: selector => selector === 'img' && picture ? [picture] : [] };
    if (picture) picture.parentElement = node;
    scope.children.push(node);
  }
  scope.children.push({ tagName: 'DIV', className: 'recommendations', getBoundingClientRect: () => ({ width: 1000, height: 1600 }), closest: () => null });
  const slots = c.ImageLens.gallery.slotsFor(scope, pictures[0]);
  assert.equal(slots.length, 18); assert.equal(slots.filter(s => s.pending).length, 16);
  assert.ok(slots.every(s => s.stable)); assert.equal(new Set(slots.map(s => s.key)).size, 18);
});

test('connected virtual nodes are revalidated before exit navigation', () => {
  const { c, image } = context(), g = c.ImageLens.gallery;
  const node = image('https://media.example.test/first.jpg'); node.isConnected = true;
  const entry = { key: node.src, aliases: [node.src], node };
  assert.equal(g.connectedEntryNode(entry, null), node);
  node.src = node.currentSrc = 'https://media.example.test/second.jpg';
  node.getAttribute = name => name === 'src' ? node.src : null;
  assert.equal(g.connectedEntryNode(entry, null), null);
});
test('overview boundary retry needs 72 pixels within 500ms and only once per gesture', () => {
  const { c } = context(), retry = c.ImageLens.controls.overviewRetryIntent;
  const intent = { side: 0, lastAt: -Infinity };
  assert.equal(retry(intent, 1, 1000, 0), false);
  assert.equal(retry(intent, 1, 1000, 120), false);
  assert.equal(retry(intent, 1, 1000, 240), true);
  for (let t = 300; t < 1800; t += 120) assert.equal(retry(intent, 1, 1000, t), false);
  assert.equal(retry(intent, 1, 24, 2500), false);
  assert.equal(retry(intent, 1, 24, 2900), false);
  assert.equal(retry(intent, 1, 24, 3300), false, 'events more than 500ms apart cannot accumulate');
  assert.equal(retry(intent, 1, 24, 3350), true);
  assert.equal(retry(intent, -1, 24, 3400), false, 'reversing resets the gesture');
  assert.equal(retry(intent, -1, 24, 3450), false);
  assert.equal(retry(intent, -1, 24, 3500), true);
  assert.equal(retry(intent, -1, 0, 3600), false);
});

test('compact ruler keeps clickable quarter ticks and expands only its upper endpoint', () => {
  const { c } = context(); const controls = c.ImageLens.controls;
  assert.deepEqual(plain(controls.ticks), [0,25,50,75,100]);
  for (const maximum of [100,150,200,300,500]) {
    [0,25,50,75,maximum].forEach((percent, index) => {
      assert.equal(controls.fromPosition(index, maximum), percent); assert.equal(controls.toPosition(percent, maximum), index);
    });
    for (const percent of [1,26,66.7,99,130,250,499].filter(n => n <= maximum)) {
      assert.ok(Math.abs(controls.fromPosition(controls.toPosition(percent, maximum), maximum) - percent) < .00001);
    }
    assert.equal(controls.rulerMax(maximum), maximum);
  }
  for (const [value, maximum] of [[0,100],[99,100],[101,150],[151,200],[201,300],[301,500],[501,500]]) assert.equal(controls.rulerMax(value), maximum);
});

test('temporary zoom follows the pre-zoom image coordinates without an edge clamp', () => {
  const { c } = context(); const pan = c.ImageLens.controls.holdPan;
  // At 200%, moving 120 screen pixels scans 120 pixels of the pre-zoom view,
  // or 240 pixels of the magnified view, instead of the old 120-pixel pan.
  assert.equal(pan(0, 0, 120, 2), -240);
  assert.equal(pan(0, 0, 120, 3), -360);
  assert.equal(pan(20, 100, 0, 2), -60);
  assert.equal(pan(0, 0, 2000, 2), -4000);
});
test('plain wheel navigates, Alt zooms, Shift performs fine zoom', () => {
  const { c } = context(); const mode = c.ImageLens.controls.wheelMode;
  assert.equal(mode({}), 'navigate'); assert.equal(mode({altKey:true}), 'zoom');
  assert.equal(mode({shiftKey:true}), 'fine'); assert.equal(mode({shiftKey:true,altKey:true}), 'fine');
});
test('image proxies expose nested sources independently of the website domain', () => {
  for (const hostname of ['example.com', 'gallery.example.org']) {
    const { c, image } = context(hostname);
    const original = 'https://media.example.net/album/photo.webp';
    const small = `https://${hostname}/resize/fit=contain,format=webp,width=384/${original}`;
    const large = small.replace('384', '1920');
    const i = image(small, { srcset: `${small} 384w, ${large} 1920w` });
    assert.deepEqual(plain(c.ImageLens.gallery.sources(i)), [original, large, small]);
    assert.equal(c.ImageLens.gallery.key(small), c.ImageLens.gallery.key(large));
    image(large);
    assert.equal(c.ImageLens.gallery.collect(small).entries.length, 1);
  }
});

test('URL-parameter proxies retain supplied filenames instead of inventing originals', () => {
  const { c, image } = context();
  const original = 'https://media.example.net/album/photo-small.webp';
  const i = image(`https://proxy.example.org/resize?url=${encodeURIComponent(original)}&w=320`);
  assert.equal(c.ImageLens.gallery.sources(i)[0], original);
  assert.equal(c.ImageLens.gallery.sources(i).at(-1), i.src);
  assert.doesNotMatch(c.ImageLens.gallery.sources(i).join(' '), /photo\.png/);
});

test('generic detail links unwrap supplied image query parameters', () => {
  const { c, image } = context();
  const original = 'https://media.example.net/photos/landscape.jpg?token=abc';
  const thumb = image('https://thumbs.example.net/landscape-320.jpg');
  thumb.closest = selector => selector === 'a[href]' ? { href: `https://gallery.example.org/view?id=42&mediaurl=${encodeURIComponent(original)}` } : null;
  assert.equal(c.ImageLens.gallery.sources(thumb)[0], original);
  assert.equal(c.ImageLens.gallery.collect(original).entries.length, 1);
  const underscoreAlias = 'https://media.example.net/photos/another.webp';
  thumb.closest = selector => selector === 'a[href]' ? { href: `https://gallery.example.org/view?original_url=${encodeURIComponent(underscoreAlias)}` } : null;
  assert.equal(c.ImageLens.gallery.sources(thumb)[0], underscoreAlias);
});

test('srcset and explicit original links, lazy images and safe protocols', () => {
  const { c, image } = context(); const g = c.ImageLens.gallery;
  const i = image('https://images.example.com/small.jpg', { srcset: 'https://images.example.com/medium.jpg 800w, https://images.example.com/full.jpg 2400w' });
  assert.equal(g.sources(i)[0], 'https://images.example.com/full.jpg');
  assert.equal(g.url('javascript:alert(1)'), ''); assert.equal(g.url('data:text/html,hello'), '');
  const lazy = image('', { 'data-src': '/lazy.jpg' }); assert.equal(g.sources(lazy)[0], 'https://example.com/lazy.jpg');
  const signed = 'https://cdn.example.com/file.jpg?w=300&token=private&expires=123'; assert.equal(g.key(signed), signed);
});
test('lazy data-srcset and image CSS backgrounds use only page-supplied image URLs', () => {
  const { c, image } = context(); const g = c.ImageLens.gallery;
  const lazy = image('data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=', {
    'data-srcset': '/thumb.webp 320w, /full.webp 1800w'
  });
  assert.equal(g.sources(lazy)[0], 'https://example.com/full.webp');
  const background = { tagName: 'DIV', style: { backgroundImage: 'url("/background.webp")' },
    getAttribute: () => null, hasAttribute: () => false, querySelector: () => null, querySelectorAll: () => [],
    closest: () => null, getBoundingClientRect: () => ({ width: 240, height: 160 }) };
  assert.deepEqual(plain(g.sources(background)), ['https://example.com/background.webp']);
  const dataBackground = { ...background, style: {}, getAttribute: name => name === 'data-bg' ? 'url(/lazy-background.webp)' : null };
  assert.deepEqual(plain(g.sources(dataBackground)), ['https://example.com/lazy-background.webp']);
});
test('generic gallery filters navigation, tiny icons and duplicate variants', () => {
  const { c, image } = context();
  const a = image('https://cdn.example.com/1.jpg?w=400');
  const duplicate = image('https://cdn.example.com/1.jpg?w=1200');
  a.getAttribute = name => name === 'srcset' ? `${a.src} 400w, ${duplicate.src} 1200w` : null;
  const second = image('https://cdn.example.com/2.jpg');
  const icon = image('https://cdn.example.com/icon.jpg'); icon.alt = 'avatar';
  const tiny = image('https://cdn.example.com/tiny.jpg'); tiny.getBoundingClientRect = () => ({ width: 16, height: 16 });
  albumFixture(c, [a, duplicate, second, icon, tiny]);
  const result = c.ImageLens.gallery.collect(a.src);
  assert.equal(result.entries.length, 2); assert.equal(result.index, 0);
});
test('transparent one-pixel lazy placeholders do not become gallery entries', () => {
  const { c, image } = context();
  const placeholder = image('data:image/gif;base64,R0lGODlhAQABAIAAAAUEBA==');
  Object.assign(placeholder, { complete: true, naturalWidth: 1, naturalHeight: 1 });
  const first = image('https://media.example.net/first.jpg');
  const second = image('https://media.example.net/second.jpg');
  albumFixture(c, [placeholder, first, second]);
  const result = c.ImageLens.gallery.collect(first.src);
  assert.deepEqual(plain(result.entries.map(e => e.key)), [first.src, second.src]);
  const deferred = image(placeholder.src, { 'data-src': 'https://media.example.net/deferred.jpg' });
  Object.assign(deferred, { complete: true, naturalWidth: 1, naturalHeight: 1 });
  assert.deepEqual(plain(c.ImageLens.gallery.sources(deferred)), ['https://media.example.net/deferred.jpg']);
  albumFixture(c, [deferred, first, second]);
  const entry = c.ImageLens.gallery.collect('https://media.example.net/deferred.jpg').entries[0];
  assert.equal(entry.thumb, 'https://media.example.net/deferred.jpg');
  assert.equal(entry.dimensions, null);
});
function albumFixture(c, pictures, { semantic = true, hidden = false, positions = false } = {}) {
  const grid = { children: [], parentElement: null, querySelectorAll: selector => selector === 'img' ? pictures : [] };
  pictures.forEach((img, index) => {
    const card = { getBoundingClientRect: () => ({ width: 320, height: 240 }), tagName: 'FIGURE', parentElement: grid, children: [img], querySelectorAll: selector => selector === 'img' ? [img] : [],
      getAttribute: name => positions && name === 'aria-posinset' ? String([3,1,2][index]) : null };
    grid.children.push(card); img.parentElement = card;
    img.closest = selector => selector.includes('[data-gallery]') ? (semantic ? grid : null) : selector.includes('[aria-posinset]') ? (positions ? card : null) : selector === '[aria-hidden="true"]' && hidden ? grid : null;
  });
  return grid;
}

test('semantic gallery scope excludes unrelated images and keeps supplied DOM order', () => {
  const { c, image } = context();
  const pictures = [1,2,3].map(n => image(`https://media.example.net/${n}.jpg`));
  albumFixture(c, pictures);
  image('https://media.example.net/unrelated.jpg');
  const result = c.ImageLens.gallery.collect(pictures[1].src);
  assert.equal(result.entries.length, 3); assert.equal(result.index, 1);
  assert.deepEqual(plain(result.entries.map(e => e.key)), pictures.map(i => i.src));
});
test('repeated image cards work without semantic classes or custom data attributes', () => {
  const { c, image } = context();
  const pictures = [1,2].map(n => image(`https://media.example.net/${n}.jpg`));
  albumFixture(c, pictures, { semantic: false });
  image('https://media.example.net/unrelated.jpg');
  assert.equal(c.ImageLens.gallery.collect(pictures[0].src).entries.length, 2);
});
test('repeated media cards can use mixed child element tags', () => {
  const { c, image } = context();
  const pictures = [1,2,3].map(n => image(`https://media.example.net/${n}.jpg`));
  const list = { children: [], parentElement: null, querySelectorAll: selector => selector === 'img' ? pictures : [] };
  pictures.forEach((img, index) => {
    const card = { getBoundingClientRect: () => ({ width: 320, height: 240 }), tagName: ['ARTICLE', 'LI', 'SECTION'][index], parentElement: list, children: [img],
      querySelectorAll: selector => selector === 'img' ? [img] : [], getAttribute: () => null };
    list.children.push(card); img.parentElement = card;
    img.closest = () => null;
  });
  const result = c.ImageLens.gallery.collect(pictures[1].src, pictures[1]);
  assert.equal(result.entries.length, 3); assert.equal(result.index, 1);
});
test('ARIA feed of layered article cards yields one primary image and slot per card', () => {
  const { c, image, images } = context();
  const feed = { tagName: 'UL', className: 'results', role: 'feed', isConnected: true,
    children: [], parentElement: null, getAttribute: name => name === 'role' ? 'feed' : null,
    querySelectorAll: selector => selector === 'img' ? images.filter(node => feed.contains(node)) : descendants(feed),
    contains(node) { return node === this || this.children.some(child => child === node || child.contains?.(node)); } };
  function descendants(root) { return root.children.flatMap(child => [child, ...(child.children ? descendants(child) : [])]); }
  for (let index = 0; index < 20; index++) {
    const card = { tagName: 'LI', className: 'result-tile', isConnected: true, parentElement: feed, children: [],
      attributes: [{ name: 'aria-posinset' }], getAttribute: name => name === 'role' ? 'article' : name === 'aria-posinset' ? String(index + 1) : null,
      getBoundingClientRect: () => ({ left: 0, top: index * 250, width: 320, height: 240 }),
      closest: selector => selector.includes('[role="feed"]') ? feed : null,
      contains(node) { return node === this || this.children.some(child => child === node || child.contains?.(node)); },
      querySelector: selector => selector.includes('img') ? stack.children[0] : null,
      querySelectorAll: selector => selector === 'img' ? stack.children : descendants(card) };
    const stack = { tagName: 'DIV', className: 'media-stack', parentElement: card, children: [],
      getBoundingClientRect: card.getBoundingClientRect, closest: selector => selector.includes('[role="feed"]') ? feed : null,
      querySelector: () => stack.children[0], querySelectorAll: selector => selector === 'img' ? stack.children : descendants(stack),
      contains(node) { return node === this || this.children.includes(node); } };
    const preview = image(`https://images.example.test/${index + 1}-preview.jpg`);
    const primary = image(`https://images.example.test/${index + 1}-large.jpg`);
    for (const [layer, width, height] of [[preview, 640, 480], [primary, 2400, 1800]]) {
      layer.className = 'image-layer'; layer.parentElement = stack; layer.naturalWidth = width; layer.naturalHeight = height;
      layer.getAttribute = name => name === 'src' ? layer.src : null;
      layer.getBoundingClientRect = card.getBoundingClientRect;
      layer.closest = selector => selector.includes('[role="feed"]') ? feed : selector.includes('[role="dialog"]') ? null
        : selector === 'header, nav, footer, [role="navigation"]' || selector === '[aria-hidden="true"]' || selector === 'a[href]' || selector === 'picture'
          ? null : selector === '[aria-posinset], [aria-rowindex]' ? card : null;
    }
    stack.children.push(preview, primary); card.children.push(stack); feed.children.push(card);
  }
  const selected = images[18];
  const result = c.ImageLens.gallery.collect(selected.src, selected);
  assert.equal(result.scope, feed);
  assert.equal(result.slots.length, 20);
  assert.equal(result.entries.length, 20);
  assert.equal(new Set(result.entries.map(entry => entry.slotKey)).size, 20);
  assert.deepEqual(plain(result.entries.map(entry => entry.title)), Array(20).fill(''));
  assert.equal(result.entries[9].node, selected, 'the explicitly selected preview remains the seed entry');
  assert.equal(result.entries[8].node, images[17], 'an unselected layered card chooses its higher-resolution primary');
});
test('feed projection excludes interleaved extra-class caption panels from image slots', () => {
  const { c, image, images } = context();
  const feed = { tagName: 'UL', className: 'results', children: [], isConnected: true,
    getAttribute: name => name === 'role' ? 'feed' : null,
    contains(node) { return node === this || this.children.some(child => child === node || child.contains?.(node)); },
    querySelectorAll(selector) {
      const all = this.children.flatMap(child => [child, ...(child.children || [])]);
      return selector === 'img' ? all.filter(node => node.tagName === 'IMG') : all;
    } };
  const imageCards = [];
  for (let index = 0; index < 18; index++) {
    const card = { tagName: 'DIV', className: 'flexbox_item', role: 'article', parentElement: feed,
      children: [], attributes: [{ name: 'data-item-id' }], getAttribute: name => name === 'role' ? 'article' : name === 'data-item-id' ? `item-${index}` : null,
      getBoundingClientRect: () => ({ left: 0, top: index * 252, width: 320, height: 240 }),
      closest: selector => selector.includes('[role="feed"]') ? feed : null,
      contains(node) { return node === this || this.children.includes(node); },
      querySelector: selector => selector.includes('img') ? card.children[0] : null,
      querySelectorAll: selector => selector === 'img' ? card.children : card.children };
    const photo = image(`https://media.example.test/item-${index}.jpg`);
    photo.parentElement = card;
    photo.getBoundingClientRect = card.getBoundingClientRect;
    photo.closest = selector => selector.includes('[role="feed"]') ? feed
      : selector === '[aria-posinset], [aria-rowindex]' ? null : null;
    card.children.push(photo);
    const caption = { tagName: 'DIV', className: 'flexbox_item bottom_panel', parentElement: feed,
      children: [], getAttribute: () => null, getBoundingClientRect: card.getBoundingClientRect,
      closest: selector => selector.includes('[role="feed"]') ? feed : null,
      querySelector: () => null, querySelectorAll: () => [] };
    imageCards.push(card); feed.children.push(card, caption);
  }
  const selected = images[8];
  const result = c.ImageLens.gallery.collect(selected.src, selected);
  assert.equal(result.scope, feed);
  assert.equal(result.slots.length, 18);
  assert.equal(result.entries.length, 18);
  assert.deepEqual(plain(result.slots.map(slot => slot.node.getAttribute('data-item-id'))), imageCards.map((_, index) => `item-${index}`));
  assert.equal(result.slots.some(slot => slot.node.className.includes('bottom_panel')), false);
});
test('responsive duplicate hidden image layers keep the repeated list as the gallery scope', () => {
  const { c, image, images } = context();
  const body = { tagName: 'BODY', children: [], parentElement: null };
  const list = { tagName: 'UL', className: 'result-list', children: [], parentElement: body,
    querySelectorAll(selector) { return descendants(this, selector); },
    contains(node) { return node === this || this.children.some(child => child === node || child.contains?.(node)); } };
  function descendants(root, selector) {
    const all = [];
    const visit = node => { for (const child of node.children || []) { all.push(child); visit(child); } };
    visit(root);
    return selector === 'img' ? all.filter(node => node.tagName === 'IMG') : all;
  }
  body.children.push(list);
  body.querySelectorAll = selector => descendants(body, selector);
  const cards = [];
  for (let index = 0; index < 10; index++) {
    const card = { tagName: 'LI', className: 'result-card', children: [], parentElement: list,
      getAttribute: () => null,
      getBoundingClientRect: () => ({ left: 0, top: index * 250, width: 320, height: 240 }),
      contains(node) { return node === this || this.children.some(child => child === node || child.contains?.(node)); },
      querySelector: selector => selector.includes('img') ? card.children[0]?.children[0] || null : null,
      querySelectorAll: selector => descendants(card, selector) };
    const anchor = { tagName: 'A', className: '', children: [], parentElement: card,
      getAttribute: () => null,
      getBoundingClientRect: card.getBoundingClientRect,
      closest: selector => selector === 'a[href]' ? anchor : selector === '[data-gallery], [role="list"], [role="grid"], [role="feed"], [aria-roledescription*="gallery" i], .gallery, .masonry, .photos, .photo-list, .image-grid' ? null : null,
      contains(node) { return node === this || this.children.includes(node); },
      querySelector: selector => selector.includes('img') ? anchor.children.find(node => node.tagName === 'IMG' && node.getBoundingClientRect().height >= 72) || null : null,
      querySelectorAll: selector => selector === 'img' ? anchor.children.filter(node => node.tagName === 'IMG') : anchor.children };
    const desktop = image(`https://media.example.test/responsive-${index}.jpg`);
    const mobile = image(`https://media.example.test/responsive-${index}-mobile.jpg`);
    desktop.parentElement = anchor; mobile.parentElement = anchor;
    desktop.querySelectorAll = () => []; mobile.querySelectorAll = () => [];
    desktop.getBoundingClientRect = () => ({ left: 0, top: index * 250, width: 320, height: 240 });
    mobile.getBoundingClientRect = () => ({ left: 0, top: index * 250, width: 0, height: 0 });
    for (const node of [desktop, mobile]) node.closest = selector => selector === 'a[href]' ? anchor
      : selector === '[data-gallery], [role="list"], [role="grid"], [role="feed"], [aria-roledescription*="gallery" i], .gallery, .masonry, .photos, .photo-list, .image-grid' ? null
      : selector === '[aria-posinset], [aria-rowindex]' ? null : null;
    anchor.children.push(desktop, mobile); card.children.push(anchor); list.children.push(card); cards.push(card);
  }
  const outside = { tagName: 'SECTION', className: 'recommended', parentElement: body, children: [], querySelectorAll: selector => selector === 'img' ? [outsideImage] : [outsideImage] };
  const outsideImage = image('https://media.example.test/unrelated.jpg');
  outsideImage.parentElement = outside; outsideImage.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 300 });
  outsideImage.querySelectorAll = () => [];
  outsideImage.closest = () => null; outside.children.push(outsideImage); body.children.push(outside);
  c.document.body = body;
  const selected = images[10];
  const result = c.ImageLens.gallery.collect(selected.src, selected);
  assert.equal(result.scope, list, 'scope resolution must skip the narrow anchor with a hidden responsive layer');
  assert.equal(result.slots.length, 10);
  assert.equal(result.entries.length, 10);
  assert.deepEqual(plain(result.entries.map(entry => entry.node.src)), cards.map((_, index) => `https://media.example.test/responsive-${index}.jpg`));
  assert.equal(result.entries.some(entry => entry.node === outsideImage), false);
});
test('visually grouped image results can expose originals through detail-link parameters', () => {
  const { c, image } = context();
  const originals = [1,2,3].map(n => `https://media.example.net/${n}.jpg`);
  const pictures = originals.map((original, index) => image(`https://thumb.example.net/${index + 1}-320.jpg`));
  const list = { children: [], parentElement: null, querySelectorAll: selector => selector === 'img' ? pictures : [] };
  pictures.forEach((img, index) => {
    const link = { href: `https://gallery.example.org/detail?id=${index}&mediaurl=${encodeURIComponent(originals[index])}` };
    const card = { getBoundingClientRect: () => ({ width: 320, height: 240 }), tagName: ['ARTICLE', 'LI', 'SECTION'][index], parentElement: list, children: [link],
      querySelector: selector => selector === 'a[href]' ? link : selector.includes('img') ? img : null,
      querySelectorAll: selector => selector === 'img' ? [img] : [], getAttribute: () => null };
    link.parentElement = card; list.children.push(card); img.parentElement = card;
    img.closest = selector => selector === 'a[href]' ? link : null;
  });
  const result = c.ImageLens.gallery.collect(pictures[1].src, pictures[1]);
  assert.equal(result.entries.length, 3); assert.equal(result.index, 1);
  assert.deepEqual(plain(result.entries.map(entry => entry.key)), originals);
});
test('nested repeated image rows form one bounded gallery group', () => {
  const { c, image } = context();
  const pictures = [1,2,3,4].map(n => image(`https://media.example.net/row-${n}.jpg`));
  const grid = { children: [], parentElement: null, querySelectorAll: selector => selector === 'img' ? pictures : [] };
  for (let rowIndex = 0; rowIndex < 2; rowIndex++) {
    const row = { tagName: 'UL', parentElement: grid, children: [],
      querySelector: selector => selector.includes('img') ? pictures[rowIndex * 2] : null,
      querySelectorAll: selector => selector === 'img' ? pictures.slice(rowIndex * 2, rowIndex * 2 + 2) : [] };
    for (const img of pictures.slice(rowIndex * 2, rowIndex * 2 + 2)) {
      const card = { tagName: 'LI', parentElement: row, children: [img], getAttribute: () => null,
        querySelector: selector => selector.includes('img') ? img : null,
        querySelectorAll: selector => selector === 'img' ? [img] : [] };
      img.parentElement = card; img.closest = () => null; row.children.push(card);
    }
    grid.children.push(row);
  }
  const result = c.ImageLens.gallery.collect(pictures[2].src, pictures[2]);
  assert.equal(result.entries.length, 4); assert.equal(result.index, 2);
});
test('a connected gallery seed avoids an unrelated whole-document discovery scan', () => {
  const { c, image } = context();
  const pictures = [1,2,3].map(n => image(`https://media.example.net/seed-${n}.jpg`));
  albumFixture(c, pictures);
  let calls = 0; const query = c.document.querySelectorAll;
  c.document.querySelectorAll = selector => { calls++; return query(selector); };
  const result = c.ImageLens.gallery.collect(pictures[1].src, pictures[1]);
  assert.equal(result.entries.length, 3);
  assert.equal(calls, 0, 'a verified connected non-modal seed does not need document-wide lookup');
});
test('lazy nested rows retain empty peer cards and widen an initially narrow scope', () => {
  const { c, image } = context(), pictures = [];
  const contains = function(node) { for (let n = node; n; n = n.parentElement) if (n === this) return true; return false; };
  const branch = (tagName, className, width, height) => ({
    tagName, className, isConnected: true, children: [], parentElement: null, attributes: [], contains,
    getAttribute: () => null, closest: () => null,
    getBoundingClientRect: () => ({ width, height }),
    querySelectorAll(selector) { return selector === 'img' ? pictures.filter(p => this.contains(p)) : selector === 'a[href]' ? this.links || [] : []; },
    querySelector(selector) { return selector.includes('img') ? pictures.find(p => this.contains(p)) || null : null; }
  });
  const grid = branch('DIV', 'row-collection', 1000, 1400);
  for (let r = 0; r < 6; r++) {
    const row = branch('DIV', 'repeated-row', 1000, 200); row.parentElement = grid; grid.children.push(row);
    for (let n = 0; n < 3; n++) {
      const card = branch('ARTICLE', 'image-card', 300, 200); card.parentElement = row; row.children.push(card);
      if (r < 2) { const img = image(`https://media.example.net/lazy-row-${r}-${n}.jpg`); img.parentElement = card; card.children.push(img); pictures.push(img); }
    }
  }
  const recommendations = branch('ARTICLE', 'image-card', 300, 200);
  recommendations.parentElement = grid.children[1]; recommendations.links = [{}, {}, {}];
  recommendations.parentElement.children.splice(1, 0, recommendations);
  for (let n = 0; n < 3; n++) {
    const icon = image(`https://media.example.net/recommendation-${n}.jpg`);
    icon.parentElement = recommendations; icon.getBoundingClientRect = () => ({ width: 80, height: 60 });
    pictures.push(icon);
  }
  const narrow = grid.children[0];
  const result = c.ImageLens.gallery.collect(pictures[0].src, pictures[0], narrow);
  assert.equal(result.scope, grid);
  assert.equal(result.entries.length, 6);
  assert.equal(result.slots.length, 18);
  assert.equal(result.slots.filter(slot => slot.pending).length, 12);
  assert.ok(!result.slots.some(slot => slot.node === recommendations));
  assert.equal(result.slots[17].node, grid.children[5].children[2]);
});

test('large repeated-row galleries keep their parent scope past the former image-count cutoff', () => {
  const { c, image, images } = context();
  const contains = function(node) { for (let n = node; n; n = n.parentElement) if (n === this) return true; return false; };
  const descendants = root => root.children.flatMap(child => [child, ...(child.children ? descendants(child) : [])]);
  const branch = (tagName, className, width, height) => ({
    tagName, className, isConnected: true, children: [], parentElement: null, attributes: [], contains,
    getAttribute: () => null, closest: () => null, getBoundingClientRect: () => ({ width, height }),
    querySelectorAll(selector) {
      const all = descendants(this);
      return selector === 'img' ? all.filter(node => node.tagName === 'IMG') : selector === 'a[href]' ? [] : all;
    },
    querySelector(selector) { return selector.includes('img') ? this.querySelectorAll('img')[0] || null : null; }
  });
  const body = branch('BODY', '', 1200, 7000), grid = branch('DIV', 'result-grid', 1200, 7000);
  body.children.push(grid); grid.parentElement = body;
  for (let rowIndex = 0; rowIndex < 35; rowIndex++) {
    const row = branch('DIV', 'gallery-row', 1200, 220); row.parentElement = grid; grid.children.push(row);
    for (let column = 0; column < 7; column++) {
      const tile = branch('ARTICLE', 'photo-tile', 160, 180); tile.parentElement = row; row.children.push(tile);
      const photo = image(`https://images.example.test/large-grid-${rowIndex}-${column}.jpg`);
      photo.parentElement = tile; photo.getBoundingClientRect = () => ({ left: column * 170, top: rowIndex * 220, width: 160, height: 180 });
      tile.children.push(photo);
    }
  }
  const recommendations = branch('SECTION', 'recommendations', 1200, 300), recommendationRow = branch('DIV', 'recommendation-row', 1200, 180);
  recommendations.parentElement = body; body.children.push(recommendations);
  recommendationRow.parentElement = recommendations; recommendations.children.push(recommendationRow);
  for (let index = 0; index < 7; index++) {
    const tile = branch('ARTICLE', 'recommendation-tile', 160, 180); tile.parentElement = recommendationRow; recommendationRow.children.push(tile);
    const photo = image(`https://images.example.test/recommendation-${index}.jpg`);
    photo.parentElement = tile; photo.getBoundingClientRect = () => ({ left: index * 170, top: 7100, width: 160, height: 180 });
    tile.children.push(photo);
  }
  body.querySelectorAll = grid.querySelectorAll.bind(body);
  c.document.body = body;
  const selected = images[17 * 7 + 3];
  const result = c.ImageLens.gallery.collect(selected.src, selected);
  assert.equal(result.scope, grid, 'gallery size must not make the resolver fall back to one row');
  assert.equal(result.entries.length, 245);
  assert.equal(result.slots.length, 245);
  assert.equal(result.entries.some(entry => entry.key.includes('recommendation-')), false, 'the matched row grid must exclude its unrelated sibling recommendations');
  assert.equal(result.index, 17 * 7 + 3);
  const row = grid.children[0], tile = branch('ARTICLE', 'photo-tile', 160, 180);
  const added = image('https://images.example.test/later.jpg');
  tile.parentElement = row; row.children.push(tile); added.parentElement = tile; tile.children.push(added);
  const refreshed = c.ImageLens.gallery.collect(selected.src, selected, grid);
  assert.equal(refreshed.entries.length, 246, 'the next collection must see newly loaded media');
  assert.ok(refreshed.entries.some(entry => entry.key.endsWith('/later.jpg')));
});

test('same-level image cards can mix IMG elements and CSS background photos', () => {
  const { c, image } = context();
  const first = image('https://media.example.net/first.jpg');
  const background = { tagName: 'DIV', style: { backgroundImage: 'url(https://media.example.net/second.jpg)' },
    getAttribute: () => null, hasAttribute: () => false, querySelector: () => null, querySelectorAll: () => [],
    closest: () => null, getBoundingClientRect: () => ({ width: 200, height: 140 }) };
  const third = image('https://media.example.net/third.jpg');
  albumFixture(c, [first, background, third]);
  const result = c.ImageLens.gallery.collect(first.src);
  assert.equal(result.entries.length, 3);
  assert.equal(result.entries[1].key, 'https://media.example.net/second.jpg');
});

test('a modal original reconnects to its explicitly linked background gallery', () => {
  const { c, image } = context();
  const pictures = [1,2,3].map(n => image(`https://media.example.net/thumb-${n}.webp`, { 'data-full': `https://media.example.net/original-${n}.jpg` }));
  albumFixture(c, pictures, { hidden: true, positions: true });
  const original = image('https://media.example.net/original-3.jpg');
  const reference = image('https://media.example.net/reference.jpg');
  const modal = { querySelectorAll: selector => selector === 'img' ? [original, reference] : [] };
  original.closest = selector => selector.includes('[role="dialog"]') ? modal : null;
  reference.closest = original.closest;
  const result = c.ImageLens.gallery.collect(original.src, original);
  assert.equal(result.entries.length, 3); assert.equal(result.index, 1);
  assert.deepEqual(plain(result.entries.map(e => e.key)), [2,3,1].map(n => `https://media.example.net/original-${n}.jpg`));
});

test('hidden albums without a matched image relationship do not leak into a dialog', () => {
  const { c, image } = context();
  const pictures = [1,2].map(n => image(`https://media.example.net/${n}.jpg`));
  albumFixture(c, pictures, { hidden: true });
  const original = image('https://media.example.net/other.jpg');
  original.closest = selector => selector.includes('[role="dialog"]') ? {} : null;
  const result = c.ImageLens.gallery.collect(original.src, original);
  assert.equal(result.entries.length, 1);
});

test('gallery discovery uses structural data rather than host dispatch or proprietary selectors', () => {
  const gallery = source('gallery.js');
  assert.doesNotMatch(gallery, /location\.(?:hostname|host)|\.hostname\s*(?:===|\.endsWith)|https?:\/\/[a-z]/i);
  const attributes = new Set(gallery.match(/data-[a-z-]+/g));
  const allowed = new Set(['data-original','data-original-src','data-full','data-full-src','data-large-file','data-src','data-lazy-src','data-image','data-image-src','data-url','data-srcset','data-lazy-srcset','data-original-srcset','data-bg','data-background','data-background-image','data-gallery']);
  for (const attribute of attributes) assert.ok(allowed.has(attribute), attribute);
});

test('product descriptions omit development endpoints and retain independent product positioning', () => {
  for (const file of ['README.md','PRIVACY.md','docs/STORE-LISTING.md', ...locales.map(locale => `release/listing/${locale}-description.txt`)]) assert.doesNotMatch(source(file), /127\.0\.0\.1|localhost|18766|node tests\//i, file);
  for (const file of ['README.md','docs/STORE-LISTING.md']) {
    assert.match(source(file), /Photoshop/); assert.match(source(file), /ACDSee/);
    assert.match(source(file), /not affiliated|not.*affiliated/);
  }
});


function background(existingStore = {}, settings = { zoomStep: 25 }) {
  const store = existingStore;
  const calls = [];
  function event() { return { callbacks: [], addListener(fn) { this.callbacks.push(fn); } }; }
  const storage = {
    async get(key) { if (key === null) return { ...store }; return { [key]: store[key] }; },
    async set(data) { Object.assign(store, data); },
    async remove(key) { delete store[key]; }
  };
  const chrome = {
    i18n: i18nFixture.forLocale('en'),
    runtime: { onInstalled: event(), onMessage: event(), getURL: p => `chrome-extension://unit/${p}` },
    contextMenus: { onClicked: event(), removeAll: fn => fn(), create: item => calls.push(['menu', item]), update: () => {} },
    storage: { local: { get: async () => ({ settings }) }, onChanged: event(), session: storage },
    scripting: { async executeScript(options) { calls.push(['inject', options]); } },
    tabs: { async create(options) { calls.push(['tab', options]); } }
  };
  const c = vm.createContext({ setTimeout, clearTimeout, chrome, console, URL, crypto: { randomUUID: () => 'unit-token' } });
  vm.runInContext(source('background.js'), c);
  const message = (request, sender) => new Promise(resolve => {
    if (chrome.runtime.onMessage.callbacks[0](request, sender, resolve) !== true) resolve();
  });
  return { c, chrome, calls, store, message };
}
test('MV3 quick entry runs on HTTP/HTTPS pages and frames, with no file host access', () => {
  const manifest = JSON.parse(source('manifest.json'));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.host_permissions, ['http://*/*', 'https://*/*']);
  assert.deepEqual(manifest.content_scripts, [{ matches: ['http://*/*', 'https://*/*'], js: ['quick-open.js'], run_at: 'document_start', all_frames: true }]);
  for (const file of [manifest.background.service_worker, manifest.action.default_popup, ...Object.values(manifest.icons)]) assert.ok(fs.existsSync(path.join(root, file)), file);
});
test('brand icons are available at declared sizes and the viewer exposes only its static mark', () => {
  const manifest = JSON.parse(source('manifest.json'));
  for (const size of [16, 32, 48, 128]) {
    const file = manifest.icons[size];
    const png = fs.readFileSync(path.join(root, file));
    assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  assert.equal(manifest.action.default_icon['32'], manifest.icons['32']);
  assert.deepEqual(manifest.web_accessible_resources, [{ resources: ['icons/32.png'], matches: ['http://*/*', 'https://*/*'] }]);
});
test('context menu opens the selected image in its original frame', async () => {
  const b = background(); b.chrome.runtime.onInstalled.callbacks[0]();
  assert.deepEqual(plain(b.calls[0][1].contexts), ['image']);
  await b.c.openImage({ srcUrl: 'https://cdn.example.com/image.jpg', frameId: 3 }, { id: 4 });
  const injects = b.calls.filter(c => c[0] === 'inject');
  assert.deepEqual(plain(injects[0][1].target), { tabId: 4, frameIds: [3] });
  assert.deepEqual(plain(injects[0][1].files), ['locale-catalogs.js', 'i18n.js', 'settings.js', 'controls.js', 'preferences.js', 'gallery.js', 'viewer.js', 'quick-open.js']);
  assert.deepEqual(plain(injects[1][1].args), ['https://cdn.example.com/image.jpg', { zoomStep: 25 }]);
});

test('covered image context menu resolves only in its sender frame and rejects missing targets', async () => {
  const b = background();
  b.chrome.tabs.sendMessage = async (tabId, message, options) => {
    assert.equal(tabId, 4); assert.equal(options.frameId, 7); assert.equal(message.type, 'lens-resolve-context');
    return { source: 'https://media.example.test/photo?q=identity' };
  };
  b.chrome.contextMenus.onClicked.callbacks[0]({ menuItemId: 'image-lens-open', frameId: 7 }, { id: 4 });
  await new Promise(resolve => setImmediate(resolve));
  const injected = b.calls.filter(c => c[0] === 'inject');
  assert.deepEqual(plain(injected[0][1].target), { tabId: 4, frameIds: [7] });
  assert.equal(injected[1][1].args[0], 'https://media.example.test/photo?q=identity');
  b.calls.length = 0; b.chrome.tabs.sendMessage = async () => ({ source: '' });
  b.chrome.contextMenus.onClicked.callbacks[0]({ menuItemId: 'image-lens-open', frameId: 7 }, { id: 4 });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(b.calls.length, 0);
});
test('cross-origin frame falls back to one-image tab, without changing any window', async () => {
  const b = background(); b.chrome.scripting.executeScript = async () => { throw Error('Cannot access frame'); };
  await b.c.openImage({ srcUrl: 'https://cdn.example.com/image.jpg', frameId: 6 }, { id: 4 });
  const tab = b.calls.find(c => c[0] === 'tab')[1];
  assert.ok(tab.url.endsWith('standalone.html#unit-token'));
});
test('extension has no browser-window control or native helper', () => {
  assert.doesNotMatch(source('background.js') + source('viewer.js'), /chrome\.windows|nativeMessaging|lens-fullscreen/);
});
test('quick entry worker injects the viewer into the sender frame before opening', async () => {
  const b = background();
  assert.deepEqual(plain(await b.message({ type: 'lens-quick-open', source: 'https://cdn.example.com/image.jpg', tabId: 999, frameId: 999 }, { tab: { id: 4 }, frameId: 3 })), { ok: true });
  const injects = b.calls.filter(c => c[0] === 'inject');
  assert.deepEqual(plain(injects[0][1].target), { tabId: 4, frameIds: [3] });
  assert.ok(injects[0][1].files.includes('viewer.js'));
  assert.deepEqual(plain(injects[1][1].args), ['https://cdn.example.com/image.jpg', { zoomStep: 25 }]);
});

test('quick entry worker rechecks the disabled switch and rejects invalid requests', async () => {
  const b = background({}, { quickOpen: false });
  assert.deepEqual(plain(await b.message({ type: 'lens-quick-open', source: 'https://cdn.example.com/image.jpg' }, { tab: { id: 4 } })), { ok: false });
  for (const source of [null, {}, 'javascript:alert(1)', 'data:text/html,hello', 'invalid']) {
    assert.equal(await b.message({ type: 'lens-quick-open', source }, { tab: { id: 4 } }), undefined);
  }
  assert.equal(await b.message({ type: 'other', source: 'https://example.com/pic.jpg' }, { tab: { id: 4 } }), undefined);
  assert.equal(await b.message({ type: 'lens-quick-open', source: 'https://example.com/pic.jpg' }, {}), undefined);
  assert.equal(b.calls.length, 0);
});

test('Ctrl-click works before viewer modules load, leaves other clicks alone and updates its switch', async () => {
  const handlers = new Map(); const calls = []; const listeners = new Set(); const messageListeners = new Set();
  let settings = { quickOpen: true };
  const c = vm.createContext({ setTimeout, clearTimeout,
    AbortController, URL, location: { href: 'https://example.com/album/' }, getComputedStyle: node => ({ backgroundImage: node.backgroundImage || 'none' }), document: { baseURI: 'https://example.com/album/' },
    window: { addEventListener(type, callback, { signal }) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(callback);
      signal.addEventListener('abort', () => handlers.get(type).delete(callback));
    } },
    chrome: { runtime: { onMessage: { addListener: fn => messageListeners.add(fn), removeListener: fn => messageListeners.delete(fn) }, async sendMessage(message) { calls.push(message); return { ok: true }; } }, storage: {
      local: { async get() { return { settings }; } },
      onChanged: { addListener: fn => listeners.add(fn), removeListener: fn => listeners.delete(fn) }
    } }
  });
  vm.runInContext(source('quick-open.js'), c); await Promise.resolve();
  assert.equal(c.ImageLens.open, undefined); assert.equal(c.ImageLens.gallery, undefined);
  let anchorHref = '';
  const image = { tagName: 'IMG', src: '../picture.jpg', getAttribute: () => null,
    closest: selector => selector === 'a[href]' && anchorHref ? { href: anchorHref } : null };
  const dispatch = (type = 'click', extra = {}) => {
    const event = { button: 0, ctrlKey: true, composedPath: () => [image], prevented: false, stopped: false,
      preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...extra };
    for (const handler of handlers.get(type)) handler(event);
    return event;
  };
  for (const extra of [{ ctrlKey: false }, { altKey: true }, { metaKey: true }, { button: 1 }, { composedPath: () => [{ tagName: 'DIV' }] }, { composedPath: () => [image, { id: 'image-lens-viewer' }] }]) {
    const event = dispatch('click', extra); assert.equal(event.prevented, false); assert.equal(event.stopped, false);
  }
  assert.equal(calls.length, 0);
  assert.equal(dispatch('mousedown').prevented, true);
  assert.equal(dispatch().stopped, true);
  assert.deepEqual(plain(calls[0]), { type: 'lens-quick-open', source: 'https://example.com/picture.jpg' });
  const linkedImage = 'https://media.example.net/photos/original.jpg?key=private';
  anchorHref = `https://gallery.example.org/view?id=42&imgurl=${encodeURIComponent(linkedImage)}`;
  dispatch();
  assert.deepEqual(plain(calls[1]), { type: 'lens-quick-open', source: linkedImage });
  anchorHref = `https://gallery.example.org/view?image_src=${encodeURIComponent(linkedImage)}`;
  dispatch();
  assert.deepEqual(plain(calls[2]), { type: 'lens-quick-open', source: linkedImage });
  settings = { quickOpen: false }; for (const listener of listeners) listener({ settings: { newValue: settings } }, 'local');
  assert.equal(dispatch().prevented, false); assert.equal(calls.length, 3);
  settings = { quickOpen: true }; for (const listener of listeners) listener({ settings: { newValue: settings } }, 'local');
  vm.runInContext(source('quick-open.js'), c); await Promise.resolve();
  assert.equal(listeners.size, 1); assert.equal(handlers.get('click').size, 1);
  dispatch(); assert.equal(calls.length, 4);
  image.src = 'javascript:alert(1)'; anchorHref = ''; assert.equal(dispatch().prevented, false); assert.equal(calls.length, 4);
  image.src = '../picture.jpg';
  image.getBoundingClientRect = () => ({ left: 10, top: 20, right: 210, bottom: 220, width: 200, height: 200 });
  const overlay = { tagName: 'A', getAttribute: () => null, querySelectorAll: () => [] };
  const card = { tagName: 'DIV', getAttribute: () => null, querySelectorAll: () => [image] };
  const overImage = { clientX: 100, clientY: 100, composedPath: () => [overlay, card] };
  assert.equal(dispatch('click', overImage).prevented, true);
  assert.equal(calls.length, 5);
  assert.equal(dispatch('click', { ...overImage, clientX: 250 }).prevented, false);
  assert.equal(dispatch('click', { ...overImage, composedPath: () => [{ tagName: 'BUTTON' }, card] }).prevented, false);
  assert.equal(dispatch('click', { ...overImage, composedPath: () => [overlay, { ...card, querySelectorAll: () => [image, image] }] }).prevented, false);
  assert.equal(dispatch('click', { ...overImage, composedPath: () => [overlay, { ...card, querySelectorAll: () => Array(9).fill(image) }] }).prevented, false);
  assert.equal(calls.length, 5);
  const background = { ...card, hasAttribute: () => false, getBoundingClientRect: image.getBoundingClientRect, backgroundImage: 'url(/texture.png)' };
  const container = { ...background, tagName: 'MAIN', querySelectorAll: () => Array(12).fill(image) };
  const body = { ...background, tagName: 'BODY' };
  dispatch('click', { ...overImage, composedPath: () => [overlay, card, container, body] });
  assert.equal(calls.at(-1).source, 'https://example.com/picture.jpg');
  assert.equal(dispatch('click', { ...overImage, composedPath: () => [overlay, container, body] }).prevented, false);
  const cssPhoto = { ...background, backgroundImage: 'url(/photo.webp)', querySelectorAll: () => [] };
  assert.equal(dispatch('click', { ...overImage, composedPath: () => [overlay, cssPhoto, container, body] }).prevented, true);
  assert.equal(calls.at(-1).source, 'https://example.com/photo.webp');
  const pixel = { ...image, src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBA==', complete: true, naturalWidth: 1, naturalHeight: 1 };
  dispatch('click', { ...overImage, composedPath: () => [pixel, { ...card, querySelectorAll: () => [pixel, image] }] });
  assert.equal(calls.at(-1).source, 'https://example.com/picture.jpg');
  image.isConnected = true;
  dispatch('pointerover', { ...overImage, ctrlKey: false });
  assert.equal(calls.at(-1).type, 'lens-context-target'); assert.equal(calls.at(-1).detected, true);
  dispatch('contextmenu', { ...overImage, button: 2, ctrlKey: false });
  let resolved; [...messageListeners][0]({ type: 'lens-resolve-context' }, {}, value => { resolved = value.source; });
  assert.equal(resolved, 'https://example.com/picture.jpg');
  [...messageListeners][0]({ type: 'lens-resolve-context' }, {}, value => { resolved = value.source; });
  assert.equal(resolved, '');
  dispatch('pointerover', { ctrlKey: false, composedPath: () => [{ tagName: 'BODY' }] });
  assert.equal(calls.at(-1).detected, false);
});

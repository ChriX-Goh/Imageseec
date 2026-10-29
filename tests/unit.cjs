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
for (const locale of locales) test(`complete localized settings and placeholders: ${locale}`, () => {
  const english = JSON.parse(source('_locales/en/messages.json'));
  const messages = JSON.parse(source(`_locales/${locale}/messages.json`));
  assert.deepEqual(Object.keys(messages).sort(), Object.keys(english).sort());
  for (const [key, value] of Object.entries(messages)) {
    assert.equal(typeof value.message, 'string'); assert.ok(value.message.trim(), key);
    assert.deepEqual(Object.keys(value.placeholders || {}).sort(), Object.keys(english[key].placeholders || {}).sort(), key);
    assert.deepEqual(value.placeholders, english[key].placeholders, key);
  }
  const c = vm.createContext({ chrome: { i18n: i18nFixture.forLocale(locale.replace('_','-')) } });
  vm.runInContext(source('i18n.js'), c); vm.runInContext(source('preferences.js'), c);
  assert.equal(c.ImageLens.i18n.locale, locale);
  assert.ok(c.ImageLens.preferences.html.includes(c.ImageLens.i18n.html('quickOpen')));
  assert.ok(c.ImageLens.i18n.text('imageCount', 3, 9).includes('3'));
  assert.ok(c.ImageLens.i18n.text('imageCount', 3, 9).includes('9'));
  assert.equal(c.ImageLens.i18n.text('zoomTo', 150).includes('150'), true);
  assert.doesNotMatch(c.ImageLens.i18n.text('imageCount', 3, 9), /\$\w+\$/);
  assert.ok(messages.extDescription.message.length <= 132, 'manifest description length');
});

test('browser UI language resolution and unsupported-language English fallback', () => {
  const c = vm.createContext({ chrome: { i18n: i18nFixture.forLocale('sv-SE') } });
  vm.runInContext(source('i18n.js'), c);
  assert.equal(c.ImageLens.i18n.locale, 'en'); assert.equal(c.ImageLens.i18n.text('zoom'), 'Zoom');
  assert.deepEqual(plain(c.ImageLens.i18n.locales), locales);
  for (const [input, expected] of [['en-GB','en'],['ru-RU','ru'],['uk-UA','uk'],['pl-PL','pl'],['zh-CN','zh_CN'],['zh-TW','zh_TW'],['fr-CA','fr'],['pt-BR','en'],['','en']]) assert.equal(c.ImageLens.i18n.resolveLocale(input),expected);
  const manifest = JSON.parse(source('manifest.json'));
  assert.equal(manifest.default_locale,'en'); assert.equal(manifest.description,'__MSG_extDescription__');
});

test('translated HTML and substituted values are escaped before template insertion', () => {
  const c = vm.createContext({ chrome: { i18n: i18nFixture.forLocale('en') } });
  vm.runInContext(source('i18n.js'), c);
  const value = c.ImageLens.i18n.html('viewImage', '<img src=x onerror="alert(1)">');
  assert.doesNotMatch(value, /<img/); assert.match(value, /&lt;img/); assert.match(value, /&quot;/);
});

test('packaged UI has no untranslated Chinese literals or unlisted message keys', () => {
  const messages = JSON.parse(source('_locales/en/messages.json'));
  for (const file of ['viewer.js','preferences.js','options.js','background.js','standalone.js','options.html','standalone.html']) {
    assert.doesNotMatch(source(file), /\p{Script=Han}/u, file);
    for (const match of source(file).matchAll(/(?:\bt|\bh|\bgetMessage)\('([A-Za-z]+)'/g)) assert.ok(messages[match[1]], `${file}: ${match[1]}`);
  }
  assert.match(source('LICENSE'), /MIT License/);
  assert.match(source('LICENSE'), /2026 Imageseec contributors/);
});
function context(hostname = 'example.com') {
  const images = [];
  const document = { baseURI: `https://${hostname}/album/`, images, body: null, querySelectorAll: s => s === 'img' ? images : [] };
  const c = vm.createContext({ URL, document, chrome: { i18n: i18nFixture.forLocale('en') }, location: { hostname }, matchMedia: () => ({ matches: true }), getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) });
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
test('settings defaults, invalid storage values and independent bounds', () => {
  const { c } = context(); const normalize = c.ImageLens.settings.normalize;
  assert.deepEqual(plain(normalize(null)), { zoomStep: 15, holdZoom: 200, cacheBefore: 2, cacheAfter: 2, previewBefore: 3, previewAfter: 3, zoomLocked: false, doubleClickExit: true, quickOpen: true });
  assert.deepEqual(plain(normalize({ zoomStep: 0, holdZoom: 999, cacheBefore: -2, cacheAfter: 99, previewBefore: 'x', previewAfter: 0, doubleClickExit: false })), { zoomStep: 1, holdZoom: 800, cacheBefore: 0, cacheAfter: 12, previewBefore: 3, previewAfter: 0, zoomLocked: false, doubleClickExit: false, quickOpen: true });
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

test('srcset and explicit original links, lazy images and safe protocols', () => {
  const { c, image } = context(); const g = c.ImageLens.gallery;
  const i = image('https://images.example.com/small.jpg', { srcset: 'https://images.example.com/medium.jpg 800w, https://images.example.com/full.jpg 2400w' });
  assert.equal(g.sources(i)[0], 'https://images.example.com/full.jpg');
  assert.equal(g.url('javascript:alert(1)'), ''); assert.equal(g.url('data:text/html,hello'), '');
  const lazy = image('', { 'data-src': '/lazy.jpg' }); assert.equal(g.sources(lazy)[0], 'https://example.com/lazy.jpg');
  const signed = 'https://cdn.example.com/file.jpg?w=300&token=private&expires=123'; assert.equal(g.key(signed), signed);
});
test('generic gallery filters navigation, tiny icons and duplicate variants', () => {
  const { c, image } = context();
  const a = image('https://cdn.example.com/1.jpg?w=400');
  image('https://cdn.example.com/1.jpg?w=1200');
  image('https://cdn.example.com/2.jpg');
  const icon = image('https://cdn.example.com/icon.jpg'); icon.alt = 'avatar';
  const tiny = image('https://cdn.example.com/tiny.jpg'); tiny.getBoundingClientRect = () => ({ width: 16, height: 16 });
  const result = c.ImageLens.gallery.collect(a.src);
  assert.equal(result.entries.length, 2); assert.equal(result.index, 0);
});
function albumFixture(c, pictures, { semantic = true, hidden = false, positions = false } = {}) {
  const grid = { children: [], parentElement: null, querySelectorAll: selector => selector === 'img' ? pictures : [] };
  pictures.forEach((img, index) => {
    const card = { tagName: 'FIGURE', parentElement: grid, children: [img], querySelectorAll: selector => selector === 'img' ? [img] : [],
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
  const allowed = new Set(['data-original','data-full','data-full-src','data-large-file','data-src','data-gallery']);
  for (const attribute of attributes) assert.ok(allowed.has(attribute), attribute);
});

test('product descriptions omit development endpoints and retain independent product positioning', () => {
  for (const file of ['README.md','PRIVACY.md','docs/STORE-LISTING.md']) assert.doesNotMatch(source(file), /127\.0\.0\.1|localhost|18766|node tests\//i, file);
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
    contextMenus: { onClicked: event(), removeAll: fn => fn(), create: item => calls.push(['menu', item]) },
    storage: { local: { get: async () => ({ settings }) }, session: storage },
    scripting: { async executeScript(options) { calls.push(['inject', options]); } },
    tabs: { async create(options) { calls.push(['tab', options]); } }
  };
  const c = vm.createContext({ chrome, console, URL, crypto: { randomUUID: () => 'unit-token' } });
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
test('context menu opens the selected image in its original frame', async () => {
  const b = background(); b.chrome.runtime.onInstalled.callbacks[0]();
  assert.deepEqual(plain(b.calls[0][1].contexts), ['image']);
  await b.c.openImage({ srcUrl: 'https://cdn.example.com/image.jpg', frameId: 3 }, { id: 4 });
  const injects = b.calls.filter(c => c[0] === 'inject');
  assert.deepEqual(plain(injects[0][1].target), { tabId: 4, frameIds: [3] });
  assert.deepEqual(plain(injects[0][1].files), ['i18n.js', 'settings.js', 'controls.js', 'preferences.js', 'gallery.js', 'viewer.js', 'quick-open.js']);
  assert.deepEqual(plain(injects[1][1].args), ['https://cdn.example.com/image.jpg', { zoomStep: 25 }]);
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
  const handlers = new Map(); const calls = []; const listeners = new Set();
  let settings = { quickOpen: true };
  const c = vm.createContext({
    AbortController, URL, document: { baseURI: 'https://example.com/album/' },
    window: { addEventListener(type, callback, { signal }) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(callback);
      signal.addEventListener('abort', () => handlers.get(type).delete(callback));
    } },
    chrome: { runtime: { async sendMessage(message) { calls.push(message); return { ok: true }; } }, storage: {
      local: { async get() { return { settings }; } },
      onChanged: { addListener: fn => listeners.add(fn), removeListener: fn => listeners.delete(fn) }
    } }
  });
  vm.runInContext(source('quick-open.js'), c); await Promise.resolve();
  assert.equal(c.ImageLens.open, undefined); assert.equal(c.ImageLens.gallery, undefined);
  const image = { tagName: 'IMG', src: '../picture.jpg', getAttribute: () => null };
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
  settings = { quickOpen: false }; for (const listener of listeners) listener({ settings: { newValue: settings } }, 'local');
  assert.equal(dispatch().prevented, false); assert.equal(calls.length, 1);
  settings = { quickOpen: true }; for (const listener of listeners) listener({ settings: { newValue: settings } }, 'local');
  vm.runInContext(source('quick-open.js'), c); await Promise.resolve();
  assert.equal(listeners.size, 1); assert.equal(handlers.get('click').size, 1);
  dispatch(); assert.equal(calls.length, 2);
  image.src = 'javascript:alert(1)'; assert.equal(dispatch().prevented, false); assert.equal(calls.length, 2);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'viewer.js'), 'utf8');

function viewerFunction(name) {
  const match = new RegExp(`^\\s{4}function ${name}\\(`, 'm').exec(source);
  assert.ok(match, `missing viewer function ${name}`);
  const start = match.index, params = source.indexOf('(', match.index);
  let parentheses = 0, close = -1;
  for (let i = params; i < source.length; i++) {
    if (source[i] === '(') parentheses++;
    else if (source[i] === ')' && --parentheses === 0) { close = i; break; }
  }
  assert.notEqual(close, -1, `unterminated parameters for ${name}`);
  const open = source.indexOf('{', close);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  assert.fail(`unterminated viewer function ${name}`);
}

function scheduler() {
  let now = 50, nextId = 0;
  const timers = new Map();
  const history = [];
  const context = vm.createContext({
    clearTimeout(id) { timers.delete(id); },
    setTimeout(callback, delay) {
      const id = ++nextId;
      timers.set(id, { callback, due: now + Math.max(0, delay) });
      return id;
    },
    performance: { now: () => now },
    Object,
    Math,
    console
  });
  vm.runInContext(`
    let closed = false, scanPromise = null, scanTimer = 0, scanQueuedAt = 0, galleryRefreshQueued = false;
    let observedGallerySignature = 'before', overviewOpen = false, currentSignature = 'before', refreshSignature = 'after';
    const scanStates = { '-1': { paused: true, ended: true, failed: true }, '1': { paused: true, ended: true, failed: true } };
    function scanSlotSignature() { return currentSignature; }
    const refreshTimes = [];
    function refresh() { refreshTimes.push(performance.now()); refreshCount++; currentSignature = refreshSignature; }
    function checkOverviewCache() { overviewChecks++; }
    let refreshCount = 0, overviewChecks = 0;
    ${viewerFunction('cancelGalleryRefresh')}
    ${viewerFunction('flushGalleryRefresh')}
    ${viewerFunction('queueGalleryRefresh')}
    globalThis.cancel = cancelGalleryRefresh;
    globalThis.enqueue = queueGalleryRefresh;
    globalThis.flush = flushGalleryRefresh;
    globalThis.setScanning = value => { scanPromise = value; };
    globalThis.setOverviewOpen = value => { overviewOpen = value; };
    globalThis.setSignature = (observed, current, afterRefresh = current) => {
      observedGallerySignature = observed; currentSignature = current; refreshSignature = afterRefresh;
    };
    globalThis.refreshTimes = refreshTimes;
    globalThis.state = () => ({ refreshCount, overviewChecks, scanQueuedAt, galleryRefreshQueued, scanTimer });
    globalThis.scanStatus = () => Object.values(scanStates).map(state => ({ paused: state.paused, ended: state.ended, failed: state.failed }));
  `, context);

  function advance(milliseconds) {
    const target = now + milliseconds;
    while (true) {
      const due = [...timers.entries()].filter(([, timer]) => timer.due <= target).sort((a, b) => a[1].due - b[1].due)[0];
      if (!due) break;
      now = due[1].due;
      timers.delete(due[0]);
      due[1].callback();
      history.push({ time: now, ...context.state() });
    }
    now = target;
  }
  return { context, advance, history, now: () => now };
}

test('continuous gallery mutations cannot postpone refresh beyond the 900ms max wait', () => {
  const clock = scheduler();
  for (let elapsed = 0; elapsed < 5000; elapsed += 100) {
    if (elapsed) clock.advance(100);
    clock.context.enqueue();
  }
  clock.advance(300);
  const refreshTimes = Array.from(clock.context.refreshTimes);
  assert.ok(refreshTimes.length >= 5, `refreshes during mutation stream: ${refreshTimes.length}`);
  assert.ok(refreshTimes[0] - 50 <= 900, `${refreshTimes[0] - 50}ms first refresh delay`);
  for (let i = 1; i < refreshTimes.length; i++) {
    assert.ok(refreshTimes[i] - refreshTimes[i - 1] <= 900, `${refreshTimes[i] - refreshTimes[i - 1]}ms refresh gap`);
  }
  assert.equal(clock.context.state().galleryRefreshQueued, false);
});

test('a quiet gallery still refreshes after the trailing 300ms delay', () => {
  const clock = scheduler();
  clock.context.setOverviewOpen(true);
  clock.context.enqueue();
  clock.advance(299);
  assert.equal(clock.context.state().refreshCount, 0);
  clock.advance(1);
  assert.equal(clock.context.state().refreshCount, 1);
  assert.equal(clock.context.state().galleryRefreshQueued, false);
  assert.equal(clock.context.state().overviewChecks, 1);
  assert.ok(clock.context.scanStatus().every(state => !state.paused && !state.ended && !state.failed));
});

test('mutations during a source scan coalesce until the scan finishes', () => {
  const clock = scheduler();
  clock.context.setSignature('before', 'before', 'before');
  clock.context.setScanning(Promise.resolve());
  for (let elapsed = 0; elapsed < 2000; elapsed += 100) {
    clock.context.enqueue();
    clock.advance(100);
  }
  assert.equal(clock.context.state().refreshCount, 0, 'no full refresh overlaps an active scan');
  assert.equal(clock.context.state().galleryRefreshQueued, true);
  assert.equal(clock.context.flush(), false, 'an active scan retains the coalesced refresh request');
  assert.equal(clock.context.state().refreshCount, 0);
  clock.context.setScanning(null);
  assert.equal(clock.context.flush({ scanCompleted: true }), true);
  assert.equal(clock.context.state().refreshCount, 1);
  assert.equal(clock.context.state().galleryRefreshQueued, false);
  assert.ok(clock.context.scanStatus().every(state => state.paused && state.ended && state.failed),
    'a source scan owns its settled paused/ended/failed result');
  assert.equal(clock.context.state().overviewChecks, 0, 'cache scheduling remains with scanMore finalization');
});

test('an empty observed signature still detects and resumes after a late first slot', () => {
  const clock = scheduler();
  clock.context.setSignature('', '', 'first-slot');
  clock.context.enqueue();
  clock.advance(300);
  assert.ok(clock.context.scanStatus().every(state => !state.paused && !state.ended && !state.failed));
});

test('semantic progress discovered by the final scan refresh clears a stale boundary', () => {
  const clock = scheduler();
  clock.context.setOverviewOpen(true);
  clock.context.setSignature('before', 'during-scan', 'late-slot-at-final-flush');
  clock.context.setScanning(Promise.resolve());
  clock.context.enqueue();
  assert.equal(clock.context.state().refreshCount, 0);
  clock.context.setScanning(null);
  assert.equal(clock.context.flush({ scanCompleted: true }), true);
  assert.ok(clock.context.scanStatus().every(state => !state.paused && !state.ended && !state.failed));
  assert.equal(clock.context.state().overviewChecks, 0, 'scan finalization must schedule cache work without refresh recursion');
});

test('closing cancels a pending gallery refresh and clears its queue state', () => {
  const clock = scheduler();
  clock.context.enqueue();
  assert.equal(clock.context.state().galleryRefreshQueued, true);
  assert.notEqual(clock.context.state().scanTimer, 0);
  clock.context.cancel();
  assert.equal(clock.context.state().galleryRefreshQueued, false);
  assert.equal(clock.context.state().scanTimer, 0);
  assert.equal(clock.context.state().scanQueuedAt, 0);
  clock.advance(1000);
  assert.equal(clock.context.state().refreshCount, 0);
});

test('source scan scrollport selects live overflow before an empty inner auto wrapper', () => {
  const code = viewerFunction('scanTargetFor').replace(/^\s{4}/gm, '');
  const inner = { isConnected: true, style: { overflowY: 'auto', overflowX: 'hidden' }, scrollHeight: 300, clientHeight: 600,
    scrollWidth: 320, clientWidth: 320 };
  const outer = { isConnected: true, style: { overflowY: 'auto', overflowX: 'hidden' }, scrollHeight: 1400, clientHeight: 700,
    scrollWidth: 360, clientWidth: 360 };
  const context = vm.createContext({ getComputedStyle: node => node.style, Object });
  vm.runInContext(`${code}\nglobalThis.pick = scanTargetFor;`, context);
  assert.equal(context.pick([inner, outer]).node, outer);
  inner.scrollHeight = 900;
  assert.equal(context.pick([inner, outer]).node, inner,
    'once the gallery itself overflows, scanning moves to its nearer nested scrollport');
});

test('a nested auto scrollport is retained before it overflows and can reach its sentinel later', () => {
  const code = viewerFunction('scanTargetFor').replace(/^\s{4}/gm, '');
  const nested = { isConnected: true, style: { overflowY: 'auto', overflowX: 'hidden' }, scrollHeight: 500, clientHeight: 700,
    scrollWidth: 320, clientWidth: 320 };
  const context = vm.createContext({ getComputedStyle: node => node.style, Object });
  vm.runInContext(`${code}\nglobalThis.pick = scanTargetFor;`, context);
  const initially = context.pick([nested]);
  assert.equal(initially.node, nested);
  assert.equal(initially.horizontal, false);
  nested.scrollHeight = 1800;
  assert.equal(context.pick([nested]).node, nested);
  assert.equal(nested.scrollHeight - nested.clientHeight > 0, true);
});

test('switching to a newly overflowing gallery scroller resets directional cursors and anchor basis', () => {
  const code = [viewerFunction('scanTargetFor'), viewerFunction('refreshScanScroller')].join('\n').replace(/^\s{4}/gm, '');
  const nested = { isConnected: true, style: { overflowY: 'auto', overflowX: 'hidden' }, scrollHeight: 500, clientHeight: 700,
    scrollWidth: 320, clientWidth: 320, scrollTop: 37 };
  const context = vm.createContext({
    getComputedStyle: node => node.style,
    scrollCandidates: [nested], scanScroller: null, scanHorizontal: false,
    collection: { scope: nested },
    scanStates: { '-1': { cursor: 10 }, '1': { cursor: 20 } },
    sourceAnchors: new Map([['virtual-entry', { scroller: { old: true }, position: 120 }]]), anchorRefreshes: 0,
    sourcePosition: () => context.scanScroller?.scrollTop ?? 0,
    rememberSourceAnchors() { context.anchorRefreshes++; },
    Object
  });
  vm.runInContext(`function refreshScrollCandidates() {}\n${code}\nglobalThis.refreshTarget = refreshScanScroller;`, context);
  nested.scrollHeight = 1500;
  assert.equal(context.refreshTarget(), true);
  assert.equal(context.scanScroller, nested);
  assert.equal(context.scanStates['-1'].cursor, 37);
  assert.equal(context.scanStates['1'].cursor, 37);
  assert.equal(context.sourceAnchors.size, 1, 'keep virtual-item anchors with their recorded scrollport coordinate basis');
  assert.equal(context.sourceAnchors.get('virtual-entry').scroller.old, true);
  assert.equal(context.anchorRefreshes, 1);
  assert.equal(context.refreshTarget(), false);
});

test('gallery replacement rebuilds connected scroll ancestors and drops detached containers', () => {
  const code = viewerFunction('refreshScrollCandidates').replace(/^\s{4}/gm, '');
  const body = {}, documentElement = {};
  const oldScroller = { isConnected: false, style: { overflowY: 'auto', overflowX: 'hidden' }, scrollTop: 11, scrollLeft: 0,
    scrollHeight: 800, clientHeight: 500, scrollWidth: 200, clientWidth: 200 };
  const oldScope = { isConnected: false, style: { overflowY: 'visible', overflowX: 'visible' }, parentElement: oldScroller, scrollTop: 0, scrollLeft: 0 };
  const newScroller = { isConnected: true, style: { overflowY: 'auto', overflowX: 'hidden' }, scrollTop: 73, scrollLeft: 0,
    scrollHeight: 400, clientHeight: 700, scrollWidth: 240, clientWidth: 240, parentElement: body };
  const newScope = { isConnected: true, style: { overflowY: 'visible', overflowX: 'visible' }, parentElement: newScroller, scrollTop: 0, scrollLeft: 0 };
  const context = vm.createContext({
    document: { body, documentElement }, getComputedStyle: node => node.style,
    pagePosition: { elements: [{ node: oldScroller, top: 11, left: 0 }] }, scrollCandidates: [], scanPromise: null,
    Object
  });
  vm.runInContext(`${code}\nglobalThis.rebuild = refreshScrollCandidates;`, context);
  context.rebuild(newScope);
  assert.deepEqual(Array.from(context.scrollCandidates), [newScroller]);
  assert.equal(context.pagePosition.elements.some(item => item.node === oldScroller), false);
  assert.equal(context.pagePosition.elements.find(item => item.node === newScroller).top, 73);
});

test('discovering a scroll ancestor during a temporary scan does not record the temporary offset as its baseline', () => {
  const code = viewerFunction('refreshScrollCandidates').replace(/^\s{4}/gm, '');
  const body = {}, documentElement = {};
  const originalScroller = { isConnected: true, style: { overflowY: 'auto', overflowX: 'hidden' }, scrollTop: 42, scrollLeft: 0,
    scrollHeight: 1400, clientHeight: 700, scrollWidth: 300, clientWidth: 300 };
  const lateScroller = { isConnected: true, style: { overflowY: 'auto', overflowX: 'hidden' }, scrollTop: 510, scrollLeft: 0,
    scrollHeight: 1600, clientHeight: 700, scrollWidth: 320, clientWidth: 320, parentElement: body };
  const scope = { isConnected: true, style: { overflowY: 'visible', overflowX: 'visible' }, scrollTop: 0, scrollLeft: 0, parentElement: lateScroller };
  const context = vm.createContext({
    document: { body, documentElement }, getComputedStyle: node => node.style,
    pagePosition: { elements: [{ node: originalScroller, top: 42, left: 0 }] }, scrollCandidates: [originalScroller], scanPromise: Promise.resolve(),
    Object
  });
  vm.runInContext(`${code}\nglobalThis.refreshCandidates = refreshScrollCandidates;`, context);
  context.refreshCandidates(scope);
  assert.equal(context.scrollCandidates.includes(lateScroller), true, 'new source wrapper is eligible for the next scan segment');
  assert.equal(context.pagePosition.elements.some(item => item.node === lateScroller), false,
    'a refresh during the current scan must defer baseline capture');
  context.scanPromise = null;
  context.refreshCandidates(scope);
  assert.equal(context.pagePosition.elements.find(item => item.node === lateScroller).top, 510,
    'baseline captures the restored source position before the next segment scrolls');
});

test('source anchor fallback preserves root virtual-list position but rejects detached nested coordinates', () => {
  const code = viewerFunction('sourceAnchorWindowY').replace(/^\s{4}/gm, '');
  const context = vm.createContext({});
  vm.runInContext(`${code}\nglobalThis.anchorY = sourceAnchorWindowY;`, context);
  assert.equal(context.anchorY({ scroller: null, position: 900, pageY: 100 }, 600), 600,
    'root virtual lists can recover from the recorded source coordinate');
  assert.equal(context.anchorY({ scroller: { isConnected: false }, position: 900, pageY: 100 }, 600), 100,
    'a detached nested scrollport must fall back to the saved page position');
});

test('scroll target prefers a currently overflowing ancestor, then adopts a newly overflowing inner one', () => {
  const code = viewerFunction('scanTargetFor').replace(/^\s{4}/gm, '');
  const context = vm.createContext({
    getComputedStyle: node => node.style,
    inner: { isConnected: true, style: { overflowY: 'auto', overflowX: 'hidden' }, scrollHeight: 400, clientHeight: 600, scrollWidth: 300, clientWidth: 300 },
    outer: { isConnected: true, style: { overflowY: 'auto', overflowX: 'hidden' }, scrollHeight: 1200, clientHeight: 600, scrollWidth: 300, clientWidth: 300 }
  });
  vm.runInContext(`${code}\nglobalThis.pick = scanTargetFor;`, context);
  assert.equal(context.pick([context.inner, context.outer]).node, context.outer,
    'do not select a non-overflowing inner auto wrapper over an active outer scrollport');
  context.inner.scrollHeight = 900;
  assert.equal(context.pick([context.inner, context.outer]).node, context.inner,
    'a newly overflowing inner gallery scrollport takes priority for subsequent scans');
});

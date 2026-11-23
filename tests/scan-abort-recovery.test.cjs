'use strict';
// Anonymous regression probe. It executes the production scanDelay,
// scanSegment, and scanMore function bodies from viewer.js with inert DOM nodes.
// Its fixtures use reserved example domains and do not contact live pages.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const viewer = fs.readFileSync(path.resolve(__dirname, '../viewer.js'), 'utf8');
const gallerySource = fs.readFileSync(path.resolve(__dirname, '../gallery.js'), 'utf8');
function viewerFunction(name) {
  const match = new RegExp(`^\\s{4}(?:async\\s+)?function ${name}\\(`, 'm').exec(viewer);
  assert.ok(match, `missing viewer function ${name}`);
  const start = match.index, params = viewer.indexOf('(', start);
  let parentheses = 0, close = -1;
  for (let index = params; index < viewer.length; index++) {
    if (viewer[index] === '(') parentheses++;
    else if (viewer[index] === ')' && --parentheses === 0) { close = index; break; }
  }
  assert.notEqual(close, -1);
  const open = viewer.indexOf('{', close);
  let depth = 0;
  for (let index = open; index < viewer.length; index++) {
    if (viewer[index] === '{') depth++;
    else if (viewer[index] === '}' && --depth === 0) return viewer.slice(start, index + 1);
  }
  assert.fail(`unterminated function ${name}`);
}

function makeHarness(options = {}) {
  const { abortOnTimer = true, abortDelayNumber = 1, sourceProgress = false, virtualizeOnRefresh = false, seedEntries = false, sourceLoadingOnPoll = false } = options;
  const initialCursor = Object.hasOwn(options, 'initialCursor') ? options.initialCursor : 500;
  const body = { tagName: 'BODY', isConnected: true, parentElement: null };
  const documentElement = { tagName: 'HTML', isConnected: true, parentElement: null };
  const scroller = {
    isConnected: true, scrollTop: 500, scrollLeft: 0, scrollHeight: 1900, clientHeight: 100,
    scrollWidth: 320, clientWidth: 320, style: { overflowY: 'auto', overflowX: 'hidden' }, parentElement: body,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 320, height: 100, right: 320, bottom: 100 }),
    scrollTo({ top, left }) { if (top !== undefined) this.scrollTop = top; if (left !== undefined) this.scrollLeft = left; }
  };
  const nextScroller = {
    isConnected: true, scrollTop: 260, scrollLeft: 0, scrollHeight: 1600, clientHeight: 100,
    scrollWidth: 320, clientWidth: 320, style: { overflowY: 'auto', overflowX: 'hidden' }, parentElement: body,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 320, height: 100, right: 320, bottom: 100 }),
    scrollTo({ top, left }) { if (top !== undefined) this.scrollTop = top; if (left !== undefined) this.scrollLeft = left; }
  };
  const slotNode = {
    isConnected: true, parentElement: null,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 100, right: 300, bottom: 100 }),
    getAttribute: () => null
  };
  const slot = { key: 'pending-slot', node: slotNode, pending: true };
  const scopeListeners = new Map();
  const scope = {
    isConnected: true,
    parentElement: scroller, style: { overflowY: 'visible', overflowX: 'visible' },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 320, height: 900, right: 320, bottom: 900 }),
    querySelectorAll: () => [],
    addEventListener(type, listener) { scopeListeners.set(type, listener); },
    removeEventListener(type, listener) { if (scopeListeners.get(type) === listener) scopeListeners.delete(type); },
    contains: () => false,
    emit(type, target) { scopeListeners.get(type)?.({ target }); }
  };
  const nextScope = {
    isConnected: true, parentElement: nextScroller, style: { overflowY: 'visible', overflowX: 'visible' },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 320, height: 900, right: 320, bottom: 900 }),
    querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}, contains: () => false
  };
  slotNode.parentElement = scope;
  const nextSlotNode = { ...slotNode, isConnected: true, parentElement: nextScope };
  const nextSlot = { key: 'pending-slot', node: nextSlotNode, pending: true };
  let context;
  let restoreCount = 0, removedObservers = 0, abortAtDelay = abortOnTimer, delayCount = 0, clock = 0;
  let rootPageY = 73;
  const windowState = { get scrollY() { return rootPageY; }, scrollTo({ top }) { rootPageY = top; } };
  class FakeObserver { observe() {} disconnect() { removedObservers++; } }
  context = vm.createContext({
    AbortController, MutationObserver: FakeObserver, URL, Set, Map, Math, Number, Object, Boolean, String,
    performance: { now: () => clock }, innerHeight: 100, innerWidth: 320, window: windowState,
    cancelAnimationFrame: () => {}, setTestClock: value => { clock = value; },
    document: { baseURI: 'https://fixture.invalid/', body, documentElement, scrollingElement: { scrollHeight: 1900 } },
    getComputedStyle: node => node.style || { overflowX: 'visible', overflowY: 'visible' },
    lens: { gallery: { sources: () => [] } },
    setTimeout(callback, delay) {
      const actualDelay = delay === 120 ? 1 : delay;
      return setTimeout(() => {
        if (delay >= 500) clock += 1000;
        if (delay === 120) {
          delayCount++;
          clock += 300;
          if (sourceProgress && delayCount === 1) scope.emit('load', { tagName: 'IMG' });
          if (abortAtDelay && delayCount === abortDelayNumber) {
            abortAtDelay = false;
            context.abortCurrent();
          }
        }
        callback();
      }, actualDelay);
    },
    clearTimeout,
    enableAbortOnDelay: () => { abortAtDelay = true; delayCount = 0; },
    scroller, nextScroller, scope, nextScope, slot, nextSlot, sourceProgress, virtualizeOnRefresh, initialCursor, seedEntries, sourceLoadingOnPoll,
    getRestoreCount: () => restoreCount,
    getRootPageY: () => rootPageY,
    incrementRestore: () => { restoreCount++; }, getObserverDisconnects: () => removedObservers
  });

  vm.runInContext('globalThis.ImageLens = globalThis.lens;', context);
  vm.runInContext(gallerySource, context);

  const scanSegmentSource = viewerFunction('scanSegment');
  const checkSource = viewerFunction('checkOverviewCache').replace('function checkOverviewCache(', 'function productionCheckOverviewCache(');
  const scheduleSource = viewerFunction('scheduleOverviewCacheCheck')
    .replace('function scheduleOverviewCacheCheck(', 'function productionScheduleOverviewCacheCheck(')
    .replace('function productionScheduleOverviewCacheCheck(delay = 650) {',
      'function productionScheduleOverviewCacheCheck(delay = 650) { if (!watchAutomaticRescan) { overviewCacheCheckCount++; return; }')
    .replace('overviewCacheCheckTimer = 0; checkOverviewCache();',
      'overviewCacheCheckTimer = 0; overviewCacheCheckCount++; checkOverviewCache();');
  const code = [viewerFunction('scanDelay'), viewerFunction('refreshScrollCandidates'), viewerFunction('scanTargetFor'),
    viewerFunction('refreshScanScroller'), scanSegmentSource, viewerFunction('scanMore'), scheduleSource,
    'function scheduleOverviewCacheCheck(delay = 650) { return productionScheduleOverviewCacheCheck(delay); }', checkSource,
    'function checkOverviewCache(force = false) { overviewCheckCalls++; return productionCheckOverviewCache(force); }',
    viewerFunction('exitOverview'), viewerFunction('close')].join('\n');
  vm.runInContext(`
    let closed = false, standalone = false, overviewOpen = true;
    let scanPromise = null, scanController = null, scanRestore = null;
    let scanningDirection = 1, overviewDirection = 1, overviewBackwardExpanded = false;
    let overviewBackwardProbeStarted = false, overviewBackwardProbeCompleted = false;
    let galleryRefreshQueued = false, edgeSide = 0;
    let overviewAnchor = null, overviewRecent = null, overviewCommitTimer = 0, overviewCommitStarted = 0;
    let overviewDirty = false, pictureClick = 0, overviewLayoutAnchor = null, overviewScrollFrame = 0, overviewThumbPumpTimer = 0;
    let serial = 0, compareEnabled = false, index = 0, compareLeft = 0, compareRight = -1, activePane = 0, lockedPane = null, pairNeedsAnchor = false, dividerPosition = .5;
    let scanScroller = globalThis.scroller, scanHorizontal = false;
    let overviewCacheCheckCount = 0, overviewCacheCheckTimer = 0, overviewCheckCalls = 0;
    let watchAutomaticRescan = false;
    const automaticScanStarts = [];
    const overviewEdgeIntentState = { timer: 0, side: 0 };
    const overviewThumbQueue = [];
    const overviewThumbJobs = new Map();
    const overview = { classList: { remove() {} }, setAttribute() {}, getBoundingClientRect: () => ({ top: 0, left: 0, right: 320, bottom: 100, width: 320, height: 100 }), clientHeight: 100, clientWidth: 320, scrollHeight: 100, scrollWidth: 320, scrollTop: 0, scrollLeft: 0, style: {} };
    const overviewShell = { hidden: false };
    const viewer = { focus() {} }, dialog = { close() {} }, host = { remove() {} }, focused = { focus() {} };
    const controller = new AbortController(), preferencesBinding = { abort() {} }, observer = { disconnect() {} }, pool = { clear() {} };
    const chrome = { storage: { onChanged: { removeListener() {} }, local: { set: async () => {} } } };
    const reducedMotion = { matches: true };
    const settings = { overviewCacheBeforeMode: 'custom' };
    const entries = globalThis.seedEntries ? [
      { key: 'https://img.example.test/previous-a.jpg', sources: ['https://img.example.test/previous-a.jpg'], thumb: 'https://img.example.test/previous-a.jpg' },
      { key: 'https://img.example.test/previous-b.jpg', sources: ['https://img.example.test/previous-b.jpg'], thumb: 'https://img.example.test/previous-b.jpg' }
    ] : [];
    const pagePosition = { x: 0, y: 73, elements: [{ node: globalThis.scroller, top: 500, left: 0 }] };
    const sourceAnchors = new Map();
    const scrollCandidates = [globalThis.scroller];
    const slotAttempts = new Map();
    let refreshCount = 0;
    const scanStates = {
      '-1': { cursor: globalThis.initialCursor, phase: 'idle', paused: false, ended: false, failed: false, lastAttempt: -Infinity, noProgress: 0, triggerWaits: 0, resourceErrors: 0, totalAttempts: 0, sourceLoading: false, loadingNode: null, slotAttempts: new Map() },
      '1': { cursor: globalThis.initialCursor, phase: 'idle', paused: false, ended: false, failed: false, lastAttempt: -Infinity, noProgress: 0, triggerWaits: 0, resourceErrors: 0, totalAttempts: 0, sourceLoading: false, loadingNode: null, slotAttempts: new Map() }
    };
    const collection = { scope: globalThis.scope, slots: [globalThis.slot] };
    const overviewItems = [{ key: 'pending-slot', slotKey: 'pending-slot', slotNode: globalThis.slot.node, entry: null, thumb: '' }];
    const overviewBandSize = 1;
    function captureOverviewAnchor() { return null; }
    function clearOverviewPress() {}
    function updateOverviewButton() {}
    function updateCompareControls() {}
    function endHold() {}
    function cancelGalleryRefresh() { galleryRefreshQueued = false; }
    function restorePageStyles() {}
    function centralOverviewIndex() { return -1; }
    function activeIndex() { return 0; }
    function activeSnapshot() { return null; }
    function overviewSnapshot() { return null; }
    function overviewEdgeDistance() { return 0; }
    function returnFeedback() {}
    function storageChanged() {}
    function sourcePosition() { return scanScroller.scrollTop; }
    function scanSlotPending(item, side) { return Boolean(item?.pending || (item?.slotKey && (scanStates[side].slotAttempts.get(item.slotKey) || 0) < 3)); }
    function overviewSlotPending(item, side) { return Boolean(item && !item.entry && item.slotKey && (scanStates[side].slotAttempts.get(item.slotKey) || 0) < 3); }
    function overviewCacheWindow() { return { start: 0, end: 0, first: 0, last: 0, countBefore: 0, countAfter: 0, before: 0, after: 0 }; }
    function overviewScanDemandSatisfied() { return false; }
    function overviewPendingForSide() { return false; }
    function scanSlotHasSelectedSource() { return false; }
    function scanOneSlotSignature() { return 'same-pending-signature'; }
    function scanSlotSignature() { return 'pending-slot'; }
    function scanResolvedSnapshot() { return { entries: new Set(entries.map(entry => entry.key)), slotKeys: new Set(['pending-slot']), resolvedSlotKeys: new Set(), minPosition: null, maxPosition: null }; }
    function scanResolvedProgress(before, after) { return [...after.entries].some(key => !before.entries.has(key)); }
    function scanViewportSourceLoad() { return globalThis.sourceLoadingOnPoll ? { tagName: 'IMG' } : null; }
    function scanSourceFailureCount() { return 0; }
    function explicitScanBoundary() { return false; }
    ${viewerFunction('scanRefreshDue')}
    function scrollSourceTo(position) { scanScroller.scrollTop = position; return sourcePosition(); }
    function restorePageCoordinates() {
      globalThis.window.scrollTo({ left: pagePosition.x, top: pagePosition.y });
      for (const item of pagePosition.elements) if (item.node.isConnected) item.node.scrollTo({ top: item.top, left: item.left });
      globalThis.incrementRestore();
    }
    function rememberSourceAnchors() {}
    function refresh() {
      refreshCount++;
      if (globalThis.sourceProgress && refreshCount === 1) {
        const discovered = { key: 'https://img.example.test/source-arrived-during-scan.jpg',
          sources: ['https://img.example.test/source-arrived-during-scan.jpg'], thumb: 'https://img.example.test/source-arrived-during-scan.jpg' };
        entries.splice(0, entries.length, ...lens.gallery.mergeEntries(entries, [discovered], 1));
        if (globalThis.virtualizeOnRefresh) {
          globalThis.scroller.isConnected = false;
          collection.scope = globalThis.nextScope;
          collection.slots = [globalThis.nextSlot];
          overviewItems[0] = { key: 'pending-slot', slotKey: 'pending-slot', slotNode: globalThis.nextSlot.node, entry: null, thumb: '' };
        }
      }
    }
    function updateOverviewStatus() {}
    function updateNavigationButtons() {}
    function resetOverviewEdge() {}
    function queueOverviewCommit() {}
    function updateOverviewThumbnails() {}
    function overviewNeedsDiscovery() { return true; }
    function scheduleOverviewCacheCheck() { overviewCacheCheckCount++; }
    function flushGalleryRefresh() { galleryRefreshQueued = false; }
    function abortCurrent() { scanController?.abort(); }
    function start(side = 1) { return scanMore(side, true, 6); }
    function snapshot(side = 1) {
      return { scanningDirection, sourcePosition: sourcePosition(), savedPagePosition: pagePosition.elements[0].top,
        activeScrollerPosition: collection.scope?.parentElement?.scrollTop,
        oldScrollerConnected: globalThis.scroller.isConnected,
        rootPageY: globalThis.getRootPageY(), savedRootPageY: pagePosition.y, entries: entries.map(entry => entry.key),
        cursor: scanStates[side].cursor, slotAttempts: scanStates[side].slotAttempts.get('pending-slot') || 0,
        attempts: scanStates[side].totalAttempts, phase: scanStates[side].phase, sourceLoading: scanStates[side].sourceLoading, loadingNode: Boolean(scanStates[side].loadingNode), failed: scanStates[side].failed, scanError: globalThis.lastScanError || '',
        scanPromise: Boolean(scanPromise), scanController: Boolean(scanController), overviewOpen, closed,
        restoreCount: globalThis.getRestoreCount(), observerDisconnects: globalThis.getObserverDisconnects(), overviewCacheCheckCount };
    }
    function rearmAbortedSegment() {
      scanStates['1'].lastAttempt = -Infinity;
      globalThis.enableAbortOnDelay();
      return scanMore(1, true, 6);
    }
    ${code}
    const productionScanSegment = scanSegment;
    scanSegment = async (signal, direction) => {
      try {
        const before = { scopeIsReplacement: collection.scope === globalThis.nextScope,
          scrollerIsReplacement: scanScroller === globalThis.nextScroller, sourcePosition: sourcePosition(),
          cursor: scanStates[direction].cursor };
        const result = productionScanSegment(signal, direction);
        if (watchAutomaticRescan) {
          automaticScanStarts.push({ before, scopeIsReplacement: collection.scope === globalThis.nextScope,
            scrollerIsReplacement: scanScroller === globalThis.nextScroller, cursor: scanStates[direction].cursor,
            direction, sourcePosition: sourcePosition() });
          if (automaticScanStarts.length === 2) abortCurrent();
        }
        return await result;
      }
      catch (error) { globalThis.lastScanError = String(error?.stack || error); throw error; }
    };
    globalThis.abortCurrent = abortCurrent;
    globalThis.startScan = start;
    globalThis.beginFromCacheCheck = () => { watchAutomaticRescan = true; globalThis.setTestClock(1000); checkOverviewCache(false); return Boolean(scanPromise); };
    globalThis.automaticRescanEvidence = () => ({ starts: automaticScanStarts.slice(), checks: overviewCheckCalls,
      timerCallbacks: overviewCacheCheckCount, scopeIsReplacement: collection.scope === globalThis.nextScope,
      scrollerIsReplacement: scanScroller === globalThis.nextScroller, cursor: scanStates[1].cursor,
      oldScrollerConnected: globalThis.scroller.isConnected, rootPageY: globalThis.getRootPageY(),
      entries: entries.map(entry => entry.key) });
    globalThis.exitAbort = () => exitOverview(false);
    globalThis.closeAbort = () => close({ type: 'pagehide' });
    globalThis.snapshot = snapshot;
    globalThis.getScanPromise = () => scanPromise;
    globalThis.rearmAbortedSegment = rearmAbortedSegment;
    globalThis.runSegment = side => scanSegment(new AbortController().signal, side);
    globalThis.refreshActiveScroller = () => refreshScanScroller();
    globalThis.reenterCacheCheck = () => {
      overviewItems[0].entry = { key: 'resolved-entry' }; globalThis.slot.pending = false;
      globalThis.setTestClock(1000); overviewOpen = true; checkOverviewCache(false);
      return { scrollTopAfterCheck: scanScroller.scrollTop, scanStarted: Boolean(scanPromise), direction: scanningDirection,
        cursor: scanStates[1].cursor, slotAttempts: scanStates[1].slotAttempts.get('pending-slot') || 0 };
    };
    globalThis.advanceClock = value => { globalThis.setTestClock(value); };
    globalThis.prepareReentry = () => {
      overviewItems[0].entry = { key: 'resolved-entry' }; globalThis.slot.pending = false;
      globalThis.setTestClock(1000); overviewOpen = true; checkOverviewCache(false);
      return { scrollTopAfterCheck: scanScroller.scrollTop, scanStarted: Boolean(scanPromise), direction: scanningDirection };
    };
    globalThis.slotStillPending = side => overviewSlotPending(overviewItems[0], side);
  `, context);
  return context;
}

function verifyProductionGalleryMerge() {
  const context = vm.createContext({ URL, document: { baseURI: 'https://fixture.invalid/' }, ImageLens: {} });
  vm.runInContext(gallerySource, context);
  const entry = (name, thumb = name) => ({ key: `https://img.example.test/${name}.jpg`,
    sources: [`https://img.example.test/${name}.jpg`], thumb: `https://img.example.test/${thumb}.jpg` });
  const existing = [entry('a'), entry('b'), entry('c')];
  const partial = context.ImageLens.gallery.mergeEntries(existing, [entry('b', 'b-updated'), entry('d'), entry('c')], 1);
  assert.deepEqual(Array.from(partial, item => item.key), [
    'https://img.example.test/a.jpg', 'https://img.example.test/b.jpg',
    'https://img.example.test/d.jpg', 'https://img.example.test/c.jpg'
  ], 'real gallery merge retains old discoveries and inserts a new item beside matching anchors');
  assert.equal(partial[1], existing[1], 'matched entry object remains stable');
  assert.equal(partial[1].thumb, 'https://img.example.test/b-updated.jpg', 'matched source update is applied to retained entry');
  const appended = context.ImageLens.gallery.mergeEntries(partial, [entry('x'), entry('y')], 1);
  assert.deepEqual(Array.from(appended, item => item.key), [...Array.from(partial, item => item.key),
    'https://img.example.test/x.jpg', 'https://img.example.test/y.jpg'], 'non-overlapping virtual window appends without dropping prior entries');
  const prepended = context.ImageLens.gallery.mergeEntries(appended, [entry('z'), entry('w')], -1);
  assert.deepEqual(Array.from(prepended, item => item.key), ['https://img.example.test/z.jpg', 'https://img.example.test/w.jpg',
    ...Array.from(appended, item => item.key)], 'reverse non-overlapping virtual window prepends in source order');
  return { partialKeys: Array.from(partial, item => item.key), appendedCount: appended.length, prependedCount: prepended.length };
}


test('an aborted segment restores its saved cursor and leaves an unresolved slot retryable', async () => {
  const fixture = makeHarness({ abortOnTimer: true, abortDelayNumber: 2, sourceLoadingOnPoll: true, initialCursor: 300 });
  const scan = fixture.startScan(1);
  await scan;
  const state = fixture.snapshot(1);
  assert.equal(state.cursor, 300, 'logical cursor differs from live nested scroll and remains the saved cursor');
  assert.equal(state.sourcePosition, 500, 'the source page restores to its actual nested scroll position');
  assert.equal(state.rootPageY, 73, 'root page position is preserved independently');
  assert.equal(state.slotAttempts, 0, 'an interrupted trigger does not consume a retry');
  assert.equal(state.sourceLoading, false);
  assert.equal(state.loadingNode, false);
  assert.equal(state.phase, 'idle');
  assert.equal(state.restoreCount, 1);
});

test('a completed segment still commits its cursor and one unresolved-slot attempt', async () => {
  const fixture = makeHarness({ abortOnTimer: false, initialCursor: 300 });
  const result = await fixture.runSegment(1);
  const state = fixture.snapshot(1);
  assert.equal(result.pending, true);
  assert.notEqual(state.cursor, 300, 'successful segment progress commits its temporary scan cursor');
  assert.equal(state.sourcePosition, 500, 'the page itself is restored after the isolated scan');
  assert.equal(state.slotAttempts, 1);
});

test('overview exit aborts scanning without scheduling another cache pass', async () => {
  const fixture = makeHarness({ abortOnTimer: false, initialCursor: 300 });
  const scan = fixture.startScan(1);
  fixture.exitAbort();
  await scan;
  const state = fixture.snapshot(1);
  assert.equal(state.overviewOpen, false);
  assert.equal(state.cursor, 300);
  assert.equal(state.slotAttempts, 0);
  assert.equal(state.restoreCount, 1);
  assert.equal(state.overviewCacheCheckCount, 0);
  assert.equal(state.observerDisconnects, 1);
});

test('viewer close aborts scanning, restores the page once, and does not rescan', async () => {
  const fixture = makeHarness({ abortOnTimer: false, initialCursor: 300 });
  const scan = fixture.startScan(1);
  fixture.closeAbort();
  await scan;
  const state = fixture.snapshot(1);
  assert.equal(state.closed, true);
  assert.equal(state.cursor, 300);
  assert.equal(state.slotAttempts, 0);
  assert.equal(state.restoreCount, 1);
  assert.equal(state.overviewCacheCheckCount, 0);
  assert.equal(state.observerDisconnects, 1);
});

test('virtual scroller replacement is automatically rebound by the scheduled cache check after abort', async () => {
  const fixture = makeHarness({ abortOnTimer: true, abortDelayNumber: 2, sourceProgress: true,
    virtualizeOnRefresh: true, initialCursor: 300, seedEntries: true });
  assert.equal(fixture.beginFromCacheCheck(), true);
  await fixture.getScanPromise();
  const deadline = Date.now() + 2500;
  while (fixture.automaticRescanEvidence().starts.length < 2 && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  const during = fixture.automaticRescanEvidence();
  assert.ok(during.checks >= 2, 'the scheduled callback invoked the production cache checker again');
  assert.ok(during.timerCallbacks >= 1);
  assert.ok(during.starts.length >= 2, 'the cache checker automatically started another scan');
  assert.equal(during.starts[1].scopeIsReplacement, true);
  assert.equal(during.starts[1].scrollerIsReplacement, true, 'the production scroller refresh selected the replacement nested container');
  assert.equal(during.starts[1].sourcePosition, 240, 'the retry actually scanned using the replacement container');
  assert.equal(during.entries.length, 3, 'the production gallery merge retained prior discoveries and added the refreshed item');
  const retry = fixture.getScanPromise();
  fixture.closeAbort();
  if (retry) await retry;
  const after = fixture.automaticRescanEvidence();
  assert.equal(after.cursor, 260, 'abort rollback uses the replacement container coordinate basis');
  assert.equal(after.rootPageY, 73);
  assert.equal(after.oldScrollerConnected, false);
});

test('production gallery merge retains prior discoveries across partial and non-overlapping virtual windows', () => {
  const evidence = verifyProductionGalleryMerge();
  assert.equal(evidence.partialKeys.length, 4);
  assert.equal(evidence.appendedCount, 6);
  assert.equal(evidence.prependedCount, 8);
});

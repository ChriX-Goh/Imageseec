(() => {
  const params = new URLSearchParams(location.search);
  const gallery = document.querySelector('.gallery');
  const region = document.querySelector('#scroll-region');
  const sentinel = document.querySelector('#sentinel');
  const status = document.querySelector('#status');
  const eventLog = document.querySelector('#event-log');
  const config = PerfLazyGalleryConfig.read(params);

  const state = {
    batches: 0,
    total: 0,
    sources: 0,
    loaded: 0,
    decoded: 0,
    failed: 0,
    running: false,
    exhausted: false,
    nextId: config.firstId,
    timer: 0,
    observer: null,
    events: []
  };
  if (config.nested) region.classList.add('nested');

  const emit = (type, detail = {}) => {
    const entry = { type, time: performance.now(), ...detail };
    state.events.push(entry);
    if (state.events.length > 500) state.events.shift();
    document.dispatchEvent(new CustomEvent(`galleryperf:${type}`, { detail: entry }));
    performance.mark?.(`galleryperf:${type}`);
    const line = `${entry.time.toFixed(1)} ms  ${type}${detail.id ? ` #${detail.id}` : ''}${detail.count ? ` (${detail.count})` : ''}`;
    eventLog.textContent = [line, ...eventLog.textContent.split('\n').filter(Boolean)].slice(0, 10).join('\n');
    updateStatus();
  };

  function updateStatus() {
    const cap = config.maxBatches ? `${state.batches}/${config.maxBatches} batches` : `${state.batches} batches (unbounded)`;
    const phase = state.exhausted ? 'finite gallery complete' : state.running ? 'loading near end' : 'paused';
    status.textContent = `${phase} · ${cap} · ${state.total} slots · ${state.sources} sources · ${state.loaded} loaded · ${state.decoded} decoded · ${state.failed} failed${config.nested ? ' · nested scroller' : ''}`;
  }

  function assignSource(image, id) {
    if (image.dataset.sourceAssigned === 'true') return;
    image.dataset.sourceAssigned = 'true';
    image.dataset.src = `/image/${id}?delay=${config.imageDelay}&fixture=${id}`;
    state.sources++;
    emit('source', { id, assigned: state.sources });
    image.src = image.dataset.src;
  }

  function makeItem(id) {
    const item = document.createElement('article');
    item.className = 'gallery-item';
    item.dataset.id = String(id);
    const frame = document.createElement('div');
    frame.className = 'frame';
    const image = document.createElement('img');
    image.alt = `Generated image ${id}`;
    image.loading = 'eager';
    image.decoding = 'async';
    image.draggable = false;
    image.dataset.id = String(id);
    image.addEventListener('load', async () => {
      state.loaded++;
      emit('load', { id, loaded: state.loaded });
      try {
        await image.decode();
        state.decoded++;
        emit('decode', { id, decoded: state.decoded });
      } catch {
        // A decoded image can be evicted between load and decode; keep the
        // failure separate from source discovery and network completion.
        emit('decode-error', { id });
      }
    }, { once: true });
    image.addEventListener('error', () => {
      state.failed++;
      emit('error', { id, failed: state.failed });
    }, { once: true });
    frame.append(image);
    const caption = document.createElement('div');
    caption.className = 'caption';
    caption.textContent = `Image ${id}`;
    item.append(frame, caption);
    if (config.sourceDelay) {
      window.setTimeout(() => assignSource(image, id), config.sourceDelay);
    } else assignSource(image, id);
    return item;
  }

  function appendBatch(count = config.batch) {
    if (config.maxBatches && state.batches >= config.maxBatches) {
      state.exhausted = true;
      state.running = false;
      updateStatus();
      return 0;
    }
    const actual = Math.max(1, Math.min(200, Math.floor(count)));
    const fragment = document.createDocumentFragment();
    for (let n = 0; n < actual; n++) fragment.append(makeItem(state.nextId++));
    gallery.append(fragment);
    state.total += actual;
    state.batches++;
    emit('batch', { count: actual, total: state.total, batches: state.batches });
    if (config.maxBatches && state.batches >= config.maxBatches) {
      state.exhausted = true;
      state.running = false;
    }
    return actual;
  }

  function scrollport() {
    return config.nested ? region : document.scrollingElement;
  }

  function nearEnd() {
    const target = config.nested ? region.getBoundingClientRect() : { top: 0, bottom: innerHeight };
    return sentinel.getBoundingClientRect().top <= target.bottom + config.rootMargin;
  }

  function scheduleBatch() {
    if (!state.running || state.exhausted || state.timer || !nearEnd()) return;
    state.timer = window.setTimeout(() => {
      state.timer = 0;
      if (!state.running || state.exhausted || !nearEnd()) return;
      const added = appendBatch();
      if (added && state.running && nearEnd()) scheduleBatch();
    }, config.interval);
  }

  function start() {
    if (state.exhausted) return false;
    state.running = true;
    emit('start', { mode: config.mode });
    scheduleBatch();
    return true;
  }

  function stop() {
    state.running = false;
    if (state.timer) window.clearTimeout(state.timer);
    state.timer = 0;
    emit('pause');
  }

  function onScroll() {
    if (state.running) scheduleBatch();
  }

  state.observer = new IntersectionObserver(records => {
    if (records.some(record => record.isIntersecting) && state.running) scheduleBatch();
  }, { root: config.nested ? region : null, rootMargin: `${config.rootMargin}px 0px` });
  state.observer.observe(sentinel);
  (config.nested ? region : window).addEventListener('scroll', onScroll, { passive: true });

  document.querySelector('#append-one').addEventListener('click', () => appendBatch());
  document.querySelector('#start-auto').addEventListener('click', start);
  document.querySelector('#stop-auto').addEventListener('click', stop);
  document.querySelector('#open-viewer').addEventListener('click', () => {
    const source = gallery.querySelector('img[src]')?.currentSrc;
    if (source && window.ImageLens) ImageLens.open(source, ImageLens.settings.defaults);
  });

  appendBatch(config.initial);
  if (config.autoStart) start();
  updateStatus();

  window.PerfLazyGallery = Object.freeze({
    config: Object.freeze({ ...config }),
    state,
    appendBatch,
    start,
    stop,
    nearEnd,
    scrollport
  });
})();

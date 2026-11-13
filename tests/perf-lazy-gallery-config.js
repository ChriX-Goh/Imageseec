(() => {
  function number(params, name, fallback, min = 0, max = 100000) {
    const raw = params.get(name);
    if (raw === null || raw.trim() === '') return fallback;
    const value = Number(raw);
    return Number.isFinite(value) ? Math.max(min, Math.min(max, Math.floor(value))) : fallback;
  }

  function read(params) {
    const mode = params.get('mode') === 'continuous' ? 'continuous' : 'finite';
    return {
      mode,
      initial: number(params, 'initial', 12, 1, 200),
      batch: number(params, 'batch', 8, 1, 100),
      maxBatches: number(params, 'maxBatches', mode === 'continuous' ? 0 : 8, 0, 100000),
      interval: number(params, 'interval', 100, 0, 10000),
      rootMargin: number(params, 'rootMargin', 900, 0, 10000),
      sourceDelay: number(params, 'sourceDelay', 0, 0, 60000),
      imageDelay: number(params, 'imageDelay', 0, 0, 10000),
      nested: params.get('nested') === '1',
      autoStart: params.get('autoStart') !== '0',
      firstId: number(params, 'firstId', 300, 1, 100000000)
    };
  }

  window.PerfLazyGalleryConfig = Object.freeze({ number, read });
})();

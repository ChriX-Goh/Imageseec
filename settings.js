(() => {
  const lens = globalThis.ImageLens ||= {};
  const defaults = Object.freeze({ language: 'auto', zoomStep: 15, holdZoom: 200, cacheBefore: 2, cacheAfter: 2, previewBefore: 3, previewAfter: 3, overviewBuffer: 6, overviewDirection: 'vertical', overviewClean: false, dividerMin: 33, compareStep: 2, compareEnabled: false, zoomLocked: false, doubleClickExit: true, quickOpen: true });
  const languages = new Set(['auto', 'en', 'zh_CN', 'zh_TW', 'ja', 'ko', 'de', 'fr', 'es', 'ru', 'uk', 'pl']);
  const limits = { zoomStep: [1, 100], holdZoom: [100, 800], cacheBefore: [0, 12], cacheAfter: [0, 12], previewBefore: [0, 12], previewAfter: [0, 12], overviewBuffer: [0, 12], dividerMin: [10, 33], compareStep: [1, 2] };
  function normalize(value = {}) {
    value = value && typeof value === 'object' ? value : {};
    return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => {
      if (typeof fallback === 'boolean') return [key, typeof value[key] === 'boolean' ? value[key] : fallback];
      if (typeof fallback === 'string') return [key, (key === 'language' ? languages.has(value[key]) : ['vertical', 'horizontal'].includes(value[key])) ? value[key] : fallback];
      const n = Number(value[key]);
      return [key, value[key] === undefined || value[key] === null || value[key] === '' || !Number.isFinite(n)
        ? fallback : Math.round(Math.max(limits[key][0], Math.min(limits[key][1], n)))];
    }));
  }
  lens.settings = { defaults, normalize };
})();

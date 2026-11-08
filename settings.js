(() => {
  const lens = globalThis.ImageLens ||= {};
  const defaults = Object.freeze({ language: 'auto', zoomStep: 15, holdZoom: 200, cacheBefore: 2, cacheAfter: 2, previewBefore: 3, previewAfter: 3, overviewCacheBeforeMode: 'auto', overviewCacheBefore: 12, overviewCacheAfterMode: 'auto', overviewCacheAfter: 12, overviewDirection: 'vertical', overviewAlignment: 'auto', overviewGap: 12, overviewClean: false, dividerMin: 33, compareStep: 2, compareEnabled: false, zoomLocked: false, doubleClickExit: true, quickOpen: true });
  const languages = new Set(['auto', 'en', 'zh_CN', 'zh_TW', 'ja', 'ko', 'de', 'fr', 'es', 'ru', 'uk', 'pl']);
  const enums = { language: languages, overviewCacheBeforeMode: new Set(['auto', 'custom']), overviewCacheAfterMode: new Set(['auto', 'custom']), overviewDirection: new Set(['vertical', 'horizontal']), overviewAlignment: new Set(['auto', 'vertical', 'horizontal']) };
  const limits = { zoomStep: [1, 100], holdZoom: [100, 800], cacheBefore: [0, 12], cacheAfter: [0, 12], previewBefore: [0, 12], previewAfter: [0, 12], overviewGap: [0, 48], dividerMin: [10, 33], compareStep: [1, 2] };
  const unboundedCounts = new Set(['overviewCacheBefore', 'overviewCacheAfter']);
  function normalize(value = {}) {
    value = value && typeof value === 'object' ? value : {};
    if (value.overviewCacheAfterMode === undefined && value.overviewCacheAfter === undefined && value.overviewBuffer !== undefined) {
      const legacy = Number(value.overviewBuffer);
      if (Number.isFinite(legacy) && Math.round(legacy) !== 6) {
        value = { ...value, overviewCacheAfterMode: 'custom', overviewCacheAfter: Math.max(0, Math.round(legacy)) };
      }
    }
    return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => {
      if (typeof fallback === 'boolean') return [key, typeof value[key] === 'boolean' ? value[key] : fallback];
      if (typeof fallback === 'string') return [key, enums[key].has(value[key]) ? value[key] : fallback];
      const n = Number(value[key]);
      if (unboundedCounts.has(key)) return [key, value[key] === undefined || value[key] === null || value[key] === '' || !Number.isFinite(n)
        ? fallback : Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.round(n)))];
      return [key, value[key] === undefined || value[key] === null || value[key] === '' || !Number.isFinite(n)
        ? fallback : Math.round(Math.max(limits[key][0], Math.min(limits[key][1], n)))];
    }));
  }
  lens.settings = { defaults, normalize };
})();

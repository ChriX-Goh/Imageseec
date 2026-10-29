(() => {
  const lens = globalThis.ImageLens ||= {};
  const defaults = Object.freeze({ zoomStep: 15, holdZoom: 200, cacheBefore: 2, cacheAfter: 2, previewBefore: 3, previewAfter: 3, zoomLocked: false, doubleClickExit: true, quickOpen: true });
  const limits = { zoomStep: [1, 100], holdZoom: [100, 800], cacheBefore: [0, 12], cacheAfter: [0, 12], previewBefore: [0, 12], previewAfter: [0, 12] };
  function normalize(value = {}) {
    value = value && typeof value === 'object' ? value : {};
    return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => {
      if (typeof fallback === 'boolean') return [key, typeof value[key] === 'boolean' ? value[key] : fallback];
      const n = Number(value[key]);
      return [key, value[key] === undefined || value[key] === null || value[key] === '' || !Number.isFinite(n)
        ? fallback : Math.round(Math.max(limits[key][0], Math.min(limits[key][1], n)))];
    }));
  }
  lens.settings = { defaults, normalize };
})();

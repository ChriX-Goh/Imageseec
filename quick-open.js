(() => {
  // The lightweight entry point runs before the viewer modules are needed.
  const lens = globalThis.ImageLens ||= {};
  lens.quickOpenController?.abort();
  const controller = new AbortController();
  lens.quickOpenController = controller;
  let enabled = false;
  chrome.storage.local.get('settings').then(({ settings }) => { enabled = settings?.quickOpen !== false; }).catch(() => {});
  const changed = (changes, area) => { if (area === 'local' && changes.settings) enabled = changes.settings.newValue?.quickOpen !== false; };
  chrome.storage.onChanged.addListener(changed);
  controller.signal.addEventListener('abort', () => chrome.storage.onChanged.removeListener(changed));
  const imageFor = event => {
    if (!enabled || event.button !== 0 || !event.ctrlKey || event.altKey || event.metaKey) return null;
    const path = event.composedPath();
    if (path.some(node => node.id === 'image-lens-viewer')) return null;
    return path.find(node => node.tagName === 'IMG') || null;
  };
  window.addEventListener('mousedown', event => { if (imageFor(event)) { event.preventDefault(); event.stopImmediatePropagation(); } }, { capture: true, signal: controller.signal });
  window.addEventListener('click', event => {
    const image = imageFor(event);
    if (!image) return;
    const value = image.currentSrc || image.src || image.getAttribute('data-src');
    let source;
    try {
      const url = new URL(value, document.baseURI);
      if (!value || (!['http:', 'https:', 'file:', 'blob:'].includes(url.protocol) && !/^data:image\//i.test(value))) return;
      source = url.href;
    } catch { return; }
    event.preventDefault(); event.stopImmediatePropagation();
    chrome.runtime.sendMessage({ type: 'lens-quick-open', source }).catch(() => {});
  }, { capture: true, signal: controller.signal });
})();

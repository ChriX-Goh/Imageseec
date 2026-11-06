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
    const direct = path.find(node => node?.tagName === 'IMG');
    if (direct && sourceFor(direct)) return direct;
    if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY) ||
      path.some(node => /^(BUTTON|INPUT|TEXTAREA|SELECT)$/.test(node?.tagName) || node?.isContentEditable)) return null;
    for (const node of path) {
      if (/^(MAIN|BODY|HTML)$/.test(node?.tagName)) break;
      if (!node?.querySelectorAll) continue;
      const images = node.querySelectorAll('img');
      if (images.length > 8) break;
      const underneath = [...images].filter(image => {
        const rect = image.getBoundingClientRect();
        const style = getComputedStyle(image);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && sourceFor(image) &&
          rect.width >= 72 && rect.height >= 72 && event.clientX >= rect.left && event.clientX <= rect.right &&
          event.clientY >= rect.top && event.clientY <= rect.bottom;
      });
      if (underneath.length === 1) return underneath[0];
      if (underneath.length > 1) return null;
      if (!images.length && node.getBoundingClientRect) {
        const rect = node.getBoundingClientRect();
        if (node.hasAttribute('data-bg') || node.hasAttribute('data-background') || node.hasAttribute('data-background-image') ||
          (rect.width >= 72 && rect.height >= 72 && /url\s*\(/i.test(getComputedStyle(node).backgroundImage || ''))) return node;
      }
    }
    return null;
  };
  const bestSrcset = value => {
    if (!value || value.startsWith('data:')) return '';
    return value.split(',').map(part => {
      const [candidate, descriptor = '1'] = part.trim().split(/\s+/, 2);
      return { candidate, size: parseFloat(descriptor) || 1 };
    }).filter(item => item.candidate).sort((a, b) => b.size - a.size)[0]?.candidate || '';
  };
  const imageExtension = /\.(?:avif|jpe?g|png|webp|gif|bmp|tiff?)(?:$|[?#])/i;
  const imageUrlParameters = new Set(['mediaurl', 'imgurl', 'imageurl', 'imagesrc', 'original', 'originalurl', 'originalimage', 'originalimageurl', 'fullimage', 'fullimageurl', 'fullsrc', 'fullsizeimage', 'contenturl', 'asseturl', 'fileurl', 'downloadurl']);
  const linkedImageSource = value => {
    if (!value) return '';
    try {
      const link = new URL(value, document.baseURI);
      if (!['http:', 'https:', 'file:', 'blob:'].includes(link.protocol)) return '';
      if (imageExtension.test(link.pathname)) return link.href;
      for (const [name, candidate] of link.searchParams) {
        if (!imageUrlParameters.has(name.toLowerCase().replace(/[-_]/g, ''))) continue;
        try {
          const image = new URL(candidate, link.href);
          if (['http:', 'https:', 'file:', 'blob:'].includes(image.protocol)) return image.href;
        } catch { /* try another page-supplied image parameter */ }
      }
      const wrapped = link.searchParams.get('url');
      if (wrapped) {
        const image = new URL(wrapped, link.href);
        if (['http:', 'https:', 'file:', 'blob:'].includes(image.protocol) && imageExtension.test(image.pathname)) return image.href;
      }
    } catch { /* try the image element's own sources */ }
    return '';
  };
  const sourceFor = image => {
    if (!image) return '';
    const link = image.tagName === 'IMG' ? linkedImageSource(image.closest?.('a[href]')?.href) : '';
    const values = image.tagName === 'IMG'
      ? [link, image.getAttribute('data-original'), image.getAttribute('data-original-src'), image.getAttribute('data-full'), image.getAttribute('data-full-src'), image.getAttribute('data-large-file'), image.getAttribute('data-src'), image.getAttribute('data-lazy-src'), bestSrcset(image.getAttribute('data-srcset')), bestSrcset(image.getAttribute('data-lazy-srcset')), image.currentSrc || image.src, image.getAttribute('src')]
      : [image.getAttribute('data-bg'), image.getAttribute('data-background'), image.getAttribute('data-background-image'), getComputedStyle(image).backgroundImage];
    for (const value of values) {
      if (!value) continue;
      const match = value.match(/url\(\s*["']?(.*?)["']?\s*\)/i);
      const candidate = match ? match[1] : value;
      if (/^data:image\//i.test(candidate) && image.complete && image.naturalWidth > 0 && image.naturalWidth <= 2 && image.naturalHeight <= 2) continue;
      try {
        const parsed = new URL(candidate, document.baseURI);
        if (['http:', 'https:', 'file:', 'blob:'].includes(parsed.protocol) || /^data:image\//i.test(candidate)) return parsed.href;
      } catch { /* try the next conventional source */ }
    }
    return '';
  };
  window.addEventListener('mousedown', event => { if (imageFor(event)) { event.preventDefault(); event.stopImmediatePropagation(); } }, { capture: true, signal: controller.signal });
  window.addEventListener('click', event => {
    const image = imageFor(event);
    if (!image) return;
    const source = sourceFor(image);
    if (!source) return;
    event.preventDefault(); event.stopImmediatePropagation();
    chrome.runtime.sendMessage({ type: 'lens-quick-open', source }).catch(() => {});
  }, { capture: true, signal: controller.signal });
})();

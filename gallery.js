(() => {
  const lens = globalThis.ImageLens ||= {};
  const unique = values => [...new Set(values.filter(Boolean))];
  function url(value) {
    if (!value) return '';
    try {
      const result = new URL(value, document.baseURI);
      return /^(https?:|file:|blob:)$/.test(result.protocol) || (result.protocol === 'data:' && /^data:image\//i.test(value)) ? result.href : '';
    } catch { return ''; }
  }
  function unwrap(value) {
    try {
      const u = new URL(value);
      // Image proxies commonly carry the source in a URL parameter or as an
      // embedded absolute path. No host or provider identity is needed.
      const parameter = url(u.searchParams.get('url'));
      if (parameter) return parameter;
      const embedded = u.href.match(/\/(https?:\/\/.+)$/i);
      if (embedded) return url(embedded[1]) || value;
    } catch { /* data and malformed URLs retain their identity */ }
    return value;
  }
  function key(value) {
    try {
      const u = new URL(unwrap(value));
      // Strip only known resizing parameters, preserving signed URL authorization.
      if (u.protocol === 'data:' || u.protocol === 'blob:') return value;
      if (!/signature|token|expires|x-amz-/i.test(u.search)) {
        ['w', 'h', 'width', 'height', 'q', 'quality', 'fit', 'fm', 'auto', 'dpr'].forEach(p => u.searchParams.delete(p));
      }
      return u.href;
    } catch { return value; }
  }
  function srcset(value) {
    if (!value || value.startsWith('data:')) return [];
    const candidates = [];
    let position = 0;
    while (position < value.length) {
      while (/[\s,]/.test(value[position] || '') && position < value.length) position++;
      let source = '';
      while (position < value.length && !/\s/.test(value[position])) source += value[position++];
      let descriptor = '';
      if (/,$/.test(source)) source = source.replace(/,+$/, '');
      else {
        while (position < value.length && value[position] !== ',') descriptor += value[position++];
        position++;
      }
      if (source) candidates.push({ source: url(source), size: parseFloat(descriptor.trim()) || 1 });
    }
    return candidates.filter(p => p.source).sort((a, b) => b.size - a.size).map(p => p.source);
  }
  function sources(img) {
    const current = url(img.currentSrc || img.getAttribute('src'));
    const candidates = [];
    const anchor = img.closest('a[href]');
    if (anchor && /\.(avif|jpe?g|png|webp|gif|bmp|tiff?)(?:$|[?#])/i.test(anchor.href)) candidates.push(url(anchor.href));
    for (const name of ['data-original', 'data-full', 'data-full-src', 'data-large-file', 'data-src']) candidates.push(url(img.getAttribute(name)));
    const raw = unwrap(current);
    if (raw !== current) candidates.push(raw);
    candidates.push(...srcset(img.getAttribute('srcset')));
    if (img.parentElement?.tagName === 'PICTURE') {
      for (const source of img.parentElement.querySelectorAll('source[srcset]')) {
        if ((!source.media || matchMedia(source.media).matches) && (!source.type || /image\/(avif|webp|jpeg|png)/.test(source.type))) candidates.push(...srcset(source.srcset));
      }
    }
    candidates.push(current, url(img.getAttribute('src')));
    return unique(candidates);
  }
  function images(root = document) {
    const found = [...root.querySelectorAll('img')];
    for (const node of root.querySelectorAll('*')) if (node.shadowRoot && node.id !== 'image-lens-viewer') found.push(...images(node.shadowRoot));
    return found;
  }
  function eligible(img, seed, album = false) {
    if (img === seed) return true;
    if (img.closest('header, nav, footer, [role="navigation"]')) return false;
    // A modal may hide its background album from accessibility. A matched album
    // still has to pass geometry, CSS visibility and navigation-image filters.
    if (!album && img.closest('[aria-hidden="true"]')) return false;
    const rect = img.getBoundingClientRect();
    const style = getComputedStyle(img);
    if (style.display === 'none' || style.visibility === 'hidden' || rect.width < 72 || rect.height < 72) return false;
    if (/\b(avatar|logo|icon|emoji|badge|flag)\b/i.test(`${img.alt} ${img.className}`)) return false;
    return Boolean(url(img.currentSrc || img.getAttribute('src') || img.getAttribute('data-src')));
  }
  function makeEntry(img) {
    const variants = sources(img);
    if (!variants.length) return null;
    return { key: key(variants[0]), sources: variants, thumb: url(img.currentSrc || img.src) || variants.at(-1), title: img.alt || img.title || '', node: img };
  }
  function scopeFor(seed) {
    if (!seed) return null;
    const semantic = seed.closest('[data-gallery], [role="list"], [role="grid"], .gallery, .masonry, .photos, .photo-list, .image-grid');
    if (semantic && images(semantic).length > 1) return semantic;
    for (let parent = seed.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      const children = [...(parent.children || [])];
      const cards = children.filter(child => child.tagName === 'IMG' || images(child).length);
      // Repeated sibling cards work for CSS grid, flex, columns and virtual lists.
      if (cards.length > 1 && cards.some((child, n) => cards.slice(n + 1).some(other => other.tagName === child.tagName))) return parent;
    }
    return null;
  }
  function ordered(candidates) {
    const positions = candidates.map(img => {
      const item = img.closest('[aria-posinset], [aria-rowindex]');
      return Number(item?.getAttribute('aria-posinset') || item?.getAttribute('aria-rowindex'));
    });
    if (positions.some(n => !Number.isFinite(n) || n <= 0) || new Set(positions).size !== candidates.length) return candidates;
    return candidates.map((img, n) => ({ img, position: positions[n] })).sort((a, b) => a.position - b.position).map(item => item.img);
  }
  function collect(source, preferred = null) {
    const all = images();
    const matches = i => [i.currentSrc, i.src, ...sources(i)].some(s => s && (s === source || key(s) === key(source)));
    const seed = preferred?.isConnected && matches(preferred) ? preferred : all.find(matches);
    const modal = seed?.closest('[role="dialog"], dialog, [aria-modal="true"]');
    // Prefer a matching thumbnail in the page album over a dialog's references.
    // This requires an explicit source relationship (link, srcset or image data).
    const albumSeed = modal && all.find(img => !img.closest('[role="dialog"], dialog, [aria-modal="true"]') && matches(img) && scopeFor(img));
    const selected = albumSeed || seed;
    const scope = scopeFor(selected);
    const candidates = ordered(scope ? images(scope) : all);
    const entries = [];
    const seen = new Set();
    for (const img of candidates) {
      if (!eligible(img, selected, Boolean(scope))) continue;
      const entry = makeEntry(img);
      if (!entry || seen.has(entry.key)) continue;
      seen.add(entry.key); entries.push(entry);
    }
    const seedEntry = selected && makeEntry(selected);
    const sourceKey = seedEntry?.key || key(source);
    let index = entries.findIndex(e => e.key === sourceKey);
    if (index < 0) {
      entries.unshift(seedEntry || { key: sourceKey, sources: [source], thumb: source, title: '', node: null }); index = 0;
    }
    return { entries, index, seed: selected, adapter: lens.i18n.text('galleryGeneric') };
  }
  lens.gallery = { url, key, sources, collect };
})();

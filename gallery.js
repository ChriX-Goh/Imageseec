(() => {
  const lens = globalThis.ImageLens ||= {};
  const unique = values => [...new Set(values.filter(Boolean))];
  const sourceAttributes = [
    'data-original', 'data-original-src', 'data-full', 'data-full-src', 'data-large-file',
    'data-src', 'data-lazy-src', 'data-image', 'data-image-src', 'data-url'
  ];
  const srcsetAttributes = ['srcset', 'data-srcset', 'data-lazy-srcset', 'data-original-srcset'];
  const backgroundAttributes = ['data-bg', 'data-background', 'data-background-image'];
  const imageUrlParameters = new Set(['mediaurl', 'imgurl', 'imageurl', 'imagesrc', 'original', 'originalurl', 'originalimage', 'originalimageurl', 'fullimage', 'fullimageurl', 'fullsrc', 'fullsizeimage', 'contenturl', 'asseturl', 'fileurl', 'downloadurl']);
  const observedAttributes = unique(['src', ...srcsetAttributes, ...sourceAttributes, ...backgroundAttributes, 'style', 'class']);

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
      for (const [name, candidate] of u.searchParams) {
        if (!imageUrlParameters.has(name.toLowerCase().replace(/[-_]/g, ''))) continue;
        const image = url(candidate);
        if (image) return image;
      }
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
      while (/[,\s]/.test(value[position] || '') && position < value.length) position++;
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
  function cssUrls(value) {
    if (!value || value === 'none') return [];
    const found = [...value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)].map(match => url(match[2]));
    return unique(found);
  }
  function backgroundSources(node) {
    const candidates = [];
    for (const name of backgroundAttributes) {
      const value = node.getAttribute?.(name);
      candidates.push(...cssUrls(value), ...(value && !/url\s*\(/i.test(value) ? [url(value)] : []));
    }
    const inlineBackground = node.style?.backgroundImage;
    const styleValue = inlineBackground && inlineBackground !== 'none' ? inlineBackground : getComputedStyle(node).backgroundImage;
    candidates.push(...cssUrls(styleValue));
    return unique(candidates);
  }
  function sources(node) {
    if (!node) return [];
    if (node.tagName !== 'IMG') return backgroundSources(node);
    const current = url(node.currentSrc || node.getAttribute('src'));
    const candidates = [];
    const anchor = node.closest('a[href]');
    if (anchor) {
      const linked = url(anchor.href);
      const resolved = linked && url(unwrap(linked));
      if (resolved && (resolved !== linked || /\.(avif|jpe?g|png|webp|gif|bmp|tiff?)(?:$|[?#])/i.test(linked))) candidates.push(resolved);
    }
    for (const name of sourceAttributes) candidates.push(url(node.getAttribute(name)));
    const raw = unwrap(current);
    if (raw !== current) candidates.push(raw);
    for (const name of srcsetAttributes) candidates.push(...srcset(node.getAttribute(name)));
    const picture = node.closest('picture');
    if (picture) {
      for (const source of picture.querySelectorAll('source')) {
        if ((!source.media || matchMedia(source.media).matches) && (!source.type || /image\/(avif|webp|jpeg|png)/.test(source.type))) {
          for (const name of srcsetAttributes) candidates.push(...srcset(source.getAttribute(name)));
          for (const name of sourceAttributes) candidates.push(url(source.getAttribute(name)));
        }
      }
    }
    candidates.push(current, url(node.getAttribute('src')));
    return unique(candidates).filter(value => !(/^data:image\//i.test(value) && node.complete &&
      node.naturalWidth > 0 && node.naturalWidth <= 2 && node.naturalHeight <= 2));
  }
  function images(root = document) {
    const found = [...root.querySelectorAll('img')];
    for (const node of root.querySelectorAll('*')) if (node.shadowRoot && node.id !== 'image-lens-viewer') found.push(...images(node.shadowRoot));
    return found;
  }
  function mediaNodes(root = document, includeBackgrounds = true, viewportOnly = false) {
    const found = [...images(root)];
    if (!includeBackgrounds) return unique(found);
    const all = [...root.querySelectorAll('*')];
    for (const node of all) {
      if (node.tagName === 'IMG' || node.id === 'image-lens-viewer' || node.closest?.('#image-lens-viewer')) continue;
      const rect = node.getBoundingClientRect();
      if (viewportOnly && (rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth)) continue;
      const hasData = [...sourceAttributes, ...srcsetAttributes, ...backgroundAttributes].some(name => node.hasAttribute?.(name));
      const isImageRole = node.getAttribute?.('role') === 'img';
      const styleHasBackground = /url\s*\(/i.test(node.style?.backgroundImage || '');
      // Class-applied backgrounds have no image attribute. Check computed style only
      // for reasonably sized candidates, and restrict page-wide discovery to the viewport.
      if (!isImageRole && !styleHasBackground && !hasData &&
        (rect.width < 72 || rect.height < 72 || !/url\s*\(/i.test(getComputedStyle(node).backgroundImage || ''))) continue;
      if (sources(node).length) found.push(node);
    }
    return unique(found);
  }
  function isVisibleCandidate(node) {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width >= 72 && rect.height >= 72;
  }
  function cardHasMedia(card) {
    if (card.tagName === 'IMG' || card.getAttribute?.('role') === 'img') return true;
    if (backgroundSources(card).length) return true;
    if (card.querySelector?.('img, [role="img"], [data-bg], [data-background], [data-background-image], [data-image], [data-image-src]')) return true;
    const descendants = card.querySelectorAll?.('*');
    return [...(descendants?.length ? descendants : card.children || [])].some(child => child.tagName === 'IMG' || child.getAttribute?.('role') === 'img' || backgroundSources(child).length);
  }
  function repeatedCards(parent) {
    const cards = [...(parent.children || [])].filter(cardHasMedia);
    if (cards.length < 2) return false;
    const tags = new Map();
    for (const card of cards) tags.set(card.tagName, (tags.get(card.tagName) || 0) + 1);
    if ([...tags.values()].some(count => count >= 2)) return true;
    const roles = new Map();
    for (const card of cards) {
      const role = card.getAttribute?.('role');
      if (role) roles.set(role, (roles.get(role) || 0) + 1);
    }
    return [...roles.values()].some(count => count >= 2);
  }
  function repeatedMediaCards(parent) {
    const cards = [...(parent.children || [])].filter(cardHasMedia);
    if (cards.length < 2) return false;
    const representatives = cards.map(card => card.tagName === 'IMG' || card.getAttribute?.('role') === 'img' ? card : mediaNodes(card).find(isVisibleCandidate)).filter(Boolean);
    return representatives.length >= 2 && new Set(representatives.map(node => key(sources(node)[0]))).size >= 2;
  }
  function linkedImageCards(parent) {
    const cards = [...(parent.children || [])].filter(card => {
      if (!cardHasMedia(card)) return false;
      const node = card.tagName === 'IMG' || card.getAttribute?.('role') === 'img' ? card : mediaNodes(card).find(isVisibleCandidate);
      const link = card.querySelector?.('a[href]') || node?.closest?.('a[href]');
      return node && link && linkedSource(link.href);
    });
    if (cards.length < 2 || cards.length !== parent.children.length) return false;
    const identities = cards.map(card => {
      const node = card.tagName === 'IMG' || card.getAttribute?.('role') === 'img' ? card : mediaNodes(card).find(isVisibleCandidate);
      const link = card.querySelector?.('a[href]') || node?.closest?.('a[href]');
      return key(linkedSource(link.href) || sources(node)[0]);
    });
    return new Set(identities).size >= 2;
  }
  function nestedGalleryRows(parent) {
    const children = [...(parent.children || [])];
    const cards = children.filter(cardHasMedia);
    if (cards.length < 2 || cards.length / Math.max(1, children.length) < .65) return false;
    const rows = cards.map(card => {
      const media = mediaNodes(card).filter(isVisibleCandidate);
      return { card, media };
    }).filter(row => row.media.length >= 2 && repeatedCards(row.card));
    if (rows.length < 2 || rows.length / cards.length < .75) return false;
    const keys = rows.flatMap(row => row.media.map(node => key(sources(node)[0]))).filter(Boolean);
    return keys.length >= 4 && new Set(keys).size >= 4 && keys.length <= 240;
  }
  function linkedSource(value) {
    try {
      const u = new URL(value);
      for (const [name, candidate] of u.searchParams) {
        if (!imageUrlParameters.has(name.toLowerCase().replace(/[-_]/g, ''))) continue;
        const image = url(candidate);
        if (image) return image;
      }
      return '';
    } catch { return ''; }
  }
  function scopeFor(seed) {
    if (!seed) return null;
    const semantic = seed.closest('[data-gallery], [role="list"], [role="grid"], [aria-roledescription*="gallery" i], .gallery, .masonry, .photos, .photo-list, .image-grid');
    if (semantic && mediaNodes(semantic).length > 1) return semantic;
    // Gallery cards can have different tags at each level (anchor/div/list item).
    // Find a bounded parent whose direct children resolve to distinct image cards.
    let structuralScope = null;
    for (let parent = seed.parentElement; parent && parent !== document.body && parent !== document.documentElement; parent = parent.parentElement) {
      if (nestedGalleryRows(parent)) return parent;
      if (!structuralScope && (repeatedMediaCards(parent) || linkedImageCards(parent))) structuralScope = parent;
    }
    if (structuralScope) return structuralScope;
    for (let parent = seed.parentElement; parent && parent !== document.body && parent !== document.documentElement; parent = parent.parentElement) {
      if (repeatedCards(parent)) return parent;
    }
    // A final structural/geometry pass handles galleries without semantic classes or repeated tags.
    for (let parent = seed.parentElement; parent && parent !== document.body && parent !== document.documentElement; parent = parent.parentElement) {
      const candidates = mediaNodes(parent).filter(isVisibleCandidate);
      if (candidates.length < 2) continue;
      const seedRect = seed.getBoundingClientRect();
      const near = candidates.filter(node => {
        const rect = node.getBoundingClientRect();
        return Math.abs(rect.top - seedRect.top) < Math.max(rect.height, seedRect.height) * 6 ||
          Math.abs(rect.left - seedRect.left) < Math.max(rect.width, seedRect.width) * 6;
      });
      if (near.length >= 2 && near.length <= Math.max(48, candidates.length * .8)) return parent;
    }
    return null;
  }
  function eligible(node, seed, album = false) {
    if (node === seed) return true;
    if (node.closest('header, nav, footer, [role="navigation"]')) return false;
    if (!album && node.closest('[aria-hidden="true"]')) return false;
    if (!isVisibleCandidate(node) || !sources(node).length) return false;
    const labels = `${node.alt || ''} ${node.title || ''} ${node.className || ''} ${node.getAttribute?.('aria-label') || ''}`;
    if (/\b(avatar|logo|icon|emoji|badge|flag|sprite|toolbar)\b/i.test(labels)) return false;
    return true;
  }
  function thumbSource(node, variants) {
    const current = url(node.currentSrc || node.getAttribute?.('src'));
    const placeholder = value => !value || /^data:image\/(?:gif|svg\+xml)/i.test(value) ||
      (value === current && node.tagName === 'IMG' && node.complete && node.naturalWidth > 0 && node.naturalWidth < 32);
    if (!placeholder(current)) return current;
    if (node.tagName === 'IMG') {
      const candidates = [];
      for (const name of srcsetAttributes) candidates.push(...srcset(node.getAttribute(name)).slice().reverse());
      const lazy = candidates.find(value => !placeholder(value));
      if (lazy) return lazy;
      for (const name of [...sourceAttributes, 'src']) {
        const value = url(node.getAttribute(name));
        if (!placeholder(value)) return value;
      }
    }
    return variants.at(-1) || variants[0] || '';
  }
  function makeEntry(node) {
    const variants = sources(node);
    if (!variants.length) return null;
    const first = variants.find(value => !/^data:image\/(?:gif|svg\+xml)/i.test(value)) || variants[0];
    const rect = node.getBoundingClientRect?.() || {};
    const knownSize = node.naturalWidth > 2 && node.naturalHeight > 2;
    const width = knownSize ? node.naturalWidth : rect.width || 1, height = knownSize ? node.naturalHeight : rect.height || 1;
    return {
      key: key(first), sources: variants, thumb: thumbSource(node, variants),
      title: node.alt || node.title || node.getAttribute?.('aria-label') || '', aspectRatio: width / height,
      dimensions: knownSize ? [node.naturalWidth, node.naturalHeight] : null, node
    };
  }
  function ordered(candidates) {
    const positions = candidates.map(node => {
      const item = node.closest('[aria-posinset], [aria-rowindex]');
      return Number(item?.getAttribute('aria-posinset') || item?.getAttribute('aria-rowindex'));
    });
    if (positions.some(n => !Number.isFinite(n) || n <= 0) || new Set(positions).size !== candidates.length) return candidates;
    return candidates.map((node, index) => ({ node, position: positions[index] })).sort((a, b) => a.position - b.position).map(item => item.node);
  }
  function collect(source, preferred = null, scopeHint = null) {
    const allImages = images();
    const allMedia = mediaNodes(document, true, true);
    const matches = node => [node.currentSrc, node.src, ...sources(node)].some(value => value && (value === source || key(value) === key(source)));
    const seed = preferred?.isConnected && matches(preferred) ? preferred : [...allImages, ...allMedia].find(matches);
    const modal = seed?.closest('[role="dialog"], dialog, [aria-modal="true"]');
    const albumSeed = modal && [...allImages, ...allMedia].find(node => !node.closest('[role="dialog"], dialog, [aria-modal="true"]') && matches(node) && scopeFor(node));
    const selected = albumSeed || seed;
    const scope = scopeHint?.isConnected ? scopeHint : scopeFor(selected);
    // Never widen an uncertain result to the whole page; the structural passes above must find a group.
    const candidates = ordered(scope ? mediaNodes(scope) : selected ? [selected] : []);
    const entries = [];
    const seen = new Set();
    for (const node of candidates) {
      if (!eligible(node, selected, Boolean(scope))) continue;
      const entry = makeEntry(node);
      if (!entry || seen.has(entry.key)) continue;
      seen.add(entry.key); entries.push(entry);
    }
    const seedEntry = selected && makeEntry(selected);
    const sourceKey = seedEntry?.key || key(source);
    let index = entries.findIndex(entry => entry.key === sourceKey);
    if (index < 0) {
      if (seedEntry || !scope) { entries.unshift(seedEntry || { key: sourceKey, sources: [source], thumb: source, title: '', node: null }); index = 0; }
      else index = 0;
    }
    return { entries, index, seed: selected, scope, confidence: scope ? 'group' : 'seed', adapter: lens.i18n.text('galleryGeneric') };
  }
  lens.gallery = { url, key, sources, collect, scopeFor, observedAttributes };
})();

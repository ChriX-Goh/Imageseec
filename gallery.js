(() => {
  const lens = globalThis.ImageLens ||= {};
  const unique = values => [...new Set(values.filter(Boolean))];
  const sourceAttributes = [
    'data-original', 'data-original-src', 'data-full', 'data-full-src', 'data-large-file',
    'data-src', 'data-lazy-src', 'data-image', 'data-image-src', 'data-url'
  ];
  const canonicalSourceAttributes = ['data-original', 'data-original-src', 'data-full', 'data-full-src', 'data-large-file'];
  const canonicalSourceAttributeSet = new Set(canonicalSourceAttributes);
  const canonicalSourcePriority = [...canonicalSourceAttributes, 'link'];
  const srcsetAttributes = ['srcset', 'data-srcset', 'data-lazy-srcset', 'data-original-srcset'];
  const backgroundAttributes = ['data-bg', 'data-background', 'data-background-image'];
  const imageUrlParameters = new Set(['mediaurl', 'imgurl', 'imageurl', 'imagesrc', 'original', 'originalurl', 'originalimage', 'originalimageurl', 'fullimage', 'fullimageurl', 'fullsrc', 'fullsizeimage', 'contenturl', 'asseturl', 'fileurl', 'downloadurl']);
  const observedAttributes = unique(['src', ...srcsetAttributes, ...sourceAttributes, ...backgroundAttributes,
    'width', 'height', 'style', 'class', 'aria-posinset', 'aria-setsize', 'aria-rowindex']);

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
    if (value === undefined || value === null || value === '') return '';
    try {
      // Query parameters may identify the picture, even when named q or width.
      return new URL(unwrap(value), document.baseURI).href;
    } catch { return value; }
  }
  function canonicalIdentityFrom(candidates) {
    for (const kind of canonicalSourcePriority) {
      const values = unique(candidates.filter(candidate => candidate.kind === kind).map(candidate => key(candidate.source)));
      if (values.length > 1) return { identity: '', ambiguous: true };
      if (values.length === 1) return { identity: values[0], ambiguous: false };
    }
    return { identity: '', ambiguous: false };
  }
  function pictureSourceSelection(node, picture = node?.closest?.('picture')) {
    const current = url(node?.currentSrc);
    const fallback = new Set([...srcset(node?.getAttribute?.('srcset')), url(node?.getAttribute?.('src'))].filter(Boolean));
    if (!picture || !current) return { sources: [], fallback: fallback.has(current), attributes: [], includeVariants: false, ambiguous: false };
    const matchingSources = [...picture.querySelectorAll('source')].filter(source => {
      let mediaMatches = true;
      if (source.media) {
        try { mediaMatches = typeof matchMedia === 'function' && matchMedia(source.media).matches; }
        catch { mediaMatches = false; }
      }
      if (!mediaMatches) return false;
      // Use native srcset only. data-srcset is a page's lazy-loader hint, not
      // proof that the browser selected this source.
      return srcset(source.getAttribute('srcset')).some(candidate => url(candidate) === current);
    });
    const matchesFallback = fallback.has(current);
    const attributesFor = source => canonicalSourceAttributes.map(name => ({ kind: name, source: url(source.getAttribute(name)) })).filter(item => item.source);
    const evidence = matchingSources.map(source => {
      const attributes = attributesFor(source);
      return { attributes, identity: canonicalIdentityFrom(attributes) };
    });
    if (matchesFallback) return { sources: matchingSources, fallback: true, attributes: [], includeVariants: false,
      ambiguous: evidence.some(item => item.attributes.length > 0 || item.identity.ambiguous), evidence };
    if (matchingSources.length === 1) return { sources: matchingSources, fallback: false, attributes: evidence[0].attributes,
      includeVariants: !evidence[0].identity.ambiguous, ambiguous: evidence[0].identity.ambiguous, evidence };
    if (!matchingSources.length) return { sources: [], fallback: false, attributes: [], includeVariants: false, ambiguous: false, evidence };
    const sameIdentity = evidence.every(item => !item.identity.ambiguous && item.identity.identity === evidence[0].identity.identity);
    const ambiguous = !sameIdentity;
    return { sources: matchingSources, fallback: false,
      attributes: ambiguous ? [] : evidence.flatMap(item => item.attributes),
      includeVariants: !ambiguous && Boolean(evidence[0].identity.identity), ambiguous, evidence };
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
    const cached = discoveryCache?.sources.get(node);
    if (cached) return [...cached];
    if (node.tagName !== 'IMG') {
      const result = backgroundSources(node);
      discoveryCache?.sources.set(node, result);
      discoveryCache?.identitySources.set(node, [...result]);
      return [...result];
    }
    const selectedCurrent = url(node.currentSrc);
    const current = selectedCurrent || url(node.getAttribute('src'));
    const candidates = [];
    const declaredSources = [];
    const canonicalSources = [];
    const picture = node.closest('picture');
    const pictureSelection = pictureSourceSelection(node, picture);
    const suppressFallbackSources = Boolean(picture && (pictureSelection.includeVariants || pictureSelection.ambiguous ||
      pictureSelection.fallback && pictureSelection.sources.length));
    const identitySources = [];
    const anchor = node.closest('a[href]');
    if (anchor) {
      const linked = url(anchor.href);
      const resolved = linked && url(unwrap(linked));
      if (resolved && (resolved !== linked || /\.(avif|jpe?g|png|webp|gif|bmp|tiff?)(?:$|[?#])/i.test(linked))) {
        candidates.push(resolved);
        declaredSources.push(resolved);
        identitySources.push(resolved);
        canonicalSources.push({ kind: 'link', source: resolved });
      }
    }
    for (const name of sourceAttributes) {
      const value = url(node.getAttribute(name));
      candidates.push(value);
      identitySources.push(value);
      if (value) declaredSources.push(value);
      if (value && canonicalSourceAttributeSet.has(name)) canonicalSources.push({ kind: name, source: value });
    }
    const raw = unwrap(current);
    if (raw !== current) { candidates.push(raw); identitySources.push(raw); }
    if (!suppressFallbackSources) {
      for (const name of srcsetAttributes) {
        const values = srcset(node.getAttribute(name));
        candidates.push(...values);
        identitySources.push(...values);
        declaredSources.push(...values);
      }
    }
    if (pictureSelection.includeVariants) {
      for (const source of pictureSelection.sources) {
        const values = srcset(source.getAttribute('srcset'));
        candidates.push(...values);
        identitySources.push(...values);
        declaredSources.push(...values);
      }
    }
    for (const item of pictureSelection.attributes) {
      candidates.push(item.source);
      identitySources.push(item.source);
      declaredSources.push(item.source);
      canonicalSources.push(item);
    }
    candidates.push(current);
    identitySources.push(current);
    const fallbackSrc = url(node.getAttribute('src'));
    if (!suppressFallbackSources && fallbackSrc !== current) {
      candidates.push(fallbackSrc);
      identitySources.push(fallbackSrc);
    }
    const result = unique(candidates).filter(value => !(/^data:image\//i.test(value) && node.complete &&
      node.naturalWidth > 0 && node.naturalWidth <= 2 && node.naturalHeight <= 2));
    discoveryCache?.sources.set(node, result);
    discoveryCache?.identitySources.set(node, unique(identitySources).filter(value => result.includes(value)));
    discoveryCache?.declaredSources.set(node, unique(declaredSources));
    let canonicalEvidence = canonicalIdentityFrom(canonicalSources);
    if (pictureSelection.ambiguous) {
      const imageEvidence = canonicalIdentityFrom(canonicalSources.filter(item => item.kind === 'link' || canonicalSourceAttributeSet.has(item.kind) && !pictureSelection.attributes.some(selected => selected.kind === item.kind && selected.source === item.source)));
      const pictureIdentities = pictureSelection.evidence?.map(item => item.identity) || [];
      const agreesWithImage = imageEvidence.identity && pictureIdentities.every(item => !item.ambiguous && (!item.identity || item.identity === imageEvidence.identity));
      if (!agreesWithImage) canonicalEvidence = { identity: '', ambiguous: true };
      else canonicalEvidence = imageEvidence;
    }
    discoveryCache?.canonicalEvidence.set(node, canonicalEvidence);
    return [...result];
  }
  function identitySourcesFor(node) {
    const cached = discoveryCache?.identitySources.get(node);
    return cached ? [...cached] : sources(node).map(key);
  }
  function canonicalEvidenceFor(node) {
    const cached = discoveryCache?.canonicalEvidence.get(node);
    if (cached !== undefined) return cached;
    if (node?.tagName !== 'IMG') {
      const evidence = backgroundCanonicalEvidenceFor(node);
      discoveryCache?.canonicalEvidence.set(node, evidence);
      return evidence;
    }
    const result = [];
    const anchor = node.closest?.('a[href]');
    if (anchor) {
      const linked = url(anchor.href), resolved = linked && url(unwrap(linked));
      if (resolved && (resolved !== linked || /\.(avif|jpe?g|png|webp|gif|bmp|tiff?)(?:$|[?#])/i.test(linked))) result.push({ kind: 'link', source: resolved });
    }
    for (const name of canonicalSourceAttributes) result.push({ kind: name, source: url(node.getAttribute?.(name)) });
    const base = canonicalIdentityFrom(result);
    const pictureSelection = pictureSourceSelection(node);
    if (!pictureSelection.sources.length || !pictureSelection.attributes.length) {
      if (!pictureSelection.ambiguous) return base;
    }
    if (pictureSelection.ambiguous) {
      const sourceEvidence = pictureSelection.evidence?.map(item => item.identity) || [];
      const agreesWithBase = base.identity && sourceEvidence.every(item => !item.ambiguous && (!item.identity || item.identity === base.identity));
      return agreesWithBase ? base : { identity: '', ambiguous: true };
    }
    return canonicalIdentityFrom([...result, ...pictureSelection.attributes]);
  }
  function backgroundCanonicalEvidenceFor(node) {
    if (!node || node.tagName === 'IMG') return { identity: '', ambiguous: false };
    // A link can wrap several distinct media nodes (for example an IMG plus
    // CSS-background decorations or a collage). Its href identifies the link
    // target, not each non-IMG background independently. Only an explicit
    // canonical attribute on this exact node can identify its background.
    return canonicalIdentityFrom(canonicalSourceAttributes.map(name => ({
      kind: name, source: url(node.getAttribute?.(name))
    })));
  }
  let discoveryCache = null;
  function images(root = document) {
    const cached = discoveryCache?.images.get(root);
    if (cached) return [...cached];
    const found = [...root.querySelectorAll('img')];
    for (const node of root.querySelectorAll('*')) if (node.shadowRoot && node.id !== 'image-lens-viewer') found.push(...images(node.shadowRoot));
    discoveryCache?.images.set(root, found);
    return found;
  }
  function mediaNodes(root = document, includeBackgrounds = true, viewportOnly = false) {
    const cacheKey = `${includeBackgrounds}:${viewportOnly}`;
    const cached = discoveryCache?.media.get(root)?.get(cacheKey);
    if (cached) return [...cached];
    const imageList = images(root);
    if (!includeBackgrounds) return unique(imageList);
    const found = [], orderedImages = new Set();
    const visit = tree => {
      for (const node of tree.querySelectorAll('*')) {
        if (node.tagName === 'IMG') {
          found.push(node); orderedImages.add(node);
          continue;
        }
        if (node.id === 'image-lens-viewer' || node.closest?.('#image-lens-viewer')) continue;
        const rect = node.getBoundingClientRect();
        if (!viewportOnly || (rect.bottom >= 0 && rect.top <= innerHeight && rect.right >= 0 && rect.left <= innerWidth)) {
          const hasData = [...sourceAttributes, ...srcsetAttributes, ...backgroundAttributes].some(name => node.hasAttribute?.(name));
          const isImageRole = node.getAttribute?.('role') === 'img';
          const styleHasBackground = /url\s*\(/i.test(node.style?.backgroundImage || '');
          // Class-applied backgrounds have no image attribute. Check computed style only
          // for reasonably sized candidates, and restrict page-wide discovery to the viewport.
          if (isImageRole || styleHasBackground || hasData ||
            (rect.width >= 72 && rect.height >= 72 && /url\s*\(/i.test(getComputedStyle(node).backgroundImage || ''))) {
            if (sources(node).length) found.push(node);
          }
        }
        // Visit an open shadow root directly after its host during this scan.
        if (node.shadowRoot) visit(node.shadowRoot);
      }
    };
    visit(root);
    // Keep image nodes discovered by image-only test doubles or detached roots
    // that do not implement the complete descendant selector.
    for (const image of imageList) if (!orderedImages.has(image)) found.push(image);
    const result = unique(found);
    if (discoveryCache) {
      if (!discoveryCache.media.has(root)) discoveryCache.media.set(root, new Map());
      discoveryCache.media.get(root).set(cacheKey, result);
    }
    return [...result];
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
    const representatives = cards.map(card => {
      if (card.tagName === 'IMG' || card.getAttribute?.('role') === 'img') return isVisibleCandidate(card) && sources(card).length ? card : null;
      return mediaNodes(card).find(node => isVisibleCandidate(node) && sources(node).length) ||
        (isVisibleCandidate(card) && sources(card).length ? card : null);
    }).filter(Boolean);
    const identities = representatives.map(node => key(sources(node)[0])).filter(Boolean);
    return identities.length >= 2 && new Set(identities).size >= 2;
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
    }).filter(Boolean);
    return identities.length >= 2 && new Set(identities).size >= 2;
  }
  function nestedGalleryRows(parent) {
    const children = [...(parent.children || [])];
    const cards = children.filter(cardHasMedia);
    if (cards.length < 2) return false;
    const rows = cards.map(card => {
      const media = mediaNodes(card).filter(isVisibleCandidate);
      return { card, media };
    }).filter(row => row.media.length >= 2 && repeatedCards(row.card));
    if (rows.length < 2 || rows.length / cards.length < .75) return false;
    // A row-based lazy grid may reserve most rows before creating any IMG.
    // Include those rows only when their tag/classes match the populated rows.
    const representative = rows[0].card;
    const classes = String(representative.className || '').split(/\s+/).filter(Boolean);
    const sameRow = node => node.tagName === representative.tagName && (!classes.length ||
      classes.every(name => String(node.className || '').split(/\s+/).includes(name)));
    if (cards.length / Math.max(1, children.length) < .65 &&
        (!classes.length || children.filter(sameRow).length / children.length < .8)) return false;
    // Gallery size is not evidence against a repeated-row structure. Inspect
    // a bounded sample so large feeds keep their parent scope without making
    // detection proportional to every image URL in the gallery.
    const sampleCount = Math.min(24, rows.length);
    const sampleRows = Array.from({ length: sampleCount }, (_, index) => rows[
      Math.floor(index * (rows.length - 1) / Math.max(1, sampleCount - 1))
    ]);
    const keys = sampleRows.flatMap(row => row.media.slice(0, 10).map(node => key(sources(node)[0]))).filter(Boolean);
    return keys.length >= 4 && new Set(keys).size >= 4;
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
    const semantic = seed.closest('[data-gallery], [role="list"], [role="grid"], [role="feed"], [aria-roledescription*="gallery" i], .gallery, .masonry, .photos, .photo-list, .image-grid');
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
    const deferred = album && node.tagName === 'IMG' && [...sourceAttributes, ...srcsetAttributes.filter(name => name.startsWith('data-'))].some(name => node.getAttribute(name));
    if ((!isVisibleCandidate(node) && !deferred) || !sources(node).length) return false;
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
    const primaryKey = key(first);
    const aliases = unique(variants.map(key));
    const canonicalEvidence = canonicalEvidenceFor(node);
    const liveSvgSources = unique([url(node.currentSrc), url(node.getAttribute?.('src'))]
      .filter(value => /^data:image\/svg\+xml(?:[;,])/i.test(value || '')).map(key));
    const hasExplicitPrimary = (discoveryCache?.declaredSources.get(node) || [])
      .some(value => key(value) === primaryKey);
    // A shared inline SVG used as the live src is a placeholder only when an
    // explicit page-provided source supplies this entry's distinct identity.
    // Keep it in `sources`/`aliases` for rendering and source observation, but
    // do not let it identify or reconnect a different image.
    const svgPlaceholder = hasExplicitPrimary
      ? liveSvgSources.find(value => value !== primaryKey) || ''
      : '';
    const identityAliases = unique(identitySourcesFor(node).map(key));
    const filteredIdentityAliases = svgPlaceholder ? identityAliases.filter(value => value !== svgPlaceholder) : identityAliases;
    const rect = node.getBoundingClientRect?.() || {};
    const thumb = thumbSource(node, variants);
    const knownSize = node.naturalWidth > 2 && node.naturalHeight > 2 && url(node.currentSrc || node.getAttribute?.('src')) === thumb;
    const width = Number(node.getAttribute?.('width')), height = Number(node.getAttribute?.('height'));
    const styleRatio = !knownSize && !(width > 0 && height > 0) && typeof getComputedStyle === 'function' ? getComputedStyle(node).aspectRatio : '';
    const declared = styleRatio?.match(/(?:^|\s)([\d.]+)\s*\/\s*([\d.]+)$/);
    const aspectRatio = knownSize ? node.naturalWidth / node.naturalHeight
      : width > 0 && height > 0 ? width / height
      : declared && Number(declared[1]) > 0 && Number(declared[2]) > 0 ? Number(declared[1]) / Number(declared[2])
      : rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 1;
    return {
      key: primaryKey, aliases, identityAliases: filteredIdentityAliases, canonicalIdentity: canonicalEvidence.identity,
      canonicalAmbiguous: canonicalEvidence.ambiguous, sources: variants, thumb,
      title: node.alt || node.title || node.getAttribute?.('aria-label') || '', aspectRatio,
      aspectRatioSource: knownSize ? 'intrinsic' : width > 0 && height > 0 || declared ? 'declared'
        : rect.width > 0 && rect.height > 0 ? 'measured' : 'fallback',
      dimensions: knownSize ? [node.naturalWidth, node.naturalHeight] : null, node
    };
  }
  const slotIds = new WeakMap();
  let nextSlotId = 0;
  function slotsFor(scope, seed, nested = scope && nestedGalleryRows(scope)) {
    if (!scope || !seed) return [];
    let container = scope;
    if (nested) {
      while (seed.parentElement && seed.parentElement !== scope) seed = seed.parentElement;
      container = seed;
      // Use a populated row to infer its card shape, then flatten only peer rows.
      seed = mediaNodes(container).find(isVisibleCandidate);
      if (!seed) return [];
    }
    let card = seed;
    while (card.parentElement && card.parentElement !== container) card = card.parentElement;
    if (card.parentElement !== container) return [];
    const classes = new Set(String(card.className || '').split(/\s+/).filter(Boolean));
    const rowClasses = String(container.className || '').split(/\s+/).filter(Boolean);
    const rows = nested ? [...scope.children].filter(node => node.tagName === container.tagName &&
      rowClasses.every(name => String(node.className || '').split(/\s+/).includes(name))) : [scope];
    const children = rows.flatMap(row => [...(row.children || [])]);
    const cards = children.filter(node => {
      if (node.tagName !== card.tagName) return false;
      const rect = node.getBoundingClientRect?.();
      if (!rect) return false;
      if (rect.width < 72 || rect.height < 72 || node.closest?.('header, nav, footer')) return false;
      const own = new Set(String(node.className || '').split(/\s+/).filter(Boolean));
      const similar = classes.size && [...classes].filter(name => own.has(name)).length >= classes.size * .75;
      const emptyPeer = own.size === classes.size && [...classes].every(name => own.has(name));
      const media = nested || similar ? mediaNodes(node) : [];
      const visibleMedia = media.filter(isVisibleCandidate);
      const layered = visibleMedia.length > 1 && visibleMedia.every(item => {
        const box = item.getBoundingClientRect(), first = visibleMedia[0].getBoundingClientRect();
        return Math.abs(box.width - first.width) < 2 && Math.abs(box.height - first.height) < 2 &&
          Math.abs(box.left - first.left) < 2 && Math.abs(box.top - first.top) < 2;
      });
      // A repeated row can contain a recommendation cluster shaped like one
      // tile. Several independent links and no card-size image make it content,
      // not an empty photo slot. Real image sets still have a primary image.
      if (nested && node !== card && (node.querySelectorAll?.('a[href]')?.length || 0) > 1 &&
          !media.some(item => {
            const box = item.getBoundingClientRect();
            return isVisibleCandidate(item) && box.width * box.height >= rect.width * rect.height * .35;
          })) return false;
      return node === card || (similar && (media.length ? nested || media.length <= 1 || visibleMedia.length === 1 || layered : emptyPeer)) ||
        (!classes.size && cardHasMedia(node) && mediaNodes(node).length <= 1);
    });
    if (cards.length < 2) return [];
    // Infer a repeated, unique identity attribute without naming a site or framework.
    const identity = [...(card.attributes || [])].map(a => a.name).find(name => {
      if (!/^data-.*(?:id|key|uuid)$|^aria-posinset$|^aria-rowindex$/.test(name)) return false;
      const values = cards.map(node => node.getAttribute(name));
      return values.every(value => value && value.length <= 256) && new Set(values).size === cards.length;
    });
    return ordered(cards).map((node, order) => {
      if (!slotIds.has(node)) slotIds.set(node, `slot-${++nextSlotId}`);
      const descendants = mediaNodes(node), media = descendants.length ? descendants : [node];
      return { node, order, key: identity ? `${identity}:${node.getAttribute(identity)}` : slotIds.get(node), stable: Boolean(identity),
        pending: !media.some(item => sources(item).some(source => !/^data:image\/(gif|svg\+xml)/i.test(source) ||
          item.complete && item.naturalWidth > 2 && item.naturalHeight > 2)) };
    });
  }
  function connectedEntryNode(entry, scope) {
    if (!entry) return null;
    const node = entry.node;
    if (matchesNode(entry, node)) return node;
    if (entry.slotStable && entry.slotNode?.isConnected) {
      const slot = slotsFor(scope, node?.isConnected ? node : entry.slotNode).find(slot => slot.node === entry.slotNode);
      if (slot?.key === entry.slotKey && slot.pending) return slot.node;
    }
    return null;
  }
  function matchesNode(entry, node) {
    return matchingNodes(entry ? [entry] : [], node ? [node] : []).has(node);
  }
  function matchingNodes(entries, nodes) {
    const previous = discoveryCache;
    discoveryCache = { images: new WeakMap(), media: new WeakMap(), sources: new WeakMap(), identitySources: new WeakMap(), declaredSources: new WeakMap(), canonicalEvidence: new WeakMap() };
    try {
      const matcher = entryMatcher(entries), matched = new Set();
      for (const node of nodes) {
        if (!node?.isConnected) continue;
        const candidates = identitySourcesFor(node);
        const liveKey = candidates.find(value => !/^data:image\/(?:gif|svg\+xml)/i.test(value)) || candidates[0] || '';
        const canonicalEvidence = canonicalEvidenceFor(node);
        const candidate = { key: liveKey, aliases: candidates, identityAliases: candidates,
          canonicalIdentity: canonicalEvidence.identity, canonicalAmbiguous: canonicalEvidence.ambiguous };
        if (matcher.find(candidate)) matched.add(node);
      }
      return matched;
    } finally { discoveryCache = previous; }
  }
  function matchAliases(entry) {
    if (Array.isArray(entry.identityAliases)) return entry.identityAliases;
    if (entry.aliases) return entry.aliases;
    return entry.sources?.map(key) || [entry.key].filter(Boolean);
  }
  function entryCanonicalIdentity(entry) {
    return typeof entry.canonicalIdentity === 'string' ? entry.canonicalIdentity : '';
  }
  function entryCanonicalAmbiguous(entry) { return entry.canonicalAmbiguous === true; }
  function canonicalConflict(a, b) {
    if (entryCanonicalAmbiguous(a) || entryCanonicalAmbiguous(b)) return true;
    const left = entryCanonicalIdentity(a), right = entryCanonicalIdentity(b);
    return Boolean(left && right && left !== right);
  }
  function sameEntry(a, b) {
    if (canonicalConflict(a, b)) return false;
    const stableSlotMatch = a.slotStable && b.slotStable && a.slotKey === b.slotKey;
    if (a.key === b.key || stableSlotMatch) return true;
    const leftCanonical = entryCanonicalIdentity(a), rightCanonical = entryCanonicalIdentity(b);
    if (leftCanonical && rightCanonical) return leftCanonical === rightCanonical;
    const aliases = new Set(matchAliases(a));
    return matchAliases(b).some(value => aliases.has(value));
  }
  function entryMatcher(entries) {
    const keyIndex = new Map(), directKeyIndex = new Map(), slotIndex = new Map(), canonicalIndex = new Map();
    const canonicalResourceIndex = new Map(), weakAliasIndex = new Map(), positions = new Map();
    const indexedAliases = new WeakMap(), indexedCanonicalResources = new WeakMap(), indexedKeys = new WeakMap(), indexedDirectKeys = new WeakMap();
    const addTo = (map, value, entry) => {
      let candidates = map.get(value);
      if (!candidates) map.set(value, candidates = new Set());
      candidates.add(entry);
    };
    const removeFrom = (map, value, entry) => {
      const candidates = map.get(value);
      if (!candidates) return;
      candidates.delete(entry);
      if (!candidates.size) map.delete(value);
    };
    const resourceBucket = value => {
      let bucket = canonicalResourceIndex.get(value);
      if (!bucket) canonicalResourceIndex.set(value, bucket = new Map());
      return bucket;
    };
    const removeCanonicalResource = (value, canonical, entry) => {
      const bucket = canonicalResourceIndex.get(value), candidates = bucket?.get(canonical);
      if (!candidates) return;
      candidates.delete(entry);
      if (!candidates.size) bucket.delete(canonical);
      if (!bucket.size) canonicalResourceIndex.delete(value);
    };
    const add = (entry, position = positions.size) => {
      if (!positions.has(entry)) positions.set(entry, position);
      if (entryCanonicalAmbiguous(entry)) {
        for (const [map, value] of indexedAliases.get(entry) || []) removeFrom(map, value, entry);
        for (const [value, identity] of indexedCanonicalResources.get(entry) || []) removeCanonicalResource(value, identity, entry);
        const oldKey = indexedKeys.get(entry);
        if (oldKey) removeFrom(keyIndex, oldKey, entry);
        const oldDirectKey = indexedDirectKeys.get(entry);
        if (oldDirectKey) removeFrom(directKeyIndex, oldDirectKey, entry);
        indexedAliases.set(entry, []);
        indexedKeys.set(entry, '');
        indexedDirectKeys.set(entry, '');
        return;
      }
      const canonical = entryCanonicalIdentity(entry);
      const previousKey = indexedKeys.get(entry);
      if (previousKey) removeFrom(keyIndex, previousKey, entry);
      const previousDirectKey = indexedDirectKeys.get(entry);
      if (previousDirectKey) removeFrom(directKeyIndex, previousDirectKey, entry);
      if (entry.key) {
        addTo(directKeyIndex, entry.key, entry);
        indexedDirectKeys.set(entry, entry.key);
      } else indexedDirectKeys.set(entry, '');
      if (!canonical || canonical === entry.key) {
        addTo(keyIndex, entry.key, entry);
        indexedKeys.set(entry, entry.key);
      } else indexedKeys.set(entry, '');
      if (entry.slotStable) addTo(slotIndex, entry.slotKey, entry);
      for (const [map, value] of indexedAliases.get(entry) || []) removeFrom(map, value, entry);
      for (const [value, identity] of indexedCanonicalResources.get(entry) || []) removeCanonicalResource(value, identity, entry);
      const postings = [], aliases = matchAliases(entry);
      const resourcePostings = [];
      const post = (map, values) => {
        for (const value of values) { addTo(map, value, entry); postings.push([map, value]); }
      };
      if (canonical) {
        post(canonicalIndex, [canonical]);
        for (const value of aliases) {
          const bucket = resourceBucket(value);
          if (!bucket.has(canonical)) bucket.set(canonical, new Set());
          bucket.get(canonical).add(entry);
          resourcePostings.push([value, canonical]);
        }
      } else post(weakAliasIndex, aliases);
      indexedAliases.set(entry, postings);
      indexedCanonicalResources.set(entry, resourcePostings);
    };
    entries.forEach((entry, position) => add(entry, position));
    const find = entry => {
      if (entryCanonicalAmbiguous(entry)) return null;
      const candidates = new Set();
      const include = (map, value) => { for (const candidate of map.get(value) || []) candidates.add(candidate); };
      const canonical = entryCanonicalIdentity(entry), aliases = matchAliases(entry);
      if (!canonical || canonical === entry.key) include(keyIndex, entry.key);
      if (entry.slotStable) include(slotIndex, entry.slotKey);
      if (canonical) {
        include(canonicalIndex, canonical);
        for (const value of aliases) include(weakAliasIndex, value);
      } else {
        const canonicalHits = new Set();
        for (const value of aliases) {
          include(weakAliasIndex, value);
          for (const [identity, resourceEntries] of canonicalResourceIndex.get(value) || []) {
            canonicalHits.add(identity);
            if (canonicalHits.size > 1) {
              const direct = directKeyIndex.get(entry.key);
              if (direct?.size === 1) {
                const [exact] = direct;
                if (sameEntry(exact, entry)) return exact;
              }
              return null;
            }
            for (const candidate of resourceEntries) candidates.add(candidate);
          }
        }
      }
      let found = null, earliest = Infinity;
      for (const candidate of candidates) {
        const position = positions.get(candidate);
        if (position >= earliest || !sameEntry(candidate, entry)) continue;
        found = candidate; earliest = position;
      }
      return found;
    };
    return { add, find };
  }
  function mergeEntries(existing, incoming, direction = 1) {
    const result = existing.slice(), matched = new Map();
    const matcher = entryMatcher(result);
    for (const entry of incoming) {
      const found = matcher.find(entry);
      if (found) {
        const id = found.key;
        const aliases = unique([...(found.aliases || []), ...(entry.aliases || []), ...entry.sources.map(key)]);
        const identityAliases = Array.isArray(found.identityAliases) || Array.isArray(entry.identityAliases)
          ? unique([...matchAliases(found), ...matchAliases(entry)]) : null;
        const canonicalIdentity = entryCanonicalIdentity(found) || entryCanonicalIdentity(entry);
        const hasCanonicalIdentity = typeof found.canonicalIdentity === 'string' || typeof entry.canonicalIdentity === 'string';
        const geometry = found.thumb === entry.thumb && found.dimensions && !entry.dimensions
          ? { dimensions: found.dimensions, aspectRatio: found.aspectRatio, aspectRatioSource: found.aspectRatioSource } : {};
        Object.assign(found, entry, geometry, { key: id, aliases,
          ...(identityAliases ? { identityAliases } : {}), ...(hasCanonicalIdentity ? { canonicalIdentity } : {}) });
        matcher.add(found);
        matched.set(entry, found);
      }
    }
    // A recycled virtual window may have no overlap with the previous window.
    // Prepend its whole ordered block, rather than reversing it one insert at a time.
    if (!matched.size) return direction < 0 ? [...incoming, ...result] : [...result, ...incoming];
    // Normal unchanged or source-updated scans usually match every incoming
    // image. Their merge effects are already applied above, so skip rebuilding
    // a linked list when there are no new positions to insert.
    if (incoming.every(entry => matched.has(entry))) return result;

    // Keep the legacy insertion semantics for repeated object references. In
    // that uncommon case Map and Array#indexOf intentionally resolve the same
    // object identity, which can represent multiple positions in the arrays.
    const references = new Set();
    let repeatedReference = false;
    for (const entry of existing) {
      if (references.has(entry)) { repeatedReference = true; break; }
      references.add(entry);
    }
    if (!repeatedReference) for (const entry of incoming) {
      if (references.has(entry)) { repeatedReference = true; break; }
      references.add(entry);
    }
    if (repeatedReference) {
      for (let n = 0; n < incoming.length; n++) {
        const entry = incoming[n];
        if (matched.has(entry)) continue;
        const previous = incoming.slice(0, n).reverse().map(item => matched.get(item)).find(Boolean);
        const next = incoming.slice(n + 1).map(item => matched.get(item)).find(Boolean);
        const at = previous ? result.indexOf(previous) + 1 : next ? result.indexOf(next) : direction < 0 ? 0 : result.length;
        result.splice(at, 0, entry); matched.set(entry, entry);
      }
      return result;
    }

    // Use stable linked nodes so each ordered insertion is O(1), then flatten
    // once. The old implementation copied and searched incoming prefixes and
    // suffixes for every miss, making a mixed refresh quadratic.
    const head = { entry: null, previous: null, next: null };
    head.previous = head.next = head;
    const firstNodeForEntry = new Map();
    for (const entry of result) {
      const node = { entry, previous: head.previous, next: head };
      head.previous.next = node; head.previous = node;
      if (!firstNodeForEntry.has(entry)) firstNodeForEntry.set(entry, node);
    }
    const insertBefore = (target, node) => {
      node.previous = target.previous; node.next = target;
      target.previous.next = node; target.previous = node;
    };
    const nextAnchor = new Array(incoming.length);
    let next = null;
    for (let n = incoming.length - 1; n >= 0; n--) {
      nextAnchor[n] = next;
      if (matched.has(incoming[n])) next = firstNodeForEntry.get(matched.get(incoming[n])) || next;
    }
    let previous = null;
    for (let n = 0; n < incoming.length; n++) {
      const entry = incoming[n];
      if (matched.has(entry)) {
        previous = firstNodeForEntry.get(matched.get(entry)) || previous;
        continue;
      }
      const node = { entry, previous: null, next: null };
      if (previous) insertBefore(previous.next, node);
      else if (nextAnchor[n]) insertBefore(nextAnchor[n], node);
      else if (direction < 0) insertBefore(head.next, node);
      else insertBefore(head, node);
      matched.set(entry, entry);
      if (!firstNodeForEntry.has(entry)) firstNodeForEntry.set(entry, node);
      previous = firstNodeForEntry.get(entry) || node;
    }
    result.length = 0;
    for (let node = head.next; node !== head; node = node.next) result.push(node.entry);
    return result;
  }
  function preferredRefreshMatches(node, previousEntry, previousSource) {
    if (!node?.isConnected || !previousEntry || previousEntry.canonicalAmbiguous) return false;
    const previousCanonical = entryCanonicalIdentity(previousEntry);
    if (node.tagName !== 'IMG') {
      const evidence = canonicalEvidenceFor(node);
      if (evidence.ambiguous) return false;
      let serializedBackground;
      try { serializedBackground = String(getComputedStyle(node).backgroundImage || '').trim(); }
      catch { return false; }
      // Accept only one serialized url() token. cssUrls() alone would also
      // extract the URLs inside image-set(), cross-fade(), or layered images
      // and could mistake an unselected candidate for the painted resource.
      const singleUrl = serializedBackground.match(/^url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)$/i);
      const liveBackground = singleUrl && url(singleUrl[1] ?? singleUrl[2] ?? singleUrl[3]?.trim());
      if (!liveBackground || /^data:image\/(?:gif|svg\+xml)/i.test(liveBackground)) return false;
      if (previousCanonical) return evidence.identity === previousCanonical;
      if (evidence.identity) return false;
      return Boolean(previousSource) && key(liveBackground) === key(previousSource);
    }
    if (!previousCanonical) {
      const live = url(node.currentSrc || node.getAttribute?.('src'));
      if (!live || /^data:image\/(?:gif|svg\+xml)/i.test(live)) return false;
      const evidence = canonicalEvidenceFor(node);
      // Without a canonical identity, keep the old node only when its currently
      // selected resource is still exactly the prior thumbnail. Declared
      // aliases such as a shared preview URL do not prove node identity.
      return Boolean(previousSource) && key(live) === key(previousSource) && !evidence.ambiguous && !evidence.identity;
    }
    const next = canonicalEvidenceFor(node);
    return !next.ambiguous && Boolean(next.identity) && next.identity === previousCanonical;
  }
  function refreshFallbackMedia(previousEntry, scopeHint, preferred) {
    const slot = previousEntry?.slotNode;
    if (!scopeHint?.isConnected || !slot?.isConnected || !scopeHint.contains?.(slot)) return [];
    const candidates = slot.tagName === 'IMG' ? [slot] : mediaNodes(slot);
    return candidates.filter(node => node !== preferred);
  }
  function ordered(candidates) {
    const positions = candidates.map(node => {
      const item = node.closest?.('[aria-posinset], [aria-rowindex]');
      return Number(item?.getAttribute('aria-posinset') || item?.getAttribute('aria-rowindex'));
    });
    if (positions.some(n => !Number.isFinite(n) || n <= 0) || new Set(positions).size !== candidates.length) return candidates;
    return candidates.map((node, index) => ({ node, position: positions[index] })).sort((a, b) => a.position - b.position).map(item => item.node);
  }
  function slotMatcher(slots) {
    const firstByNode = new Map();
    for (let index = 0; index < slots.length; index++) {
      const node = slots[index].node;
      if (!firstByNode.has(node)) firstByNode.set(node, index);
    }
    return node => {
      let found, first = Infinity;
      for (let ancestor = node; ancestor; ancestor = ancestor.parentElement) {
        const index = firstByNode.get(ancestor);
        if (index !== undefined && index < first) {
          found = slots[index];
          first = index;
          if (first === 0) break;
        }
      }
      return found;
    };
  }
  function collectSnapshot(source, preferred = null, scopeHint = null, previousEntry = null) {
    const matches = node => [node.currentSrc, ...identitySourcesFor(node)].some(value => value && (value === source || key(value) === key(source)));
    let allMedia;
    const pageMedia = () => allMedia ||= [...images(), ...mediaNodes(document, true, true)];
    let seed = null;
    if (previousEntry) {
      const inHint = node => !scopeHint?.isConnected || Boolean(scopeHint.contains?.(node));
      if (preferred?.isConnected && inHint(preferred) && preferredRefreshMatches(preferred, previousEntry, source)) seed = preferred;
      if (!seed && scopeHint?.isConnected) {
        seed = refreshFallbackMedia(previousEntry, scopeHint, preferred)
          .find(node => preferredRefreshMatches(node, previousEntry, source)) || null;
      }
    } else seed = preferred?.isConnected && matches(preferred) ? preferred : pageMedia().find(matches);
    const modal = seed?.closest('[role="dialog"], dialog, [aria-modal="true"]');
    const albumSeed = modal && pageMedia().find(node => !node.closest('[role="dialog"], dialog, [aria-modal="true"]') &&
      (previousEntry ? preferredRefreshMatches(node, previousEntry, source) : matches(node)) && scopeFor(node));
    const selected = albumSeed || seed;
    const knownNestedScope = scopeHint?.isConnected && nestedGalleryRows(scopeHint);
    const discovered = knownNestedScope ? scopeHint : scopeFor(selected);
    const scope = scopeHint?.isConnected
      ? discovered && discovered !== scopeHint && discovered.contains?.(scopeHint) ? discovered : scopeHint
      : discovered;
    if (previousEntry && !selected && !scope) {
      return { entries: [], index: -1, seed: null, scope: null, slots: [], confidence: 'none', adapter: lens.i18n.text('galleryGeneric') };
    }
    // Never widen an uncertain result to the whole page; the structural passes above must find a group.
    const candidates = ordered(scope ? mediaNodes(scope) : selected ? [selected] : []);
    const nestedScope = knownNestedScope || Boolean(scope && nestedGalleryRows(scope));
    const slots = slotsFor(scope, candidates.includes(selected) ? selected : candidates.find(isVisibleCandidate), nestedScope);
    const findSlot = slotMatcher(slots);
    const slotted = slots.length > 1 && (slots.some(slot => slot.pending) || slots.every(slot => slot.stable));
    const entries = [], matcher = entryMatcher(entries);
    const primaryByCard = new Map();
    for (const node of candidates) {
      const slot = findSlot(node);
      if (slotted && !slot) continue;
      if (!eligible(node, selected, Boolean(scope))) continue;
      if (slot) {
        if (!primaryByCard.has(slot.node)) {
          const primary = slot.node.contains?.(selected) && eligible(selected, selected, true) ? selected
            : mediaNodes(slot.node).filter(media => eligible(media, selected, true)).sort((a, b) => {
              const x = a.getBoundingClientRect(), y = b.getBoundingClientRect();
              return y.width * y.height - x.width * x.height ||
                (b.naturalWidth || 0) * (b.naturalHeight || 0) - (a.naturalWidth || 0) * (a.naturalHeight || 0);
            })[0];
          primaryByCard.set(slot.node, primary);
        }
        const primary = primaryByCard.get(slot.node);
        if (primary && primary !== node) continue;
      }
      const entry = makeEntry(node);
      if (!entry || matcher.find(entry)) continue;
      if (slot) Object.assign(entry, { slotKey: slot.key, slotStable: slot.stable, slotNode: slot.node });
      entries.push(entry); matcher.add(entry, entries.length - 1);
    }
    const seedEntry = selected && makeEntry(selected);
    const sourceKey = seedEntry?.key || key(source);
    let index = entries.findIndex(entry => entry.key === sourceKey);
    if (index < 0) {
      if (seedEntry || !scope) {
        const slot = seedEntry && slots.find(item => item.node === selected || item.node.contains?.(selected));
        if (slot) Object.assign(seedEntry, { slotKey: slot.key, slotStable: slot.stable, slotNode: slot.node });
        entries.unshift(seedEntry || { key: sourceKey, sources: [source], thumb: source, title: '', node: null }); index = 0;
      }
      else index = 0;
    }
    return { entries, index, seed: selected, scope, slots, confidence: scope ? 'group' : 'seed', adapter: lens.i18n.text('galleryGeneric') };
  }
  function collect(source, preferred = null, scopeHint = null, previousEntry = null) {
    const previous = discoveryCache;
    discoveryCache = { images: new WeakMap(), media: new WeakMap(), sources: new WeakMap(), identitySources: new WeakMap(), declaredSources: new WeakMap(), canonicalEvidence: new WeakMap() };
    try { return collectSnapshot(source, preferred, scopeHint, previousEntry); }
    finally { discoveryCache = previous; }
  }
  lens.gallery = { url, key, sources, collect, scopeFor, slotsFor, mergeEntries, sameEntry, matchesNode, matchingNodes, connectedEntryNode, observedAttributes };
})();

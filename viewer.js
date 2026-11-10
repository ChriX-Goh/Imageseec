(() => {
  const lens = globalThis.ImageLens ||= {};
  const { text: t, html: h } = lens.i18n;
  // Each invocation reads the current unpacked source, including after an update.
  lens.close?.();

  const css = `
    :host { all: initial !important; color-scheme: dark; }
    * { box-sizing: border-box; }
    dialog { padding: 0; border: 0; margin: 0; max-width: none; max-height: none; width: 100vw; height: 100dvh; background: #101114; color: #f4f5f7; }
    dialog::backdrop { background: #101114; }
    .viewer { position: fixed; inset: 0; overflow: hidden; background: radial-gradient(ellipse at 50% 40%, #23252b 0%, #101114 76%); font: 14px/1.5 system-ui, sans-serif; user-select: none; outline: none; }
    .viewer:fullscreen { width: 100vw; height: 100dvh; }
    button { font: inherit; color: inherit; cursor: pointer; border: 1px solid #ffffff1c; background: #25272ccc; border-radius: 12px; }
    button:hover { background: #3c3f46; border-color: #ffffff50; }
    button:focus-visible { outline: 2px solid #b3caff; outline-offset: 3px; }
    button:disabled { opacity: .23; cursor: default; }
    svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
    .bar { position: absolute; z-index: 11; left: 26px; right: 26px; top: 20px; display: flex; gap: 14px; align-items: center; pointer-events: none; transition: transform .18s ease, opacity .15s ease; }
    .viewer.toolbar-auto:not(.top-open):not(:has(.settings:not([hidden]))) .bar:not(:hover):not(:has(:focus-visible)) { transform: translateY(-145%); opacity: 0; }
    .brand { font-weight: 650; letter-spacing: .1em; font-size: 16px; display: flex; gap: 10px; align-items: center; text-shadow: 0 1px 8px #000; }
    .brand svg { color: #b9caff; }
    .counter, .resolution { color: #b6bac5; font-size: 12px; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .tools { margin-left: auto; display: flex; gap: 8px; pointer-events: auto; }
    .tools button { display: grid; place-items: center; width: 40px; height: 40px; backdrop-filter: blur(16px); }
    .tools .fit { width: auto; min-width: 60px; padding: 0 12px; font-size: 12px; font-variant-numeric: tabular-nums; }
    .zoom-control { position: relative; width: 60px; height: 40px; }
    .zoom-shell { position: absolute; top: 0; right: 0; width: 60px; border: 1px solid #ffffff1c; border-radius: 12px; background: #25272cf5; backdrop-filter: blur(16px); overflow: hidden; }
    .zoom-control.expanded .zoom-shell { box-shadow: 0 12px 32px #0006; }
    .tools .zoom-shell .fit { border: 0; min-width: 0; width: 100%; height: 38px; padding: 0; background: transparent; }
    .zoom-popover { display: none; padding: 8px 7px 15px; }
    .zoom-control.expanded .zoom-popover { display: block; }
    .zoom-panel { position: relative; height: 176px; }
    .zoom-slider { position: absolute; left: 0; top: 0; width: 14px; height: 100%; margin: 0; writing-mode: vertical-lr; direction: rtl; accent-color: #bbccfa; cursor: pointer; }
    .zoom-ticks { position: absolute; inset: 7px 0 7px 16px; }
    .tools .zoom-ticks button { position: absolute; right: 0; width: 28px; height: 24px; padding: 0; transform: translateY(-50%); border: 0; background: transparent; border-radius: 5px; font-size: 10px; color: #b4bed1; }
    .tools .zoom-ticks button:hover { background: #ffffff18; color: white; }
    .tools .zoom-ticks .over { color: #ffd166; }
    .zoom-control.over .fit { color: #ffd166; }
    .zoom-lock[aria-pressed=true] { background: #b7c8f2; color: #172641; border-color: #d0dcfa; }
    .stage { position: absolute; inset: 0; overflow: hidden; touch-action: none; }
    .photo { position: absolute; left: 50%; top: 50%; max-width: none; max-height: none; object-fit: contain; transform-origin: center; will-change: transform; -webkit-user-drag: none; box-shadow: 0 24px 100px #0005; }
    .compare { position: absolute; inset: 0; display: none; overflow: hidden; touch-action: none; }
    .compare.active { display: block; }
    .compare-pane { position: absolute; top: 0; bottom: 0; overflow: hidden; background: #101114; }
    .compare-pane.left { left: 0; }
    .compare-pane.right { right: 0; }
    .compare-pane img { position: absolute; left: 50%; top: 50%; max-width: none; max-height: none; object-fit: contain; transform-origin: center; will-change: transform; -webkit-user-drag: none; }
    .compare-pane .pane-lock { position: absolute; z-index: 2; top: 50%; width: 42px; height: 42px; display: grid; place-items: center; transform: translateY(-50%); opacity: 0; transition: opacity .14s; }
    .compare-pane.left .pane-lock { right: 14px; }
    .compare-pane.right .pane-lock { left: 14px; }
    .compare-pane:hover .pane-lock, .compare-pane .pane-lock[aria-pressed="true"] { opacity: 1; }
    .compare-pane .pane-lock[aria-pressed="true"] { background: #b7c8f2; color: #172641; border-color: #d0dcfa; }
    .divider { position: absolute; z-index: 4; top: 0; bottom: 0; width: 34px; padding: 0; border: 0; border-radius: 0; transform: translateX(-50%); background: transparent; cursor: col-resize; touch-action: none; }
    .divider::before { content: ''; position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; transform: translateX(-50%); background: #ffffffaa; box-shadow: 0 0 12px #0009; }
    .divider::after { content: ''; position: absolute; left: 50%; top: var(--divider-handle-y, 50%); width: 26px; height: 52px; transform: translate(-50%, -50%); border: 1px solid #ffffff70; border-radius: 13px; background: #20232bdd; box-shadow: 0 6px 18px #0008; opacity: 0; visibility: hidden; pointer-events: none; transition: opacity .12s, visibility .12s, background .12s; }
    .divider:hover::after, .divider:focus-visible::after, .divider.dragging::after { background: #3d4350; opacity: 1; visibility: visible; }
    .overview-shell { position: absolute; z-index: 4; inset: 0; overflow: clip; background: #101114; }
    .overview-shell[hidden] { display: none; }
    .overview { position: absolute; inset: 0; display: none; overflow-y: auto; overflow-x: hidden; overflow-anchor: none; overscroll-behavior: none; padding: 82px 24px 36px; scrollbar-width: thin; scrollbar-gutter: stable; }
    .overview.active { display: block; }
    .overview.horizontal { overflow-x: auto; overflow-y: hidden; }
    .overview.dragging, .overview.dragging .overview-card { cursor: grabbing; }
    .overview-content { display: flex; flex-direction: column; width: max-content; min-width: 100%; }
    .overview.horizontal .overview-content { flex-direction: row; height: 100%; }
    .overview-grid { position: relative; flex: none; margin: 0; }
    .overview-card { position: absolute; margin: 0; padding: 5px; border: 1px solid #ffffff1c; border-radius: 12px; background: #202229; cursor: pointer; text-align: left; overflow: hidden; }
    .overview-card:hover { border-color: #a9c0ff99; background: #2d3039; }
    .overview-card:disabled { pointer-events: none; }
    .overview-card[aria-current="true"] { border-color: #b4c8ff; box-shadow: 0 0 16px #9fb9ff30; }
    .overview-card img { display: block; width: 100%; height: calc(100% - 27px); object-fit: contain; border-radius: 8px; pointer-events: none; color: transparent; opacity: 0; transition: opacity .18s ease; }
    .overview-card[data-thumb-state="ready"] img { opacity: 1; background: #15171b; }
    .overview-card::before { content: ''; position: absolute; inset: 5px 5px 32px; border-radius: 8px; pointer-events: none; background: radial-gradient(ellipse at 30% 22%, #8a9ab13a, transparent 70%), radial-gradient(ellipse at 80% 75%, #737caa42, #292d36 77%); transition: opacity .18s ease; }
    .overview-card[data-thumb-state="ready"]::before { opacity: 0; }
    .overview-card span { display: block; height: 27px; padding: 5px 3px 1px; color: #b6bac5; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .overview.clean .overview-card { border: 0; border-radius: 0; padding: 0; background: transparent; box-shadow: none; }
    .overview.clean .overview-card img { height: 100%; border-radius: 0; background: transparent; }
    .overview.clean .overview-card::before { inset: 0; border-radius: 0; }
    .overview.clean .overview-card span { display: none; }
    .overview.clean .overview-card[aria-current="true"] img { filter: brightness(.88); }
    .overview-status { flex: 0 0 40px; display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 0; padding: 0 8px; color: #cbd5eb; font-size: 12px; text-align: center; overflow: hidden; pointer-events: none; }
    .overview.horizontal .overview-status { flex-basis: 80px; width: 80px; flex-direction: column; }
    .overview-status[hidden] { display: flex; visibility: hidden; }
    .loading-flower { width: 19px; height: 19px; flex: none; fill: #b6cbff; stroke: none; animation: flower-turn 1s linear infinite; }
    .message .loading-flower { vertical-align: middle; margin-inline-end: 8px; }
    @keyframes flower-turn { to { transform: rotate(1turn); } }
    .stage.zoomed { cursor: grab; }
    .stage.holding, .compare.holding { cursor: zoom-out; }
    .stage.dragging, .compare.dragging { cursor: grabbing; }
    .edge { position: absolute; z-index: 3; top: 18%; bottom: 20%; width: clamp(52px, 9vw, 150px); border: 0; border-radius: 0; background: transparent; display: flex; align-items: center; justify-content: center; opacity: .4; transition: opacity .18s, background .18s; }
    .edge:hover { opacity: 1; background: linear-gradient(90deg, #0003, transparent); }
    .viewer.in-overview :is(.resolution, .zoom-lock, .edge, .trigger, .message) { display: none; }
    .edge span { display: grid; place-items: center; width: 44px; height: 56px; background: #23252b99; border: 1px solid #ffffff18; border-radius: 16px; backdrop-filter: blur(12px); }
    .prev { left: 0; } .next { right: 0; } .next:hover { background: linear-gradient(270deg, #0003, transparent); }
    .edge .edge-preview { position: absolute; display: none; width: 136px; height: 118px; padding: 6px; background: #1f222bf0; border: 1px solid #ffffff35; border-radius: 14px; box-shadow: 0 12px 36px #0007; pointer-events: none; }
    .prev .edge-preview { left: calc(100% - 4px); } .next .edge-preview { right: calc(100% - 4px); }
    .edge:not(:disabled).pointer-preview .edge-preview { display: block; }
    .viewer.moving .edge, .viewer.moving .trigger { pointer-events: none; }
    .edge-preview img { width: 122px; height: 82px; object-fit: contain; display: block; border-radius: 8px; }
    .edge-preview small { display: block; font-size: 11px; margin-top: 4px; color: #d4dced; }
    .message { position: absolute; z-index: 2; left: 50%; top: 50%; transform: translate(-50%, -50%); padding: 18px 24px; border-radius: 16px; background: #202229ed; text-align: center; max-width: min(80vw, 500px); }
    .message[hidden] { display: none; }
    .message button { display: block; margin: 12px auto 0; padding: 7px 16px; }
    .trigger { position: absolute; z-index: 7; bottom: 0; width: 100%; height: 28px; }
    .top-trigger { position: absolute; z-index: 10; top: 0; left: 0; right: 0; height: 18px; }
    .strip { position: absolute; z-index: 8; bottom: 0; left: 0; right: 0; padding: 16px 24px 20px; background: linear-gradient(0deg, #14161cf5 76%, #14161c00); transform: translateY(105%); visibility: hidden; pointer-events: none; transition: transform .23s ease, visibility 0s .23s; }
    .strip.visible { transform: translateY(0); visibility: visible; pointer-events: auto; transition: transform .23s ease, visibility 0s; }
    .strip-label { display: flex; justify-content: center; gap: 12px; margin-bottom: 12px; color: #b2b8c6; font-size: 11px; letter-spacing: .08em; }
    .thumbs { display: flex; align-items: center; gap: 10px; max-width: 100%; width: max-content; margin: auto; overflow-x: auto; padding: 4px; scrollbar-width: thin; }
    .thumb { flex: 0 0 86px; width: 86px; height: 76px; padding: 4px; border-radius: 12px; position: relative; background: #272930; transition: transform .18s, border .18s; }
    .thumb img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 8px; pointer-events: none; }
    .thumb span { position: absolute; bottom: 5px; right: 7px; padding: 0 4px; background: #0009; border-radius: 4px; font-size: 10px; }
    .thumb.current { border: 2px solid #b4c8ff; transform: translateY(-3px); box-shadow: 0 0 18px #9fb9ff24; }
    .thumb.empty { opacity: 0; pointer-events: none; }
    .settings { position: absolute; z-index: 10; top: 72px; right: 26px; width: min(350px, calc(100vw - 32px)); max-height: calc(100dvh - 88px); overflow-y: auto; background: #23252cf5; border: 1px solid #ffffff22; border-radius: 18px; padding: 22px; box-shadow: 0 16px 64px #0007; backdrop-filter: blur(24px); }
    .settings[hidden] { display: none; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    @media(max-width: 600px) { .bar { left: 12px; right: 12px; top: 12px; gap: 8px; } .brand { font-size: 13px; } .tools { gap: 4px; } .tools button { width: 34px; height: 34px; } .thumb { flex-basis: 62px; width: 62px; height: 62px; } .strip { padding-inline: 12px; } .counter { font-size: 10px; } .overview { padding: 64px 12px 24px; } .overview-grid { column-width: 150px; column-gap: 8px; } .overview-card { margin-bottom: 8px; } }
    @media(max-width: 520px) { .brand { font-size: 0; gap: 0; } .resolution { overflow: hidden; text-overflow: ellipsis; min-width: 0; } .tools { flex-shrink: 0; } }
    @media(prefers-reduced-motion: reduce) { * { transition: none !important; } .loading-flower { animation: none; } }
  `;
  const icon = name => {
    const paths = { close: '<path d="m6 6 12 12M18 6 6 18"/>', prev: '<path d="m14 5-7 7 7 7"/>', next: '<path d="m10 5 7 7-7 7"/>', full: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>', settings: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="#25272c"/><circle cx="15" cy="12" r="2" fill="#25272c"/><circle cx="9" cy="18" r="2" fill="#25272c"/>', lens: '<path d="M8 3H3v5m18 0V3h-5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="5"/><path d="M12 4v3m0 10v3M4 12h3m10 0h3"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>', compare: '<rect x="3" y="4" width="8" height="16" rx="1"/><rect x="13" y="4" width="8" height="16" rx="1"/><path d="M12 4v16"/>', overview: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>' };
    paths.lock = '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/>';
    paths.unlock = '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/><path d="M12 14v3"/>';
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
  };
  const flower = '<svg class="loading-flower" viewBox="0 0 24 24" aria-hidden="true">' +
    Array.from({ length: 9 }, (_, n) => `<path d="M12 9.6C9.7 8.6 9 5.1 10.4 2.9c.8-1.3 2.4-1.3 3.2 0 1.4 2.2.7 5.7-1.6 6.7Z" transform="rotate(${n * 40} 12 12)" opacity="${(.24 + n * .095).toFixed(2)}"/>`).join('') + '</svg>';
  function clipBox(box, bounds) {
    const left = Math.max(box.left, bounds.left), top = Math.max(box.top, bounds.top);
    const width = Math.min(box.right, bounds.right) - left, height = Math.min(box.bottom, bounds.bottom) - top;
    return width > 1 && height > 1 ? { left, top, width, height, right: left + width, bottom: top + height } : null;
  }
  function pictureSnapshot(image, bounds) {
    if (!image || image.hidden || !image.naturalWidth || !image.naturalHeight) return null;
    const full = image.getBoundingClientRect(), box = clipBox(full, bounds);
    if (!box) return null;
    const canvas = document.createElement('canvas'), ratio = Math.min(1, 1024 / Math.max(box.width, box.height));
    canvas.width = Math.max(1, Math.round(box.width * ratio)); canvas.height = Math.max(1, Math.round(box.height * ratio));
    const xScale = image.naturalWidth / full.width, yScale = image.naturalHeight / full.height;
    try {
      canvas.getContext('2d').drawImage(image, (box.left - full.left) * xScale, (box.top - full.top) * yScale,
        box.width * xScale, box.height * yScale, 0, 0, canvas.width, canvas.height);
    } catch { return null; }
    return { canvas, box };
  }
  function returnFeedback(snapshot, target, parent, reduced) {
    lens.feedbackController?.abort();
    if (!target) return;
    const feedback = new AbortController();
    lens.feedbackController = feedback;
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    const layer = host.attachShadow({ mode: 'closed' });
    layer.innerHTML = `<style>
      :host { all: initial !important; position: fixed !important; inset: 0 !important; z-index: 2147483647 !important; pointer-events: none !important; }
      canvas, i { position: absolute; box-sizing: border-box; object-fit: cover; pointer-events: none; }
      i { border: 2px solid #b8ceff; border-radius: 6px; box-shadow: 0 0 0 2px #142344b0, 0 0 20px #89acff80; }
    </style>`;
    parent.append(host);
    const stop = () => feedback.abort();
    for (const type of ['wheel', 'pointerdown', 'keydown', 'resize', 'pagehide']) {
      window.addEventListener(type, stop, { capture: true, signal: feedback.signal });
    }
    const frame = box => ({ left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
    const duration = reduced || !snapshot ? 0 : 240;
    if (duration) {
      const { canvas, box } = snapshot;
      layer.append(canvas);
      const motion = canvas.animate([{ ...frame(box), opacity: 1 }, { ...frame(target), opacity: 0 }],
        { duration, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'both' });
      motion.onfinish = () => canvas.remove();
    }
    const outline = document.createElement('i'); Object.assign(outline.style, frame(target)); layer.append(outline);
    if (duration) outline.animate([{ opacity: 0 }, { opacity: 1, offset: .28 }, { opacity: 1, offset: .76 }, { opacity: 0 }],
      { duration: duration + 800, fill: 'both' });
    const timer = setTimeout(stop, duration + 800);
    feedback.signal.addEventListener('abort', () => {
      clearTimeout(timer); host.remove();
      if (lens.feedbackController === feedback) lens.feedbackController = null;
    }, { once: true });
  }

  class ImagePool {
    constructor() { this.records = new Map(); this.queue = []; this.active = 0; this.closed = false; }
    get(entry, urgent = false) {
      const old = this.records.get(entry.key);
      if (old) {
        if (urgent && !old.started) { this.queue = this.queue.filter(r => r !== old); this.queue.unshift(old); this.pump(); }
        return old.promise;
      }
      const record = { entry, started: false, done: false, cancelled: false, img: new Image() };
      record.promise = new Promise(resolve => { record.resolve = resolve; });
      this.records.set(entry.key, record);
      if (urgent) this.queue.unshift(record); else this.queue.push(record);
      this.pump();
      return record.promise;
    }
    pump() {
      while (!this.closed && this.active < 3 && this.queue.length) {
        const r = this.queue.shift();
        if (r.cancelled) continue;
        r.started = true; this.active++;
        let index = 0;
        const finish = ok => {
          if (r.done) return;
          r.done = true; this.active--;
          clearTimeout(r.timer); r.img.onload = r.img.onerror = null;
          r.resolve(ok ? r.img : null); this.pump();
        };
        r.cancel = () => { r.cancelled = true; finish(false); r.img.removeAttribute('src'); };
        const next = () => {
          clearTimeout(r.timer);
          if (r.cancelled || index >= r.entry.sources.length) return finish(false);
          r.img.onload = () => finish(r.img.naturalWidth > 0);
          r.img.onerror = next;
          r.img.decoding = 'async';
          r.img.src = r.entry.sources[index++];
          r.timer = setTimeout(next, 12000);
        };
        next();
      }
    }
    retain(keys) {
      for (const [key, r] of this.records) if (!keys.has(key)) {
        this.records.delete(key);
        if (!r.started) { r.cancelled = true; r.resolve(null); }
        else if (!r.done) r.cancel();
        else r.img.removeAttribute('src');
      }
      this.queue = this.queue.filter(r => !r.cancelled);
    }
    clear() { this.closed = true; this.retain(new Set()); }
  }

  lens.open = function(source, rawSettings = {}, standalone = false, note = '') {
    if (!lens.gallery.url(source)) return;
    lens.close?.();
    lens.returnController?.abort();
    lens.feedbackController?.abort();
    const collection = lens.gallery.collect(source);
    let scopeParent = collection.scope?.parentElement;
    let entries = collection.entries;
    let index = collection.index;
    let settings = lens.settings.normalize(rawSettings);
    const pool = new ImagePool();
    const controller = new AbortController();
    const signal = controller.signal;
    let preferencesBinding = new AbortController();
    const focused = document.activeElement;
    const scroll = { value: document.documentElement.style.getPropertyValue('overflow'), priority: document.documentElement.style.getPropertyPriority('overflow') };
    const scrollbarGutter = { value: document.documentElement.style.getPropertyValue('scrollbar-gutter'), priority: document.documentElement.style.getPropertyPriority('scrollbar-gutter') };
    const reserveScrollbarGutter = innerWidth > document.documentElement.clientWidth && !/\bstable\b/.test(scrollbarGutter.value);
    const pagePosition = { x: window.scrollX, y: window.scrollY, elements: [] };
    for (let node = collection.scope; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
      const style = getComputedStyle(node);
      if ((node.scrollHeight > node.clientHeight + 4 && /auto|scroll|overlay|hidden/.test(style.overflowY)) ||
          (node.scrollWidth > node.clientWidth + 4 && /auto|scroll|overlay|hidden/.test(style.overflowX))) {
        pagePosition.elements.push({ node, top: node.scrollTop, left: node.scrollLeft });
      }
    }
    const scanScroller = pagePosition.elements[0]?.node || null;
    const scanHorizontal = Boolean(scanScroller && scanScroller.scrollWidth > scanScroller.clientWidth + 4 && scanScroller.scrollHeight <= scanScroller.clientHeight + 4);
    const sourcePosition = () => scanScroller ? scanHorizontal ? scanScroller.scrollLeft : scanScroller.scrollTop : window.scrollY;
    const scanStates = Object.fromEntries([-1, 1].map(direction => [direction, {
      cursor: sourcePosition(), phase: collection.scope ? 'idle' : 'ended',
      paused: false, ended: !collection.scope, failed: false, lastAttempt: -Infinity,
      noProgress: 0, triggerWaits: 0, resourceErrors: 0, totalAttempts: 0, sourceLoading: false, loadingNode: null, slotAttempts: new Map()
    }]));
    const sourceAnchors = new Map();
    const restorePageCoordinates = () => {
      window.scrollTo({ left: pagePosition.x, top: pagePosition.y, behavior: 'instant' });
      for (const item of pagePosition.elements) if (item.node.isConnected) {
        item.node.scrollTo({ left: item.left, top: item.top, behavior: 'instant' });
      }
    };
    const lockPage = () => {
      if (reserveScrollbarGutter) document.documentElement.style.setProperty('scrollbar-gutter', 'stable', 'important');
      document.documentElement.style.setProperty('overflow', 'hidden', 'important');
    };
    const restorePageStyles = () => {
      if (document.documentElement.style.getPropertyValue('overflow') === 'hidden' && document.documentElement.style.getPropertyPriority('overflow') === 'important') {
        if (scroll.value) document.documentElement.style.setProperty('overflow', scroll.value, scroll.priority);
        else document.documentElement.style.removeProperty('overflow');
      }
      if (reserveScrollbarGutter && document.documentElement.style.getPropertyValue('scrollbar-gutter') === 'stable' && document.documentElement.style.getPropertyPriority('scrollbar-gutter') === 'important') {
        if (scrollbarGutter.value) document.documentElement.style.setProperty('scrollbar-gutter', scrollbarGutter.value, scrollbarGutter.priority);
        else document.documentElement.style.removeProperty('scrollbar-gutter');
      }
    };
    lockPage();
    const host = document.createElement('div');
    host.id = 'image-lens-viewer';
    host.lang = lens.i18n.locale.replace('_', '-');
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${css}${lens.preferences.css}</style><dialog aria-label="${h('viewerTitle')}"><section class="viewer" tabindex="-1" role="region" aria-label="${h('viewerRegion')}">
      <div class="stage"><img class="photo" alt="" draggable="false" hidden></div>
      <div class="compare" aria-hidden="true">
        <div class="compare-pane left"><img alt="" draggable="false" hidden><button class="pane-lock" data-pane="left" aria-pressed="false" aria-label="${h('lockPane')}" title="${h('lockPane')}">${icon('unlock')}</button></div>
        <div class="compare-pane right"><img alt="" draggable="false" hidden><button class="pane-lock" data-pane="right" aria-pressed="false" aria-label="${h('lockPane')}" title="${h('lockPane')}">${icon('unlock')}</button></div>
        <button class="divider" aria-label="${h('resetDivider')}" title="${h('resetDivider')}"></button>
      </div>
      <div class="overview-shell" hidden><div class="overview" aria-label="${h('overviewTitle')}" aria-hidden="true" tabindex="0"><div class="overview-content">
        <div class="overview-status" data-side="-1" role="status" hidden></div><div class="overview-grid"></div><div class="overview-status" data-side="1" role="status" hidden></div></div></div></div>
      <div class="top-trigger" aria-hidden="true"></div>
      <header class="bar"><div class="brand">${icon('lens')}Imageseec</div><div class="counter"></div><div class="resolution"></div><div class="tools">
        <button class="compare-toggle" title="${h('splitView')}" aria-label="${h('splitView')}" aria-pressed="false">${icon('compare')}</button>
        <button class="overview-toggle" title="${h('overviewView')}" aria-label="${h('overviewView')}">${icon('overview')}</button>
        <div class="zoom-control"><div class="zoom-shell"><button class="fit" title="${h('zoomCycle')}" aria-label="${h('zoom')}">—</button><div class="zoom-popover"><div class="zoom-panel">
          <input class="zoom-slider" type="range" min="0" max="4" step="0.01" aria-label="${h('zoomSlider')}" aria-orientation="vertical">
          <div class="zoom-ticks">${lens.controls.ticks.map((value, i) => `<button type="button" data-tick="${i}" style="top:${100-i*25}%" aria-label="${h('zoomTo', value)}">${value}</button>`).join('')}</div>
        </div></div></div></div>
        <button class="zoom-lock" title="${h('lockZoom')}" aria-label="${h('lockZoom')}" aria-pressed="false">${icon('unlock')}</button>
        <button class="fullscreen" title="${h('enterFullscreen')} (F)" aria-label="${h('enterFullscreen')}" aria-pressed="false">${icon('full')}</button>
        <button class="preferences" title="${h('settingsTitle')}" aria-label="${h('settingsTitle')}">${icon('settings')}</button>
        <button class="close" title="${h('closeViewer')} (Esc)" aria-label="${h('closeViewer')}">${icon('close')}</button>
      </div></header>
      <button class="edge prev" title="${h('previous')} (←)" aria-label="${h('previous')}"><span>${icon('prev')}</span><span class="edge-preview" aria-hidden="true"><img alt="" draggable="false"><small></small></span></button>
      <button class="edge next" title="${h('next')} (→)" aria-label="${h('next')}"><span>${icon('next')}</span><span class="edge-preview" aria-hidden="true"><img alt="" draggable="false"><small></small></span></button>
      <div class="message" role="status" hidden></div>
      <div class="trigger" aria-hidden="true"></div>
      <div class="strip" aria-label="${h('nearby')}"><div class="strip-label"><span>${h('nearby')}</span><span class="strip-count"></span></div><div class="thumbs" role="group" aria-label="${h('thumbnails')}"></div></div>
      <form class="settings" hidden>${lens.preferences.html}</form><div class="sr" aria-live="polite"></div>
    </section></dialog>`;
    document.documentElement.append(host);
    const $ = selector => shadow.querySelector(selector);
    const dialog = $('dialog');
    const viewer = $('.viewer');
    const stage = $('.stage');
    const photo = $('.photo');
    const compare = $('.compare');
    const comparePanes = [$('.compare-pane.left'), $('.compare-pane.right')];
    const comparePhotos = comparePanes.map(pane => pane.querySelector('img'));
    const divider = $('.divider');
    const overview = $('.overview');
    const overviewGrid = $('.overview-grid');
    const overviewShell = $('.overview-shell');
    const message = $('.message');
    const strip = $('.strip');
    const form = $('.settings');
    let closed = false, serial = 0, scale = 1, panX = 0, panY = 0, width = 0, height = 0, hold = null, scanTimer = 0, wasFullscreen = false, returningToPage = false, lastWheel = 0, lastFineWheel = 0;
    let lockedScale = null;
    let preset = null, rulerMaximum = 100, sliding = false;
    let compareEnabled = settings.compareEnabled, compareLeft = index, compareRight = index + 1, activePane = 0, lockedPane = null, pairNeedsAnchor = false;
    let compareScale = 1, comparePanX = [0, 0], comparePanY = [0, 0], compareDims = [null, null], dividerPosition = .5, dividerDragging = false;
    let overviewOpen = false, overviewRecent = null, overviewAnchor = null, overviewBandSize = 1;
    let overviewBackwardExpanded = false, overviewBackwardProbeStarted = false, overviewBackwardProbeCompleted = false;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const overviewCards = new Map();
    let overviewItems = [], overviewStartOrdinal = 0, overviewGeometry = '', overviewLayoutConfig = '', rebuildOverviewItems = false;
    let overviewPress = null, overviewCommitTimer = 0, overviewCommitStarted = 0, overviewDirty = false, pictureClick = 0;
    let overviewClickGuard = null;
    let overviewLayoutAnchor = null;
    let scanPromise = null, scanController = null, scanRestore = null, overviewScrollFrame = 0, overviewCacheCheckTimer = 0, scanningDirection = 1, overviewDirection = 1, lastOverviewOffset = 0;
    let edgeSide = 0, edgePull = 0, edgeTimer = 0, edgeAnimation = null;
    const overviewThumbJobs = new Map();
    const overviewThumbQueue = [];
    const overviewEdgeIntentState = { side: 0, distance: 0, lastAt: 0, lastRetryAt: -Infinity, retried: false, timer: 0 };
    let overviewThumbActive = 0;
    const on = (node, type, handler, options = {}) => node.addEventListener(type, handler, { ...options, signal });

    function close(event) {
      if (closed) return;
      const target = entries[overviewOpen ? centralOverviewIndex() : activeIndex()];
      if (target && !standalone && event?.type !== 'pagehide') rememberSourceAnchors([target]);
      const targetPosition = target && sourceAnchors.get(target.key);
      closed = true; overviewOpen = false; serial++; controller.abort(); preferencesBinding.abort(); observer.disconnect(); pool.clear();
      scanController?.abort(); scanRestore = null;
      clearOverviewPress(); endHold(); clearTimeout(scanTimer); clearTimeout(overviewCacheCheckTimer); clearTimeout(overviewCommitTimer);
      cancelAnimationFrame(overviewScrollFrame);
      clearTimeout(overviewEdgeIntentState.timer);
      for (const job of overviewThumbJobs.values()) {
        clearTimeout(job.timeout);
        job.image.onload = job.image.onerror = null;
      }
      overviewThumbQueue.length = 0; overviewThumbJobs.clear();
      resetOverviewEdge();
      lens.feedbackController?.abort();
      globalThis.chrome?.storage?.onChanged?.removeListener(storageChanged);
      const leavingFullscreen = document.fullscreenElement === viewer || document.fullscreenElement === host
        ? document.exitFullscreen().catch(() => {}) : null;
      dialog.close(); host.remove();
      restorePageCoordinates(); restorePageStyles();
      focused?.focus?.({ preventScroll: true });
      if (event?.type !== 'pagehide' && !standalone) revealSource(target, targetPosition, leavingFullscreen);
      if (lens.close === close) lens.close = null;
      if (standalone) window.close();
    }
    lens.close = close;

    function rememberSourceAnchors(items = entries) {
      const container = scanScroller?.getBoundingClientRect();
      for (const entry of items) {
        const node = lens.gallery.connectedEntryNode(entry, collection.scope);
        if (!node?.isConnected) continue;
        const box = node.getBoundingClientRect();
        if (!box.width || !box.height) continue;
        sourceAnchors.set(entry.key, {
          position: sourcePosition() + (scanHorizontal ? box.left - (container?.left || 0) + box.width / 2 : box.top - (container?.top || 0) + box.height / 2),
          pageX: window.scrollX, pageY: window.scrollY,
          elements: pagePosition.elements.filter(item => item.node.isConnected && item.node.contains(node)).map(item => ({ node: item.node, top: item.node.scrollTop, left: item.node.scrollLeft }))
        });
      }
    }
    function centerSourceNode(node) {
      node.scrollIntoView({ block: 'center', inline: scanHorizontal ? 'center' : 'nearest', behavior: 'instant' });
    }
    async function revealSource(target, position, leavingFullscreen) {
      if (!target) return;
      const recovery = new AbortController(); lens.returnController?.abort(); lens.returnController = recovery;
      const stop = () => recovery.abort();
      for (const type of ['wheel', 'pointerdown', 'keydown']) window.addEventListener(type, stop, { capture: true, once: true, signal: recovery.signal });
      const restoreAnchor = () => {
        if (!position) return;
        window.scrollTo({ left: position.pageX, top: position.pageY, behavior: 'instant' });
        const elements = position.elements || [];
        for (const item of [...elements].reverse()) if (item.node.isConnected && item.node !== scanScroller) {
          item.node.scrollTo({ top: item.top, left: item.left, behavior: 'instant' });
        }
        if (scanScroller?.isConnected && elements.some(item => item.node === scanScroller)) {
          const axis = scanHorizontal ? 'left' : 'top';
          scanScroller.scrollTo({ [axis]: position.position - (scanHorizontal ? scanScroller.clientWidth : scanScroller.clientHeight) / 2, behavior: 'instant' });
        } else {
          window.scrollTo({ left: position.pageX, top: position.position - innerHeight / 2, behavior: 'instant' });
        }
      }
      try {
        if (leavingFullscreen) await leavingFullscreen;
        if (recovery.signal.aborted) return;
        let node = lens.gallery.connectedEntryNode(target, collection.scope);
        if (!node) restoreAnchor();
        const deadline = performance.now() + 2200;
        do {
          if (recovery.signal.aborted) return;
          node = lens.gallery.connectedEntryNode(target, collection.scope);
          if (!node && collection.scope?.isConnected) {
            const fresh = lens.gallery.collect(target.thumb, null, collection.scope);
            node = fresh.entries.find(entry => lens.gallery.sameEntry(target, entry))?.node;
          }
          if (node) { centerSourceNode(node); return; }
          await scanDelay(120, recovery.signal);
        } while (performance.now() < deadline);
        if (!recovery.signal.aborted) {
          const index = entries.indexOf(target);
          const nearby = entries.map((entry, n) => ({ entry, distance: Math.abs(n - index) }))
            .map(item => ({ ...item, node: lens.gallery.connectedEntryNode(item.entry, collection.scope) }))
            .filter(item => item.node).sort((a, b) => a.distance - b.distance)[0];
          if (nearby) centerSourceNode(nearby.node);
        }
      } finally { recovery.abort(); if (lens.returnController === recovery) lens.returnController = null; }
    }
    function status(text, retry = false) {
      message.replaceChildren();
      if (!retry) message.insertAdjacentHTML('afterbegin', flower);
      message.append(document.createTextNode(text)); message.hidden = false;
      if (retry) { const b = document.createElement('button'); b.textContent = t('retry'); b.onclick = () => { pool.retain(new Set()); show(index); }; message.append(b); }
    }
    function activeIndex() {
      if (!compareEnabled) return index;
      const selected = lockedPane === 0 ? compareRight : lockedPane === 1 ? compareLeft : activePane === 1 ? compareRight : compareLeft;
      return entries[selected] ? selected : (entries[compareLeft] ? compareLeft : Math.max(0, compareRight));
    }
    function activeSnapshot() {
      if (overviewOpen || reducedMotion.matches) return null;
      if (!compareEnabled) return pictureSnapshot(photo, stage.getBoundingClientRect());
      const side = activeIndex() === compareLeft ? 0 : 1;
      return pictureSnapshot(comparePhotos[side], comparePanes[side].getBoundingClientRect());
    }
    function updateCompareControls() {
      $('.compare-toggle').setAttribute('aria-pressed', String(compareEnabled));
      $('.compare-toggle').setAttribute('aria-label', t(compareEnabled ? 'singleView' : 'splitView'));
      $('.compare-toggle').title = t(compareEnabled ? 'singleView' : 'splitView');
      $('.compare-toggle').innerHTML = icon('compare');
      compare.classList.toggle('active', compareEnabled && !overviewOpen);
      compare.setAttribute('aria-hidden', String(!compareEnabled || overviewOpen));
      comparePanes.forEach((pane, side) => {
        const button = pane.querySelector('.pane-lock');
        const locked = lockedPane === side;
        const label = t(locked ? 'unlockPane' : 'lockPane');
        button.setAttribute('aria-pressed', String(locked));
        button.disabled = !compareDims[side];
        button.setAttribute('aria-label', label); button.title = label;
        button.innerHTML = icon(locked ? 'lock' : 'unlock');
      });
    }
    function updateOverviewButton() {
      const label = t(overviewOpen ? 'exitOverview' : 'overviewView');
      $('.overview-toggle').setAttribute('aria-label', label); $('.overview-toggle').title = `${label} (G)`;
      viewer.classList.toggle('in-overview', overviewOpen);
      $('.fit').setAttribute('aria-label', t(overviewOpen ? 'overviewSize' : 'zoom'));
      $('.fit').title = t(overviewOpen ? 'overviewSizeReset' : 'zoomCycle');
      $('.zoom-slider').setAttribute('aria-label', t(overviewOpen ? 'overviewSize' : 'zoomSlider'));
      updateRuler();
    }
    function transformCompare() {
      const rect = compare.getBoundingClientRect();
      const split = rect.width * dividerPosition;
      comparePanes[0].style.width = `${split}px`;
      comparePanes[1].style.left = `${split}px`;
      comparePanes[1].style.width = `${Math.max(0, rect.width - split)}px`;
      divider.style.left = `${split}px`;
      for (let side = 0; side < 2; side++) {
        const image = comparePhotos[side], dims = compareDims[side], pane = comparePanes[side];
        if (!dims) { image.hidden = true; continue; }
        const box = pane.getBoundingClientRect();
        const fitScale = Math.min(1, box.width / dims.width, box.height / dims.height);
        dims.fit = fitScale;
        const actualScale = fitScale * compareScale;
        const renderedWidth = dims.width * actualScale, renderedHeight = dims.height * actualScale;
        image.style.width = `${dims.width}px`; image.style.height = `${dims.height}px`;
        image.style.transform = `translate(-50%, -50%) translate(${comparePanX[side] * renderedWidth}px, ${comparePanY[side] * renderedHeight}px) scale(${actualScale})`;
        image.hidden = false;
      }
      stage.classList.toggle('zoomed', compareScale > 1 || comparePanX.some(Math.abs) || comparePanY.some(Math.abs));
      $('.fit').textContent = `${Math.round(compareScale * 100)}%`;
      updateRuler();
    }
    function transform() {
      if (overviewOpen) return;
      if (compareEnabled) { transformCompare(); return; }
      const rect = stage.getBoundingClientRect();
      const maxX = Math.max(0, (width * scale - rect.width) / 2);
      const maxY = Math.max(0, (height * scale - rect.height) / 2);
      photo.style.width = `${width}px`; photo.style.height = `${height}px`;
      photo.style.transform = `translate(-50%, -50%) translate(${panX}px, ${panY}px) scale(${scale})`;
      stage.classList.toggle('zoomed', maxX > 0 || maxY > 0);
      $('.fit').textContent = `${Math.round(scale * 100)}%`;
      updateRuler();
    }
    function updateRuler() {
      const value = overviewOpen ? settings.overviewScale : (compareEnabled ? compareScale : scale) * 100;
      if (!overviewOpen && !sliding) rulerMaximum = lens.controls.rulerMax(value);
      if (overviewOpen) $('.fit').textContent = `${value}%`;
      $('.zoom-slider').value = lens.controls.toPosition(value, rulerMaximum, overviewOpen);
      $('.zoom-slider').setAttribute('aria-valuetext', `${Math.round(value)}%`);
      const ticks = overviewOpen ? lens.controls.overviewTicks : [...lens.controls.ticks.slice(0, 4), rulerMaximum];
      ticks.forEach((tick, n) => {
        const button = $(`.zoom-ticks [data-tick="${n}"]`);
        button.textContent = tick;
        button.classList.toggle('over', !overviewOpen && n === 4 && tick > 100);
        button.setAttribute('aria-label', t(overviewOpen ? 'overviewSizeTo' : 'zoomTo', tick));
      });
      $('.zoom-control').classList.toggle('over', !overviewOpen && value > 100);
    }
    function setOverviewSize(percent) {
      const value = Math.round(Math.max(25, Math.min(300, percent)));
      if (value === settings.overviewScale) return;
      settings.overviewScale = value;
      rebuildOverviewItems = true;
      updateRuler();
      queueOverviewCommit();
      chrome.storage.local.set({ settings }).catch(() => {});
    }
    function fit(manual = true) {
      endHold();
      preset = null;
      if (compareEnabled) {
        if (!compareDims[0] && !compareDims[1]) return;
        compareScale = !manual && settings.zoomLocked && lockedScale !== null ? lockedScale : 1;
        if (settings.zoomLocked) lockedScale = compareScale;
        comparePanX = [0, 0]; comparePanY = [0, 0]; transform(); return;
      }
      if (!width || !height) return;
      const rect = stage.getBoundingClientRect();
      const fitted = Math.min(1, rect.width / width, rect.height / height);
      scale = !manual && settings.zoomLocked && lockedScale !== null ? lockedScale : fitted;
      if (settings.zoomLocked) lockedScale = scale;
      panX = panY = 0; transform();
    }
    function zoom(direction, clientX, clientY, units = 1) {
      endHold();
      if (compareEnabled) {
        if (!compareDims[0] && !compareDims[1]) return;
        const rect = compare.getBoundingClientRect();
        clientX ??= rect.left + rect.width / 2; clientY ??= rect.top + rect.height / 2;
        setScale(compareScale * Math.pow(1 + settings.zoomStep / 100, direction * units), clientX, clientY); return;
      }
      if (photo.hidden || !width) return;
      const rect = stage.getBoundingClientRect();
      clientX ??= rect.left + rect.width / 2; clientY ??= rect.top + rect.height / 2;
      setScale(scale * Math.pow(1 + settings.zoomStep / 100, direction * units), clientX, clientY);
    }
    function setScale(value, clientX, clientY) {
      endHold();
      preset = null;
      if (compareEnabled) {
        if (!compareDims[0] && !compareDims[1]) return;
        const previous = compareScale;
        compareScale = Math.max(.001, Math.min(5, value));
        const rect = compare.getBoundingClientRect();
        clientX ??= rect.left + rect.width / 2; clientY ??= rect.top + rect.height / 2;
        let side = clientX < rect.left + dividerPosition * rect.width ? 0 : 1;
        if (!compareDims[side]) side = compareDims[1 - side] ? 1 - side : side;
        if (lockedPane === null) activePane = side;
        const active = compareDims[side], paneRect = comparePanes[side].getBoundingClientRect();
        const qx = Math.max(0, Math.min(1, (clientX - paneRect.left) / Math.max(1, paneRect.width)));
        const qy = Math.max(0, Math.min(1, (clientY - paneRect.top) / Math.max(1, paneRect.height)));
        const oldW = active.width * active.fit * previous, oldH = active.height * active.fit * previous;
        const u = oldW ? Math.max(0, Math.min(1, .5 + ((qx - .5) * paneRect.width - comparePanX[side] * oldW) / oldW)) : .5;
        const v = oldH ? Math.max(0, Math.min(1, .5 + ((qy - .5) * paneRect.height - comparePanY[side] * oldH) / oldH)) : .5;
        for (let pane = 0; pane < 2; pane++) {
          const dims = compareDims[pane]; if (!dims) continue;
          const box = comparePanes[pane].getBoundingClientRect();
          const newW = dims.width * dims.fit * compareScale, newH = dims.height * dims.fit * compareScale;
          comparePanX[pane] = newW ? ((qx - .5) * box.width / newW) - (u - .5) : 0;
          comparePanY[pane] = newH ? ((qy - .5) * box.height / newH) - (v - .5) : 0;
        }
        transform(); if (settings.zoomLocked) lockedScale = compareScale; return;
      }
      if (photo.hidden || !width) return;
      const previous = scale;
      scale = Math.max(.001, Math.min(5, value));
      const rect = stage.getBoundingClientRect();
      clientX ??= rect.left + rect.width / 2; clientY ??= rect.top + rect.height / 2;
      const x = clientX - rect.left - rect.width / 2, y = clientY - rect.top - rect.height / 2;
      panX = x - (x - panX) * scale / previous; panY = y - (y - panY) * scale / previous;
      transform();
      if (settings.zoomLocked) lockedScale = scale;
    }
    function updateLock() {
      $('.zoom-lock').setAttribute('aria-pressed', String(settings.zoomLocked));
      $('.zoom-lock').setAttribute('aria-label', t(settings.zoomLocked ? 'unlockZoom' : 'lockZoom'));
      $('.zoom-lock').title = t(settings.zoomLocked ? 'unlockZoom' : 'lockZoom');
      $('.zoom-lock').innerHTML = icon(settings.zoomLocked ? 'lock' : 'unlock');
    }
    function updateFullscreenLabel() {
      const full = shadow.fullscreenElement === viewer || document.fullscreenElement === host || document.fullscreenElement === viewer;
      const label = t(full ? 'exitFullscreen' : 'enterFullscreen');
      $('.fullscreen').setAttribute('aria-label', label);
      $('.fullscreen').setAttribute('aria-pressed', String(full));
      $('.fullscreen').title = `${label} (F)`;
    }
    function bindPreferences() {
      preferencesBinding.abort();
      preferencesBinding = new AbortController();
      lens.preferences.bind(form, () => settings, savePreferences, preferencesBinding.signal);
    }
    function savePreferences(next) {
      const languageChanged = settings.language !== next.language;
      rebuildOverviewItems ||= overviewLayoutChanged(settings, next);
      settings = next; cacheNeighbors(); updateLock();
      viewer.classList.toggle('toolbar-auto', settings.toolbarAutoHide);
      dividerPosition = Math.max(settings.dividerMin / 100, Math.min(1 - settings.dividerMin / 100, dividerPosition));
      transform(); updateNavigationButtons();
      if (strip.classList.contains('visible')) renderStrip();
      if (overviewOpen) { updateRuler(); queueOverviewCommit(); }
      chrome.storage.local.set({ settings }).then(async () => {
        $('.pref-error').hidden = true;
        if (languageChanged) await refreshLanguage();
      }, () => { $('.pref-error').textContent = t('saveFailed'); $('.pref-error').hidden = false; });
    }
    async function refreshLanguage() {
      const wasOpen = !form.hidden;
      const focusedName = shadow.activeElement?.name;
      await lens.i18n.setLanguage(settings.language);
      host.lang = lens.i18n.locale.replace('_', '-');
      dialog.setAttribute('aria-label', t('viewerTitle'));
      viewer.setAttribute('aria-label', t('viewerRegion'));
      $('.fit').setAttribute('aria-label', t('zoom'));
      $('.fit').title = t('zoomCycle');
      $('.zoom-slider').setAttribute('aria-label', t('zoomSlider'));
      $('.preferences').setAttribute('aria-label', t('settingsTitle'));
      $('.preferences').title = t('settingsTitle');
      $('.close').setAttribute('aria-label', t('closeViewer'));
      $('.close').title = `${t('closeViewer')} (Esc)`;
      $('.compare-toggle').setAttribute('aria-label', t(compareEnabled ? 'singleView' : 'splitView'));
      $('.compare-toggle').title = t(compareEnabled ? 'singleView' : 'splitView');
      $('.overview-toggle').setAttribute('aria-label', t(overviewOpen ? 'exitOverview' : 'overviewView'));
      $('.overview-toggle').title = t(overviewOpen ? 'exitOverview' : 'overviewView');
      $('.overview').setAttribute('aria-label', t('overviewTitle'));
      $('.prev').setAttribute('aria-label', t('previous'));
      $('.prev').title = `${t('previous')} (←)`;
      $('.next').setAttribute('aria-label', t('next'));
      $('.next').title = `${t('next')} (→)`;
      $('.strip').setAttribute('aria-label', t('nearby'));
      $('.thumbs').setAttribute('aria-label', t('thumbnails'));
      updateLock(); updateFullscreenLabel(); updateCompareControls(); updateRuler(); updateEdgePreviews();
      updateOverviewButton();
      if (!message.hidden && photo.hidden) status(t(message.querySelector('button') ? 'loadFailed' : 'loading'), Boolean(message.querySelector('button')));
      if (width && height) $('.sr').textContent = t('imageCount', index + 1, entries.length);
      form.innerHTML = lens.preferences.html;
      bindPreferences();
      form.hidden = !wasOpen;
      lens.preferences.fill(form, settings);
      if (wasOpen && focusedName === 'language') form.querySelector('[name="language"]').focus();
      if (strip.classList.contains('visible')) renderStrip();
      if (overviewOpen) renderOverview();
      updateEdgePreviews();
    }
    function cacheNeighbors() {
      const keys = new Set(); const nearby = [];
      const centers = compareEnabled ? [compareLeft, compareRight] : [index];
      for (const center of centers) {
        for (let offset = 0; offset <= Math.max(settings.cacheBefore, settings.cacheAfter); offset++) {
          for (const n of offset === 0 ? [center] : [center - offset, center + offset]) {
            if (n < 0 || n >= entries.length || n < center - settings.cacheBefore || n > center + settings.cacheAfter) continue;
            if (keys.has(entries[n].key)) continue;
            keys.add(entries[n].key); nearby.push(entries[n]);
          }
        }
      }
      pool.retain(keys);
      for (const entry of nearby) pool.get(entry, centers.includes(entries.findIndex(item => item.key === entry.key)));
    }
    function renderStrip() {
      const container = $('.thumbs');
      container.replaceChildren();
      // Empty slots preserve the current image's central position at album edges.
      for (let offset = -settings.previewBefore; offset <= settings.previewAfter; offset++) {
        const n = index + offset, entry = entries[n];
        const b = document.createElement('button'); b.type = 'button'; b.className = 'thumb';
        if (!entry) { b.classList.add('empty'); b.tabIndex = -1; b.setAttribute('aria-hidden', 'true'); }
        else {
          b.setAttribute('aria-label', t('viewImage', n + 1) + (entry.title ? `: ${entry.title}` : ''));
          if ((compareEnabled && (n === compareLeft || n === compareRight)) || (!compareEnabled && n === index)) { b.classList.add('current'); b.setAttribute('aria-current', 'true'); }
          const img = new Image(); img.alt = ''; img.src = entry.thumb; img.draggable = false;
          const label = document.createElement('span'); label.textContent = n + 1;
          b.append(img, label); b.onclick = () => show(n);
        }
        container.append(b);
      }
      $('.strip-count').textContent = compareEnabled && compareRight >= 0 ? `${compareLeft + 1}–${compareRight + 1} / ${entries.length}` : `${index + 1} / ${entries.length}`;
      requestAnimationFrame(() => {
        const current = container.querySelector('.current');
        if (current) container.scrollLeft = current.offsetLeft - container.offsetLeft - container.clientWidth / 2 + current.clientWidth / 2;
      });
    }
    function showStrip(visible) {
      if (overviewOpen) visible = false;
      if (visible) { if (!strip.classList.contains('visible')) renderStrip(); strip.classList.add('visible'); viewer.classList.add('strip-open'); }
      else { strip.classList.remove('visible'); viewer.classList.remove('strip-open'); }
    }
    function updateEdgePreviews() {
      const active = !compareEnabled ? index : lockedPane === 0 ? compareRight : lockedPane === 1 ? compareLeft : activePane === 1 ? compareRight : compareLeft;
      const fixed = lockedPane === 0 ? compareLeft : lockedPane === 1 ? compareRight : -1;
      const target = direction => {
        let value = active + direction * (compareEnabled && lockedPane === null ? settings.compareStep : 1);
        if (compareEnabled && lockedPane !== null && value === fixed) value += direction;
        return value;
      };
      for (const [selector, n] of [['.prev', target(-1)], ['.next', target(1)]]) {
        const button = $(selector), entry = entries[n];
        const image = button.querySelector('.edge-preview img');
        button.querySelector('small').textContent = entry ? t('imageCount', n + 1, entries.length) : '';
        if (entry && button.classList.contains('pointer-preview')) image.src = entry.thumb;
        else image.removeAttribute('src');
      }
    }
    function updateNavigationButtons() {
      const active = !compareEnabled ? index : lockedPane === 0 ? compareRight : lockedPane === 1 ? compareLeft : activePane === 1 ? compareRight : compareLeft;
      const fixed = lockedPane === 0 ? compareLeft : lockedPane === 1 ? compareRight : -1;
      for (const [selector, direction] of [['.prev', -1], ['.next', 1]]) {
        let target = active + direction * (compareEnabled && lockedPane === null ? settings.compareStep : 1);
        if (compareEnabled && lockedPane !== null && target === fixed) target += direction;
        const invalid = target < 0 || target >= entries.length || (compareEnabled && lockedPane === null && target + 1 >= entries.length);
        $(selector).disabled = invalid && (!collection.scope || scanStates[direction].ended);
      }
      updateEdgePreviews();
    }
    function overviewEdgeDistance(side) {
      const horizontal = overview.classList.contains('horizontal');
      const offset = horizontal ? overview.scrollLeft : overview.scrollTop;
      return side < 0 ? offset : (horizontal ? overview.scrollWidth - overview.clientWidth : overview.scrollHeight - overview.clientHeight) - offset;
    }
    function overviewSourceLoads(side, window = overviewCacheWindow()) {
      const state = scanStates[side];
      if (!collection.scope?.isConnected || !scanController || scanController.signal.aborted || scanningDirection !== side || !state.sourceLoading) return false;
      const target = state.loadingNode;
      if (!target?.isConnected || target.complete || !(target.currentSrc || target.getAttribute('src'))) return false;
      const start = side < 0 ? window.start : Math.min(overviewItems.length, window.last + 1);
      const end = side < 0 ? Math.min(window.first, window.end + 1) : window.end + 1;
      return overviewItems.slice(start, end).some(item => {
        const node = item.entry?.node || item.slotNode;
        return node?.isConnected && (node === target || node.contains?.(target) || target.contains?.(node));
      });
    }
    function overviewScanDemandSatisfied(side) {
      if (!overviewOpen) return true;
      if (side < 0 && settings.overviewCacheBeforeMode === 'auto' && !overviewBackwardExpanded && !overviewBackwardProbeCompleted) return false;
      const window = overviewCacheWindow();
      const items = side < 0 ? overviewItems.slice(window.start, window.last + 1) : overviewItems.slice(window.first, window.end + 1);
      const allReady = items.every(item => {
        if (!item.entry || !item.thumb) return !overviewSlotPending(item, side);
        const job = overviewThumbJobs.get(item.key);
        // An existing URL is work for the thumbnail queue. Scanning the page
        // cannot make an in-flight decode or failed thumbnail request finish.
        return job?.source === item.thumb;
      });
      const countReady = !overviewNeedsDiscovery(side, window) || scanStates[side].ended;
      return allReady && countReady;
    }
    function overviewSlotPending(item, side) {
      return Boolean(item && !item.entry && item.slotKey && (scanStates[side]?.slotAttempts.get(item.slotKey) || 0) < 3);
    }
    function scanSlotPending(slot, side, projectedSlots) {
      if (!slot?.pending) return false;
      if (!overviewOpen) return true;
      const item = projectedSlots.get(slot.key);
      // Only unresolved slots represented in the active overview projection
      // are cache demand. Older or truncated source slots must not hold the
      // current viewport in a loading state indefinitely.
      return item?.slotNode === slot.node && overviewSlotPending(item, side);
    }
    function overviewPendingForSide(side, pendingBefore, pendingVisible, pendingAfter, activeDirection) {
      return side < 0 ? pendingBefore || (pendingVisible && activeDirection < 0)
        : pendingAfter || (pendingVisible && activeDirection > 0);
    }
    function scrollSourceTo(position) {
      if (scanScroller) scanScroller.scrollTo({
        left: scanHorizontal ? position : scanScroller.scrollLeft,
        top: scanHorizontal ? scanScroller.scrollTop : position,
        behavior: 'instant'
      });
      else window.scrollTo({ left: pagePosition.x, top: position, behavior: 'instant' });
      return sourcePosition();
    }
    function scanResolvedSnapshot() {
      const entryKeys = new Set(), sources = new Set(), slotKeys = new Set(), positions = [];
      for (const entry of entries) {
        for (const value of [entry.key, ...(entry.aliases || []), ...(entry.sources || []).map(lens.gallery.key)]) if (value) entryKeys.add(value);
      }
      for (const slot of collection.slots || []) {
        slotKeys.add(slot.key);
        const rawPosition = slot.node.getAttribute('aria-posinset') || slot.node.getAttribute('aria-rowindex');
        const position = Number(rawPosition);
        if (Number.isInteger(position) && position > 0) positions.push(position);
        const media = [slot.node, ...slot.node.querySelectorAll('img, [role="img"], [data-bg], [data-background], [data-background-image], [data-image], [data-image-src]')];
        for (const node of media) for (const source of lens.gallery.sources(node)) {
          if (!/^data:image\/(?:gif|svg\+xml)/i.test(source)) sources.add(lens.gallery.key(source));
        }
      }
      return { entries: entryKeys, sources, slotKeys, minPosition: positions.length ? Math.min(...positions) : null, maxPosition: positions.length ? Math.max(...positions) : null };
    }
    function scanResolvedProgress(before, after) {
      for (const key of after.entries) if (!before.entries.has(key)) return true;
      for (const source of after.sources) if (!before.sources.has(source)) return true;
      for (const key of after.slotKeys) if (!before.slotKeys.has(key)) return true;
      return false;
    }
    function scanViewportSourceLoad(direction, state, viewport, origin) {
      const cursor = state.cursor;
      return [...collection.scope.querySelectorAll('img')].find(image => {
        const source = image.currentSrc || image.getAttribute('src');
        if (!source || image.complete || !lens.gallery.sources(image).length) return false;
        const box = image.getBoundingClientRect();
        const position = sourcePosition() + (scanHorizontal ? box.left - (origin?.left || 0) : box.top - (origin?.top || 0));
        return direction < 0
          ? position <= cursor + viewport * .65 && position >= cursor - viewport * 1.25
          : position >= cursor - viewport * .65 && position <= cursor + viewport * 1.25;
      }) || null;
    }
    function overviewHasPendingSlots(side, window = overviewCacheWindow()) {
      const start = side < 0 ? window.start : Math.min(overviewItems.length, window.last + 1);
      const end = side < 0 ? Math.min(window.first, window.end + 1) : window.end + 1;
      return overviewItems.slice(start, end).some(item => overviewSlotPending(item, side));
    }
    function overviewThumbnailFailures(window = overviewCacheWindow(), side = 0) {
      const failed = [];
      const start = side < 0 ? window.start : side > 0 ? Math.max(window.start, window.last + 1) : window.start;
      const end = side < 0 ? Math.min(window.end, window.first - 1) : side > 0 ? window.end : window.end;
      for (let index = start; index <= end; index++) {
        const item = overviewItems[index], job = item && overviewThumbJobs.get(item.key);
        if (job?.status === 'error') failed.push(index);
      }
      return failed;
    }
    function overviewThumbnailLoads(window = overviewCacheWindow(), side = 0) {
      const start = side < 0 ? window.start : side > 0 ? Math.max(window.start, window.last + 1) : window.start;
      const end = side < 0 ? Math.min(window.end, window.first - 1) : side > 0 ? window.end : window.end;
      for (let index = start; index <= end; index++) {
        const item = overviewItems[index], job = item && overviewThumbJobs.get(item.key);
        if (job && ['loading', 'decoding'].includes(job.status)) return true;
      }
      return false;
    }
    function updateOverviewStatus() {
      if (!overviewOpen) return;
      const window = overviewCacheWindow();
      for (const side of [-1, 1]) {
        const label = $(`.overview-status[data-side="${side}"]`);
        const state = scanStates[side];
        const loading = Boolean(scanController && !scanController.signal.aborted && scanningDirection === side);
        const silentBackward = side < 0 && settings.overviewCacheBeforeMode === 'auto' && !overviewBackwardExpanded && !state.ended;
        const nearThumbnailError = overviewThumbnailFailures(window, side).length > 0;
        const pending = overviewHasPendingSlots(side, window);
        const sourceLoading = overviewSourceLoads(side, window);
        const thumbnailLoading = overviewThumbnailLoads(window, side);
        const key = state.ended ? (side < 0 ? 'overviewStart' : 'overviewEnd')
          : silentBackward ? ''
          : loading && thumbnailLoading ? 'overviewLoading'
          : loading && sourceLoading ? 'overviewLoading'
          : loading ? 'overviewDiscovering'
          : nearThumbnailError ? 'overviewThumbFailed'
          : state.resourceErrors ? 'overviewSourceFailed'
          : state.failed ? 'overviewScanFailed'
          : thumbnailLoading ? 'overviewLoading'
          : state.paused ? (state.resourceErrors ? 'overviewSourceFailed' : 'overviewPaused')
          : sourceLoading ? 'overviewLoading'
          : pending || state.phase === 'waiting-trigger' ? 'overviewWaitingTrigger'
          : '';
        label.hidden = !key;
        const text = key ? t(key) : '';
        const showFlower = key === 'overviewDiscovering' || key === 'overviewLoading';
        if (label.textContent !== text || Boolean(label.querySelector('.loading-flower')) !== showFlower) {
          label.replaceChildren();
          if (showFlower) label.insertAdjacentHTML('afterbegin', flower);
          label.append(document.createTextNode(text));
        }
      }
    }
    function resetOverviewEdge(animate = false, bounce = false) {
      if (animate && overviewPress) return;
      clearTimeout(edgeTimer);
      const from = overview.style.translate || '0px';
      const side = edgeSide;
      edgeAnimation?.cancel(); edgeAnimation = null;
      edgeSide = edgePull = 0; overview.style.translate = '';
      if (animate && from !== '0px' && !reducedMotion.matches) {
        const reverse = overview.classList.contains('horizontal') ? `${side * 2}px 0px` : `0px ${side * 2}px`;
        edgeAnimation = overview.animate(bounce
          ? [{ translate: from }, { translate: reverse, offset: .72 }, { translate: '0px 0px' }]
          : [{ translate: from }, { translate: '0px 0px' }], { duration: bounce ? 310 : 160, easing: 'cubic-bezier(.15,.72,.25,1)' });
      }
    }
    function pushOverviewEdge(side, amount) {
      const ended = scanStates[side].ended || !collection.scope;
      const loading = scanController && !scanController.signal.aborted && scanningDirection === side;
      if (reducedMotion.matches || (!ended && !loading && !scanStates[side].paused && !scanStates[side].failed)) { updateOverviewStatus(); return; }
      edgeAnimation?.cancel(); edgeAnimation = null;
      if (edgeSide && edgeSide !== side) resetOverviewEdge();
      edgeSide = side;
      const horizontal = overview.classList.contains('horizontal');
      const limit = ended ? Math.min(64, (horizontal ? overview.clientWidth : overview.clientHeight) * .08) : 18;
      if (!limit) return;
      edgePull = Math.min(limit, edgePull + Math.min(24, amount) * .28 * (1 - edgePull / limit));
      const displacement = -side * edgePull;
      overview.style.translate = horizontal ? `${displacement}px 0px` : `0px ${displacement}px`;
      clearTimeout(edgeTimer);
      if (ended) edgeTimer = setTimeout(() => resetOverviewEdge(true, true), 95);
      updateOverviewStatus();
    }
    function overviewEdgeIntent(side, amount, kind = 'wheel') {
      side = Math.sign(Number(side));
      amount = Math.min(24, Math.max(0, Number(amount) || 0));
      if (!side || !amount || !overviewOpen || closed) return false;
      const state = scanStates[side];
      const now = performance.now(), intent = overviewEdgeIntentState;
      const ended = state.ended;
      pushOverviewEdge(side, amount);
      if (!lens.controls.overviewRetryIntent(intent, side, amount, now)) return false;
      if (scanPromise) { state.paused = state.failed = false; return false; }
      if (ended) {
        state.ended = false; state.phase = 'idle';
      }
      state.paused = state.failed = false;
      state.resourceErrors = 0;
      state.slotAttempts.clear();
      updateOverviewThumbnails(true);
      return scanMore(side, true, Math.max(6, Math.min(24, overviewBandSize * 2))) || false;
    }
    function scanSlotSignature() {
      return (collection.slots || []).map(slot => {
        const media = [slot.node, ...slot.node.querySelectorAll('img, [role="img"], [data-bg], [data-background], [data-background-image], [data-image], [data-image-src]')];
        const sources = media.map(node => lens.gallery.sources(node).join(',')).join(';');
        const order = slot.node.getAttribute('aria-posinset') || slot.node.getAttribute('aria-rowindex') || '';
        const total = slot.node.getAttribute('aria-setsize') || collection.scope?.getAttribute('aria-setsize') || '';
        return `${slot.key}:${order}:${total}:${slot.pending ? 1 : 0}:${sources}`;
      }).join('|');
    }
    function scanOneSlotSignature(slot) {
      if (!slot?.node?.isConnected) return '';
      const media = [slot.node, ...slot.node.querySelectorAll('img, [role="img"], [data-bg], [data-background], [data-background-image], [data-image], [data-image-src]')];
      const sources = media.map(node => lens.gallery.sources(node).map(lens.gallery.key).join(',')).join(';');
      return `${slot.pending ? 1 : 0}:${sources}`;
    }
    function explicitScanBoundary(direction) {
      const slots = collection.slots || [];
      if (slots.length < 2 || slots.some(slot => !slot.node?.isConnected || !slot.stable)) return false;
      if (scanSourceFailureCount(0) > 0) return false;
      const positions = slots.map(slot => Number(slot.node.getAttribute('aria-posinset') || slot.node.querySelector('[aria-posinset]')?.getAttribute('aria-posinset')));
      const totals = slots.map(slot => Number(slot.node.getAttribute('aria-setsize') || slot.node.querySelector('[aria-setsize]')?.getAttribute('aria-setsize') || collection.scope?.getAttribute('aria-setsize')));
      if (positions.some(value => !Number.isInteger(value) || value < 1) || totals.some(value => !Number.isInteger(value) || value < 2)) return false;
      const total = totals[0];
      if (totals.some(value => value !== total) || positions.length !== total || new Set(positions).size !== total) return false;
      const sorted = [...positions].sort((a, b) => a - b);
      if (sorted.some((value, index) => value !== index + 1)) return false;
      const hasPending = slots.some(slot => slot.pending);
      if (hasPending) return false;
      const entrySlots = new Set(entries.filter(entry => entry.slotStable && entry.slotNode?.isConnected).map(entry => entry.slotKey));
      if (slots.some(slot => !entrySlots.has(slot.key))) return false;
      return direction < 0 ? Math.min(...positions) === 1 : Math.max(...positions) === total;
    }
    function scanSourceFailureCount(direction) {
      const viewport = scanScroller ? scanHorizontal ? scanScroller.clientWidth : scanScroller.clientHeight : innerHeight;
      const origin = scanScroller?.getBoundingClientRect();
      const cursor = sourcePosition();
      let failures = 0;
      for (const slot of collection.slots || []) {
        const box = slot.node?.getBoundingClientRect();
        if (!box) continue;
        const position = cursor + (scanHorizontal ? box.left - (origin?.left || 0) : box.top - (origin?.top || 0));
        if (direction && (direction < 0 ? position > cursor + viewport * .6 : position < cursor - viewport * .6)) continue;
        failures += [...slot.node.querySelectorAll('img')].filter(image => {
          const current = image.currentSrc || image.getAttribute('src') || '';
          return Boolean(current) && image.complete && image.naturalWidth < 1 &&
            !/^data:image\/(?:gif|svg\+xml)/i.test(current) && lens.gallery.sources(image).length > 0;
        }).length;
      }
      return failures;
    }
    function centralOverviewIndex() {
      const item = centralOverviewItem();
      const position = item ? entries.findIndex(entry => entry.key === item.entry?.key) : -1;
      return position < 0 ? activeIndex() : position;
    }
    function centralOverviewItem() {
      const rect = overview.getBoundingClientRect();
      const grid = overviewGrid.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      let best = null, bestDistance = Infinity, nearest = null, nearestDistance = Infinity;
      for (const card of overviewGrid.children) {
        const item = overviewItems[Number(card.dataset.index)];
        if (!item?.entry) continue;
        const b = overviewCardBox(card, grid);
        const distance = (b.left + b.width / 2 - cx) ** 2 + (b.top + b.height / 2 - cy) ** 2;
        if (distance < nearestDistance) { nearest = item; nearestDistance = distance; }
        if (distance < bestDistance && b.right > rect.left && b.left < rect.right && b.bottom > rect.top && b.top < rect.bottom) {
          best = item; bestDistance = distance;
        }
      }
      return best || nearest;
    }
    function captureOverviewAnchor() {
      const card = overviewCards.get(centralOverviewItem()?.key);
      if (!card) return overviewAnchor;
      const box = overviewCardBox(card), rect = overview.getBoundingClientRect();
      if (!rect.width || !rect.height) return overviewAnchor;
      return { key: card.dataset.key, x: (box.left + box.width / 2 - rect.left) / rect.width, y: (box.top + box.height / 2 - rect.top) / rect.height };
    }
    function restoreOverviewAnchor(anchor) {
      const card = anchor && overviewCards.get(anchor.key);
      if (!card) return;
      const box = overviewCardBox(card), rect = overview.getBoundingClientRect();
      if (settings.overviewDirection === 'horizontal') overview.scrollLeft += box.left + box.width / 2 - rect.left - anchor.x * rect.width;
      else overview.scrollTop += box.top + box.height / 2 - rect.top - anchor.y * rect.height;
      lastOverviewOffset = settings.overviewDirection === 'horizontal' ? overview.scrollLeft : overview.scrollTop;
    }
    function overviewCardBox(card, grid = overviewGrid.getBoundingClientRect()) {
      const left = grid.left + (parseFloat(card.style.left) || 0), top = grid.top + (parseFloat(card.style.top) || 0);
      const width = parseFloat(card.style.width) || 0, height = parseFloat(card.style.height) || 0;
      return { left, top, width, height, right: left + width, bottom: top + height };
    }
    function queueOverviewCommit() {
      if (!overviewOpen) return;
      overviewDirty = true;
      if (overviewPress) return;
      overviewCommitStarted ||= performance.now();
      clearTimeout(overviewCommitTimer);
      overviewCommitTimer = setTimeout(() => renderOverview(), Math.max(0, Math.min(16, 80 - (performance.now() - overviewCommitStarted))));
    }
    function overviewLayoutChanged(before, after) {
      return ['overviewDirection', 'overviewClean', 'overviewAlignment', 'overviewGap', 'overviewScale'].some(key => before[key] !== after[key]);
    }
    function ratioRank(source) {
      return source === 'intrinsic' || source === 'decoded' ? 4
        : source === 'declared' ? 3
        : source === 'measured' || source === 'slot' ? 2
        : 1;
    }
    function ratioFromEntry(entry) {
      const ratio = Number(entry?.aspectRatio);
      const source = entry?.aspectRatioSource || (entry?.dimensions ? 'intrinsic' : 'measured');
      return { ratio: Number.isFinite(ratio) && ratio > 0 ? ratio : 4 / 3, source };
    }
    function ratioFromSlot(slot) {
      const nodes = [slot?.node, ...(slot?.node?.querySelectorAll?.('img, [role="img"], picture, [data-image], [data-image-src]') || [])].filter(Boolean);
      for (const node of nodes) {
        const width = Number(node.getAttribute?.('width')), height = Number(node.getAttribute?.('height'));
        if (width > 0 && height > 0) return { ratio: width / height, source: 'declared' };
        const declared = getComputedStyle(node).aspectRatio?.match(/^\s*([\d.]+)\s*\/\s*([\d.]+)\s*$/);
        if (declared && Number(declared[1]) > 0 && Number(declared[2]) > 0) return { ratio: Number(declared[1]) / Number(declared[2]), source: 'declared' };
        const rect = node.getBoundingClientRect?.();
        if (rect?.width > 0 && rect?.height > 0) return { ratio: rect.width / rect.height, source: 'slot' };
      }
      return { ratio: 4 / 3, source: 'fallback' };
    }
    function layoutRatio(previous, entry, slot) {
      const next = entry ? ratioFromEntry(entry) : ratioFromSlot(slot);
      if (!previous || !Number.isFinite(previous.layoutRatio) || previous.layoutRatio <= 0) {
        return { layoutRatio: next.ratio, layoutRatioSource: next.source, lane: previous?.lane ?? null, bandKey: previous?.bandKey ?? null };
      }
      const previousRank = ratioRank(previous.layoutRatioSource);
      const nextRank = ratioRank(next.source);
      if (nextRank > previousRank) return { layoutRatio: next.ratio, layoutRatioSource: next.source, lane: previous.lane ?? null, bandKey: previous.bandKey ?? null };
      return { layoutRatio: previous.layoutRatio, layoutRatioSource: previous.layoutRatioSource, lane: previous.lane ?? null, bandKey: previous.bandKey ?? null };
    }
    function collectOverviewItems(rebuild) {
      const knownEntries = new Map(overviewItems.filter(item => item.entry).map(item => [item.entry.key, item]));
      const reserved = new Map(overviewItems.filter(item => !item.entry && item.slotKey).map(item => [item.slotKey, item]));
      const activeSlots = collection.slots || [];
      const slotsByKey = new Map(activeSlots.map(slot => [slot.key, slot]));
      const claimedSlots = new Set();
      const candidates = entries.map(entry => {
        const slot = slotsByKey.get(entry.slotKey);
        const canFill = slot && slot.node === entry.slotNode && entry.node?.isConnected && !claimedSlots.has(slot.key);
        if (canFill) claimedSlots.add(slot.key);
        const previous = knownEntries.get(entry.key) || (canFill ? reserved.get(slot.key) : null);
        return { key: previous?.key || entry.key, entry, thumb: entry.thumb,
          slotKey: entry.slotKey, slotNode: entry.slotNode, ...layoutRatio(previous, entry, slot) };
      });
      const entryAtSlot = new Map();
      for (const item of candidates) {
        if (item.slotKey && slotsByKey.get(item.slotKey)?.node === item.slotNode && item.entry.node?.isConnected && !entryAtSlot.has(item.slotKey)) {
          entryAtSlot.set(item.slotKey, item);
        }
      }
      let next = null;
      const nextItems = activeSlots.map(() => null);
      for (let i = activeSlots.length - 1; i >= 0; i--) {
        nextItems[i] = next; next = entryAtSlot.get(activeSlots[i].key) || next;
      }
      const before = new Map(), after = new Map();
      let previous = null;
      activeSlots.forEach((slot, i) => {
        const item = entryAtSlot.get(slot.key);
        if (item) { previous = item; return; }
        if (!slot.pending || !slot.node?.isConnected || (!previous && !nextItems[i])) return;
        const list = previous ? after : before, key = (previous || nextItems[i]).key;
        if (!list.has(key)) list.set(key, []);
        const old = reserved.get(slot.key);
        list.get(key).push({ key: old?.key || `reserved:${slot.key}`,
          entry: null, thumb: '', slotKey: slot.key, slotNode: slot.node, slotStable: slot.stable,
          ...layoutRatio(old, null, slot) });
      });
      // The source scanner keeps all slots, but a site's long reserved tail
      // must not turn into hundreds of unselectable cards or fake cache space.
      const placeholderRun = 24;
      const reservations = (items, leading) => (items || []).some(item => item.slotStable) ? items :
        (items || []).slice(leading ? -placeholderRun : 0, leading ? undefined : placeholderRun);
      const desired = candidates.flatMap(item => [...reservations(before.get(item.key), true),
        item, ...reservations(after.get(item.key), false)]);
      if (rebuild || !overviewItems.length) overviewStartOrdinal = 0;
      else {
        const previousIndices = new Map(overviewItems.map((item, index) => [item.key, index]));
        const shared = desired.findIndex(item => previousIndices.has(item.key));
        if (shared >= 0) overviewStartOrdinal += previousIndices.get(desired[shared].key) - shared;
      }
      // Entries already have a stable source order from mergeEntries(). Keep
      // their existing nodes and lane hints, including when new items land
      // between two known cards. Removed source slots no longer take space.
      return desired;
    }
    function renderOverview(anchor, rebuild = false) {
      if (!overviewOpen) return;
      if (overviewPress) { overviewDirty = true; return; }
      clearTimeout(overviewCommitTimer);
      overviewCommitTimer = overviewCommitStarted = 0;
      overviewDirty = false;
      anchor ??= overviewLayoutAnchor ?? (overviewGrid.children.length ? captureOverviewAnchor() : overviewAnchor);
      overviewLayoutAnchor = null;
      if (rebuild || rebuildOverviewItems) overviewGeometry = '';
      overviewItems = collectOverviewItems(rebuild || rebuildOverviewItems);
      rebuildOverviewItems = false;
      const currentKeys = new Set(compareEnabled ? [entries[compareLeft]?.key, entries[compareRight]?.key] : [entries[index]?.key]);
      const live = new Set(overviewItems.map(item => item.key));
      for (const [key, card] of overviewCards) if (!live.has(key)) { card.remove(); overviewCards.delete(key); }
      let cursor = overviewGrid.firstElementChild;
      overviewItems.forEach((item, n) => {
        const { key, entry, thumb } = item;
        let card = overviewCards.get(key);
        if (!card) {
          card = document.createElement('button'); card.type = 'button'; card.className = 'overview-card';
          const image = document.createElement('img'); image.alt = ''; image.loading = 'lazy'; image.decoding = 'async'; image.draggable = false;
          const label = document.createElement('span'); card.append(image, label);
          overviewCards.set(key, card);
        }
        if (card.dataset.index !== String(n)) card.dataset.index = String(n);
        if (card.dataset.key !== key) card.dataset.key = key;
        const label = entry ? t('viewImage', n + 1) + (entry.title ? `: ${entry.title}` : '') : t('overviewWaitingTrigger');
        if (card.getAttribute('aria-label') !== label) card.setAttribute('aria-label', label);
        const current = String(currentKeys.has(entry?.key)), disabled = String(!entry);
        if (card.getAttribute('aria-current') !== current) card.setAttribute('aria-current', current);
        if (card.getAttribute('aria-disabled') !== disabled) card.setAttribute('aria-disabled', disabled);
        card.disabled = !entry;
        if (card.tabIndex !== (entry ? 0 : -1)) card.tabIndex = entry ? 0 : -1;
        const image = card.querySelector('img');
        if (image.dataset.src !== thumb) image.dataset.src = thumb;
        const caption = card.querySelector('span'), countLabel = t('imageCount', n + 1, overviewItems.length);
        if (caption.textContent !== countLabel) caption.textContent = countLabel;
        if (card !== cursor) overviewGrid.insertBefore(card, cursor);
        cursor = card.nextElementSibling;
      });
      layoutOverview(anchor);
      updateOverviewThumbnails();
      $('.counter').textContent = `${entries.length}`;
      if (edgeSide && overviewEdgeDistance(edgeSide) > 2) resetOverviewEdge(true);
      updateOverviewStatus();
      requestAnimationFrame(() => checkOverviewCache());
    }
    function layoutOverview(anchor = captureOverviewAnchor()) {
      if (!overviewOpen) return;
      const horizontal = settings.overviewDirection === 'horizontal';
      if (overview.classList.contains('horizontal') !== horizontal) { resetOverviewEdge(); overview.scrollTop = 0; overview.scrollLeft = 0; }
      overview.classList.toggle('horizontal', horizontal); overview.classList.toggle('clean', settings.overviewClean);
      const style = getComputedStyle(overview);
      const width = Math.max(1, overview.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
      const height = Math.max(1, overview.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom));
      const config = JSON.stringify([width, height, horizontal, settings.overviewClean, settings.overviewAlignment,
        settings.overviewGap, settings.overviewScale]);
      if (overviewLayoutConfig !== config) {
        for (const item of overviewItems) { item.lane = null; item.bandKey = null; }
        overviewLayoutConfig = config;
        overviewGeometry = '';
      }
      const geometry = `${config}|${overviewItems.map(item => `${item.key}:${item.layoutRatio}:${item.lane ?? ''}:${item.bandKey ?? ''}`).join('|')}`;
      if (overviewGeometry === geometry && [...overviewGrid.children].every(card => card.style.width)) return;
      overviewGeometry = geometry;
      const layout = lens.controls.overviewLayout(overviewItems.map(item => item.layoutRatio), width, height, horizontal,
        settings.overviewClean, settings.overviewAlignment, settings.overviewGap, settings.overviewScale, overviewStartOrdinal,
        { lanes: overviewItems.map(item => item.lane), bands: overviewItems.map(item => item.bandKey) });
      overviewBandSize = layout.bandSize || 1;
      [...overviewGrid.children].forEach((card, n) => {
        const box = layout.boxes[n];
        card.dataset.band = String(box.bandIndex);
        overviewItems[n].lane = layout.lanes[n];
        overviewItems[n].bandKey = layout.bandIds[n];
        const bounds = { left: box.x, top: box.y, width: box.width, height: box.height };
        for (const [name, value] of Object.entries(bounds)) if (card.style[name] !== `${value}px`) card.style[name] = `${value}px`;
      });
      overviewGrid.style.width = `${layout.width}px`; overviewGrid.style.height = `${layout.height}px`;
      restoreOverviewAnchor(anchor);
    }
    function overviewVisibleRange(rect = overview.getBoundingClientRect()) {
      const grid = overviewGrid.getBoundingClientRect();
      let first = -1, last = -1;
      // Adaptive masonry has variable main-axis lengths and interleaves lane
      // indexes, so use actual rectangles and a contiguous conservative range.
      for (const card of overviewGrid.children) {
        const box = overviewCardBox(card, grid);
        if (box.right <= rect.left || box.left >= rect.right || box.bottom <= rect.top || box.top >= rect.bottom) continue;
        const index = Number(card.dataset.index);
        if (!Number.isInteger(index)) continue;
        first = first < 0 ? index : Math.min(first, index);
        last = Math.max(last, index);
      }
      return { first, last };
    }
    function overviewCacheCount(side) {
      const mode = settings[`overviewCache${side}Mode`];
      if (mode === 'custom') return settings[`overviewCache${side}`];
      const bands = side === 'Before' && !overviewBackwardExpanded ? 1 : 2;
      return Math.max(1, overviewBandSize) * bands;
    }
    function activateOverviewBackward() {
      if (settings.overviewCacheBeforeMode !== 'auto' || overviewBackwardExpanded) return;
      overviewBackwardExpanded = true;
      const state = scanStates[-1];
      if (!state.ended) { state.paused = false; state.failed = false; state.phase = 'idle'; }
      if (overviewOpen) checkOverviewCache(false);
    }
    function overviewCacheWindow(rect = overview.getBoundingClientRect()) {
      const visible = overviewVisibleRange(rect);
      if (visible.first < 0) {
        const central = centralOverviewItem();
        const centerIndex = central ? overviewItems.findIndex(item => item.key === central.key) : -1;
        const activeKey = entries[activeIndex()]?.key;
        const active = overviewItems.findIndex(item => item.entry?.key === activeKey);
        visible.first = visible.last = centerIndex >= 0 ? centerIndex : Math.max(0, active);
      }
      const countBefore = overviewCacheCount('Before'), countAfter = overviewCacheCount('After');
      return { ...visible, ...overviewImageRange(visible, countBefore, countAfter), countBefore, countAfter };
    }
    function overviewImageRange(visible, before, after) {
      return lens.controls.overviewCacheRange(overviewItems.length, visible.first, visible.last, before, after,
        index => Boolean(overviewItems[index]?.entry?.thumb));
    }
    function overviewNeedsDiscovery(side, window) {
      const backwardProbe = side < 0 && settings.overviewCacheBeforeMode === 'auto' && !overviewBackwardExpanded;
      const ahead = backwardProbe ? 0 : Math.max(1, overviewBandSize);
      const target = (side < 0 ? window.countBefore : window.countAfter) + ahead;
      const lookahead = overviewImageRange(window, side < 0 ? target : 0, side > 0 ? target : 0);
      return (side < 0 ? lookahead.before : lookahead.after) < target;
    }
    function dropOverviewThumbnail(job, removeSource = true) {
      if (!job) return;
      job.cancelled = true;
      clearTimeout(job.timeout);
      job.image.onload = job.image.onerror = null;
      if (job.active) { overviewThumbActive = Math.max(0, overviewThumbActive - 1); job.active = false; }
      if (removeSource && job.image.getAttribute('src') === job.source) job.image.removeAttribute('src');
      if (overviewThumbJobs.get(job.key) === job) overviewThumbJobs.delete(job.key);
    }
    function markOverviewThumbnailReady(job) {
      if (job.cancelled || job.status !== 'decoding' || overviewThumbJobs.get(job.key) !== job || job.image.dataset.src !== job.source ||
          job.image.naturalWidth < 1 || job.image.naturalHeight < 1) return;
      clearTimeout(job.timeout);
      job.status = 'ready';
      if (job.active) { job.active = false; overviewThumbActive = Math.max(0, overviewThumbActive - 1); }
      const item = overviewItems.find(candidate => candidate.key === job.key && candidate.thumb === job.source);
      const card = item && overviewCards.get(job.key);
      if (item?.entry && item.layoutRatioSource !== 'intrinsic' && item.layoutRatioSource !== 'decoded') {
        const decodedRatio = job.image.naturalWidth / job.image.naturalHeight;
        if (Number.isFinite(decodedRatio) && decodedRatio > 0) {
          const changed = Math.abs(item.layoutRatio - decodedRatio) > .001;
          item.layoutRatio = decodedRatio;
          item.layoutRatioSource = 'decoded';
          if (changed) queueOverviewCommit();
        }
      }
      if (card) card.dataset.thumbState = 'ready';
      updateOverviewStatus();
      scheduleOverviewCacheCheck(180);
    }
    function failOverviewThumbnail(job) {
      if (job.cancelled || job.status === 'error' || overviewThumbJobs.get(job.key) !== job) return;
      clearTimeout(job.timeout);
      job.status = 'error'; job.attempts = (job.attempts || 0) + 1;
      job.retryAt = performance.now() + Math.min(30000, 1200 * 2 ** Math.min(4, job.attempts - 1));
      job.image.onload = job.image.onerror = null;
      if (job.active) { overviewThumbActive = Math.max(0, overviewThumbActive - 1); job.active = false; }
      if (job.image.getAttribute('src') === job.source) job.image.removeAttribute('src');
      const card = overviewCards.get(job.key);
      if (card) { card.dataset.thumbState = 'error'; card.dataset.thumbAttemptCount = String(job.attempts); }
      updateOverviewStatus();
      scheduleOverviewCacheCheck(1500);
    }
    function startOverviewThumbnail(job) {
      if (closed || job.cancelled || overviewThumbJobs.get(job.key) !== job) return;
      const image = job.image;
      job.status = 'loading'; job.active = true; overviewThumbActive++;
      clearTimeout(job.timeout);
      job.timeout = setTimeout(() => failOverviewThumbnail(job), 15000);
      const loaded = () => {
        if (job.cancelled || job.status !== 'loading' || overviewThumbJobs.get(job.key) !== job) return;
        if (image.naturalWidth < 1 || image.naturalHeight < 1 || image.dataset.src !== job.source) { failOverviewThumbnail(job); return; }
        if (job.status !== 'loading') return;
        job.status = 'decoding';
        Promise.resolve(typeof image.decode === 'function' ? image.decode() : undefined)
          .then(() => markOverviewThumbnailReady(job), () => failOverviewThumbnail(job));
        updateOverviewStatus();
      };
      image.onload = loaded;
      image.onerror = () => failOverviewThumbnail(job);
      if (image.getAttribute('src') !== job.source) image.src = job.source;
      if (image.complete) queueMicrotask(() => image.naturalWidth > 0 ? loaded() : failOverviewThumbnail(job));
      updateOverviewStatus();
    }
    function pumpOverviewThumbnails() {
      while (overviewThumbActive < 6 && overviewThumbQueue.length) {
        const job = overviewThumbQueue.shift();
        if (job.cancelled || overviewThumbJobs.get(job.key) !== job || job.status !== 'queued') continue;
        startOverviewThumbnail(job);
      }
    }
    function queueOverviewThumbnail(item, card, force) {
      const image = card.querySelector('img'), source = item.thumb || '';
      image.dataset.src = source;
      if (!source) { card.dataset.thumbState = 'waiting'; return; }
      let job = overviewThumbJobs.get(item.key);
      if (job && job.source !== source) {
        const attempts = 0, canceledAttempts = 0;
        card.dataset.thumbAttemptCount = '0'; card.dataset.thumbCancelCount = '0';
        dropOverviewThumbnail(job); job = null;
        job = { key: item.key, source, image, status: 'queued', attempts, canceledAttempts, retryAt: 0, cancelled: false, active: false };
        overviewThumbJobs.set(item.key, job);
      }
      if (!job) {
        job = { key: item.key, source, image, status: 'queued', attempts: Number(card.dataset.thumbAttemptCount) || 0, canceledAttempts: Number(card.dataset.thumbCancelCount) || 0,
          retryAt: 0, cancelled: false, active: false };
        overviewThumbJobs.set(item.key, job);
      }
      job.image = image; job.cancelled = false;
      if (job.status === 'ready' && image.naturalWidth > 0 && image.dataset.src === source && image.getAttribute('src') === source) {
        card.dataset.thumbState = 'ready'; return;
      }
      if (job.status === 'error') {
        if (!force && performance.now() < job.retryAt) { card.dataset.thumbState = 'error'; return; }
        if (!force && job.attempts >= 3) { card.dataset.thumbState = 'error'; return; }
        job.status = 'queued'; job.cancelled = false;
      }
      if (job.status === 'canceled') {
        if (!force && (job.canceledAttempts || 0) >= 4) { card.dataset.thumbState = 'error'; return; }
        job.status = 'queued'; job.cancelled = false;
      }
      if (job.status === 'idle') job.status = 'queued';
      if (job.status === 'queued' && !overviewThumbQueue.includes(job)) overviewThumbQueue.push(job);
      card.dataset.thumbState = job.status;
    }
    function updateOverviewThumbnails(force = false) {
      if (!overviewOpen || (overviewPress && overviewDirty)) return;
      const cards = [...overviewGrid.children], window = overviewCacheWindow(), visible = { first: window.first, last: window.last };
      const queued = [];
      const desiredKeys = new Set();
      for (const card of cards) {
        const index = Number(card.dataset.index), item = overviewItems[index];
        const image = card.querySelector('img'), source = item?.thumb || '';
        const shouldLoad = Boolean(item && index >= window.start && index <= window.end);
        image.loading = shouldLoad ? 'eager' : 'lazy';
        if (shouldLoad && item) desiredKeys.add(item.key);
        const job = overviewThumbJobs.get(item?.key);
        if (!shouldLoad || !source) {
          if (job) {
            if (job.active) {
              job.cancelled = true; job.status = 'canceled'; job.canceledAttempts = (job.canceledAttempts || 0) + 1;
              card.dataset.thumbCancelCount = String(job.canceledAttempts);
              job.image.onload = job.image.onerror = null;
              if (job.active) { overviewThumbActive = Math.max(0, overviewThumbActive - 1); job.active = false; }
              if (job.image.getAttribute('src') === job.source) job.image.removeAttribute('src');
            }
            dropOverviewThumbnail(job);
          }
          if (image.hasAttribute('src')) image.removeAttribute('src');
          card.dataset.thumbState = item && !source ? 'waiting' : 'idle';
          continue;
        }
        queueOverviewThumbnail(item, card, force);
        const currentJob = overviewThumbJobs.get(item.key);
        if (currentJob?.status === 'queued') queued.push({ job: currentJob, visible: index >= visible.first && index <= visible.last,
          distance: index < visible.first ? visible.first - index : index > visible.last ? index - visible.last : 0 });
      }
      for (const [key, job] of overviewThumbJobs) if (!desiredKeys.has(key)) dropOverviewThumbnail(job);
      for (let index = overviewThumbQueue.length - 1; index >= 0; index--) {
        const job = overviewThumbQueue[index];
        if (!desiredKeys.has(job.key) || overviewThumbJobs.get(job.key) !== job) overviewThumbQueue.splice(index, 1);
      }
      queued.sort((a, b) => Number(b.visible) - Number(a.visible) || a.distance - b.distance);
      overviewThumbQueue.sort((a, b) => {
        const left = queued.findIndex(entry => entry.job === a), right = queued.findIndex(entry => entry.job === b);
        return (left < 0 ? Number.MAX_SAFE_INTEGER : left) - (right < 0 ? Number.MAX_SAFE_INTEGER : right);
      });
      pumpOverviewThumbnails();
      updateOverviewStatus();
    }
    function scheduleOverviewCacheCheck(delay = 650) {
      if (overviewCacheCheckTimer || closed) return;
      overviewCacheCheckTimer = setTimeout(() => { overviewCacheCheckTimer = 0; checkOverviewCache(); }, delay);
    }
    function checkOverviewCache(force = false) {
      if (!overviewOpen || closed) return;
      updateOverviewThumbnails(false);
      const window = overviewCacheWindow();
      if (!collection.scope || !overviewItems.length) return;
      if (scanPromise) { scheduleOverviewCacheCheck(500); return; }
      const band = Math.max(1, overviewBandSize);
      const pendingBefore = overviewItems.slice(window.start, Math.max(window.start, window.first)).some(item => overviewSlotPending(item, -1));
      const pendingAfter = overviewItems.slice(Math.min(overviewItems.length, window.last + 1), window.end + 1).some(item => overviewSlotPending(item, 1));
      const pendingVisible = overviewItems.slice(window.first, window.last + 1).some(item => overviewSlotPending(item, overviewDirection));
      const shortBefore = overviewNeedsDiscovery(-1, window);
      const shortAfter = overviewNeedsDiscovery(1, window);
      const wantsScan = {
        [-1]: shortBefore || overviewPendingForSide(-1, pendingBefore, pendingVisible, pendingAfter, overviewDirection),
        [1]: shortAfter || overviewPendingForSide(1, pendingBefore, pendingVisible, pendingAfter, overviewDirection)
      };
      if (overviewEdgeIntentState.side && overviewEdgeDistance(overviewEdgeIntentState.side) > 2) {
        overviewEdgeIntentState.side = 0; overviewEdgeIntentState.distance = 0; overviewEdgeIntentState.retried = false;
      }
      const directions = overviewDirection < 0 ? [-1, 1] : [1, -1];
      for (const direction of directions) {
        const state = scanStates[direction];
        const pendingDemand = overviewPendingForSide(direction, pendingBefore, pendingVisible, pendingAfter, overviewDirection);
        if (overviewScanDemandSatisfied(direction) && !pendingDemand) continue;
        if (direction < 0 && settings.overviewCacheBeforeMode === 'auto' && !overviewBackwardExpanded) {
          if (state.ended || overviewBackwardProbeStarted || state.paused || state.failed) continue;
          if (window.start > 0 && !pendingBefore && !pendingVisible) continue;
          if (performance.now() - state.lastAttempt < 700) { scheduleOverviewCacheCheck(700); return; }
        }
        if (!wantsScan[direction] || state.ended || ((state.paused || state.failed) && !force)) continue;
        if (performance.now() - state.lastAttempt < 700) { scheduleOverviewCacheCheck(700); return; }
        const missing = direction < 0 ? window.countBefore - window.before : window.countAfter - window.after;
        if (direction < 0 && settings.overviewCacheBeforeMode === 'auto' && !overviewBackwardExpanded) overviewBackwardProbeStarted = true;
        const scan = scanMore(direction, force, Math.max(6, Math.min(24, Math.max(missing, band * 2))));
        if (scan) scan.finally(() => { if (!closed && overviewOpen) scheduleOverviewCacheCheck(); });
        return;
      }
    }
    function scanDelay(ms, signal) {
      return new Promise(resolve => {
        let settled = false;
        const timer = setTimeout(done, ms);
        function done() { if (settled) return; settled = true; clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); }
        signal.addEventListener('abort', done, { once: true });
      });
    }
    async function scanSegment(signal, direction = 1) {
      if (!collection.scope?.isConnected || signal.aborted) return { edge: false };
      const state = scanStates[direction];
      const viewport = scanScroller ? scanHorizontal ? scanScroller.clientWidth : scanScroller.clientHeight : innerHeight;
      const maximum = scanScroller ? scanHorizontal ? scanScroller.scrollWidth - scanScroller.clientWidth : scanScroller.scrollHeight - scanScroller.clientHeight : document.scrollingElement.scrollHeight - innerHeight;
      const origin = scanScroller?.getBoundingClientRect();
      const coordinate = node => { const box = node.getBoundingClientRect(); return sourcePosition() + (scanHorizontal ? box.left - (origin?.left || 0) : box.top - (origin?.top || 0)); };
      const slots = collection.slots || [];
      const cacheWindow = overviewOpen ? overviewCacheWindow() : null;
      let mappedItems, projectedSlots;
      const pendingNearby = () => {
        if (overviewOpen && mappedItems !== overviewItems) {
          mappedItems = overviewItems;
          projectedSlots = new Map(mappedItems.filter(item => !item.entry && item.slotKey).map(item => [item.slotKey, item]));
        }
        return (collection.slots || []).some(slot => {
          if (!slot.node?.isConnected || !scanSlotPending(slot, direction, projectedSlots)) return false;
          const position = coordinate(slot.node);
          return direction < 0 ? position >= state.cursor - viewport * 1.5 && position <= state.cursor + viewport * .65
            : position >= state.cursor - viewport * .65 && position <= state.cursor + viewport * 1.5;
        });
      };
      const hasPendingVisibleOrCache = () => overviewOpen && (() => {
        return overviewItems.slice(cacheWindow.start, cacheWindow.end + 1).filter(item => overviewSlotPending(item, direction)).some(item => {
          const box = item.slotNode?.getBoundingClientRect();
          if (!box) return false;
          const position = sourcePosition() + (scanHorizontal ? box.left - (origin?.left || 0) : box.top - (origin?.top || 0));
          return direction < 0 ? position <= state.cursor + viewport * .65 && position >= state.cursor - viewport * 1.5
            : position >= state.cursor - viewport * .65 && position <= state.cursor + viewport * 1.5;
        });
      })();
      if (overviewOpen && overviewScanDemandSatisfied(direction) && !hasPendingVisibleOrCache()) return { edge: false, demandSatisfied: true };
      const first = slots[0]?.node || collection.scope, last = slots.at(-1)?.node || collection.scope;
      const lastBox = last.getBoundingClientRect();
      const low = Math.min(Math.max(0, maximum), Math.max(0, coordinate(first) - viewport * .25));
      const scopeBox = collection.scope.getBoundingClientRect();
      const end = slots.length ? coordinate(last) + (scanHorizontal ? lastBox.width : lastBox.height) : coordinate(collection.scope) + (scanHorizontal ? scopeBox.width : scopeBox.height);
      const high = Math.min(Math.max(0, maximum), Math.max(low, end - viewport * .25));
      const beforePosition = sourcePosition();
      const step = Math.max(200, viewport * .6);
      let next = direction < 0 && settings.overviewCacheBeforeMode === 'auto' && overviewBackwardProbeStarted && !overviewBackwardExpanded
        ? low
        : (Number.isFinite(state.cursor) ? state.cursor : beforePosition) + direction * step;
      const targetedSlots = overviewOpen ? overviewItems.slice(cacheWindow.start, cacheWindow.end + 1)
        .filter(item => overviewSlotPending(item, direction) && item.slotNode?.isConnected)
        .map(item => ({ item, position: coordinate(item.slotNode), signature: scanOneSlotSignature((collection.slots || []).find(slot => slot.key === item.slotKey)) }))
        .filter(candidate => candidate.position >= low - 2 && candidate.position <= high + viewport &&
          (direction < 0 ? candidate.position <= state.cursor + viewport * .65 : candidate.position >= state.cursor - viewport * .2))
        .sort((a, b) => direction * (a.position - b.position)).slice(0, 6) : [];
      if (targetedSlots.length) next = targetedSlots[0].position - direction * viewport * .2;
      next = Math.max(low, Math.min(high, next));
      const limited = Math.abs(next - beforePosition) < step * .75;
      const edge = direction > 0 ? next >= high - 2 : next <= low + 2;
      scanRestore = restorePageCoordinates;
      try {
        const beforeResolved = scanResolvedSnapshot();
        const beforeSignature = scanSlotSignature();
        state.phase = pendingNearby() ? 'waiting-trigger' : 'scanning';
        state.sourceLoading = false; state.loadingNode = null;
        let observedChanges = 0;
        const localObserver = new MutationObserver(records => {
          if (records.some(record => collection.scope?.contains(record.target) || record.target === scopeParent)) observedChanges++;
        });
        localObserver.observe(collection.scope, { subtree: true, childList: true, attributes: true, attributeFilter: lens.gallery.observedAttributes });
        state.cursor = scrollSourceTo(next);
        const started = performance.now(), timeout = pendingNearby() ? 4200 : edge ? 900 : 1800;
        let stableSince = started, signature = beforeSignature;
        try {
          while (!signal.aborted && !closed && performance.now() - started < timeout) {
            await scanDelay(120, signal);
            if (signal.aborted || closed) break;
            const elapsed = performance.now() - started;
            if (elapsed >= 420 && (observedChanges > 0 || performance.now() - stableSince >= 180)) {
              refresh(direction); observedChanges = 0;
            }
            const currentSignature = scanSlotSignature(), currentResolved = scanResolvedSnapshot();
            const changed = currentSignature !== signature;
            if (changed) { signature = currentSignature; stableSince = performance.now(); }
            const progressed = scanResolvedProgress(beforeResolved, currentResolved);
            const pendingNow = pendingNearby();
            state.loadingNode = scanViewportSourceLoad(direction, state, viewport, origin);
            state.sourceLoading = Boolean(state.loadingNode);
            const settled = performance.now() - stableSince >= 420;
            if (overviewOpen && overviewScanDemandSatisfied(direction) && !hasPendingVisibleOrCache()) break;
            if (progressed && settled && !pendingNow) break;
            if (!progressed && !pendingNow && !state.sourceLoading && elapsed >= 720) break;
          }
        } finally { localObserver.disconnect(); }
        if (!signal.aborted && !closed) { refresh(direction); rememberSourceAnchors(); }
        for (const { item, signature, position } of targetedSlots) {
          if (position < state.cursor - viewport * .2 || position > state.cursor + viewport * 1.2) continue;
          const slot = (collection.slots || []).find(candidate => candidate.key === item.slotKey);
          if (!slot || !slot.pending) { state.slotAttempts.delete(item.slotKey); continue; }
          if (scanOneSlotSignature(slot) === signature) state.slotAttempts.set(item.slotKey, (state.slotAttempts.get(item.slotKey) || 0) + 1);
          else state.slotAttempts.delete(item.slotKey);
        }
        const pendingAfter = pendingNearby();
        const sourceErrors = scanSourceFailureCount(direction);
        state.loadingNode = scanViewportSourceLoad(direction, state, viewport, origin);
        state.sourceLoading = !signal.aborted && Boolean(state.loadingNode);
        const afterResolved = scanResolvedSnapshot();
        const semanticProgress = scanResolvedProgress(beforeResolved, afterResolved);
        return { edge, limited, pending: pendingAfter, sourceLoading: state.sourceLoading, semanticProgress,
          added: afterResolved.entries.size > beforeResolved.entries.size,
          signatureChanged: semanticProgress, sourceErrors,
          stalled: !semanticProgress,
          moved: Math.abs(sourcePosition() - beforePosition) > 2 };
      } finally {
        // The page's location is restored after each isolated scan segment.
        if (scanRestore) { scanRestore(); scanRestore = null; }
      }
    }
    async function scanMore(direction = 1, force = false, targetCount = 6) {
      const state = scanStates[direction];
      if (scanPromise || closed || !collection.scope || state.ended || (!force && state.paused) || performance.now() - state.lastAttempt < 600) return scanPromise;
      state.paused = state.ended = state.failed = false; state.phase = 'scanning'; state.lastAttempt = performance.now(); scanningDirection = direction;
      scanController = new AbortController();
      const signal = scanController.signal;
      if (overviewOpen) updateOverviewStatus();
      const initialCount = entries.length, initialSignature = scanSlotSignature();
      const target = Math.max(1, Math.min(24, Math.floor(Number(targetCount) || 6)));
      scanPromise = (async () => {
        try {
          const deadline = performance.now() + 19000;
          let edgeStalls = 0, pendingWaits = 0, emptySegments = 0, previousCount = initialCount, previousSignature = initialSignature;
          for (let attempt = 0; attempt < 12 && performance.now() < deadline; attempt++) {
            if (signal.aborted || closed) break;
            state.totalAttempts++;
            const result = await scanSegment(signal, direction);
            if (signal.aborted || closed) break;
            const currentCount = entries.length, currentSignature = scanSlotSignature();
            const progress = currentCount > previousCount || currentSignature !== previousSignature;
            const semanticProgress = Boolean(result?.added || result?.signatureChanged);
            edgeStalls = result?.edge && !semanticProgress ? edgeStalls + 1 : 0;
            pendingWaits = (result?.pending || result?.sourceLoading || result?.edge) && !semanticProgress ? pendingWaits + 1 : 0;
            state.resourceErrors = Math.max(state.resourceErrors, result?.sourceErrors || 0);
            if (explicitScanBoundary(direction)) { state.ended = true; state.phase = 'ended'; break; }
            if (direction < 0 && overviewOpen && settings.overviewCacheBeforeMode === 'auto' && !overviewBackwardExpanded) break;
            if (overviewOpen && overviewScanDemandSatisfied(direction)) { state.phase = 'idle'; break; }
            if (currentCount - initialCount >= target) { state.phase = 'idle'; break; }
            if (semanticProgress) { edgeStalls = 0; pendingWaits = 0; emptySegments = 0; state.noProgress = 0; state.phase = 'scanning'; }
            else { state.noProgress++; if (result?.limited && !result?.sourceLoading && !result?.pending) emptySegments++; }
            if ((result?.pending || result?.sourceLoading || (result?.edge && !progress)) && pendingWaits < 3 && performance.now() < deadline) {
              state.phase = result?.sourceLoading ? 'loading-source' : 'waiting-trigger';
              await scanDelay(result?.sourceLoading ? 850 : 500 + pendingWaits * 350, signal);
              if (signal.aborted) break;
              refresh(direction);
              previousCount = entries.length; previousSignature = scanSlotSignature();
              continue;
            }
            if (edgeStalls >= 2 || pendingWaits >= 4 || emptySegments >= 4) break;
            previousCount = entries.length; previousSignature = scanSlotSignature();
          }
          const signatureChanged = scanSlotSignature() !== initialSignature;
          if (!signal.aborted && !state.ended) {
            const sourceErrors = scanSourceFailureCount(direction);
            if (sourceErrors) state.resourceErrors = Math.max(state.resourceErrors, sourceErrors);
            if (state.resourceErrors) { state.failed = true; state.paused = true; state.phase = 'failed'; }
            else if (entries.length === initialCount && !signatureChanged) { state.paused = true; state.phase = 'paused'; }
            else { state.paused = false; state.phase = 'idle'; }
            state.sourceLoading = false;
            state.loadingNode = null;
          }
          if (direction < 0 && settings.overviewCacheBeforeMode === 'auto' && !overviewBackwardExpanded && overviewBackwardProbeStarted) {
            overviewBackwardProbeCompleted = true;
          }
        } catch (error) {
          if (!signal.aborted) { state.failed = true; state.paused = true; state.phase = 'failed'; }
        }
      })().finally(() => {
        scanPromise = null; scanController = null;
        if (closed) return;
        updateNavigationButtons();
        if (overviewOpen) {
          if (edgeSide === direction && !state.ended) resetOverviewEdge(true);
          updateOverviewStatus(); queueOverviewCommit(); updateOverviewThumbnails();
          const window = overviewCacheWindow();
          const short = overviewNeedsDiscovery(direction, window);
          if (short && !state.ended && !state.paused && !state.failed) scheduleOverviewCacheCheck(220);
        }
      });
      return scanPromise;
    }
    function pictureState() {
      return {
        compareEnabled, index, indexKey: entries[index]?.key, left: compareLeft, right: compareRight,
        leftKey: entries[compareLeft]?.key, rightKey: entries[compareRight]?.key, activePane, lockedPane, pairNeedsAnchor,
        scale, panX, panY, compareScale, comparePanX: [...comparePanX], comparePanY: [...comparePanY], dividerPosition
      };
    }
    function enterOverview() {
      if (overviewOpen) return;
      endHold();
      const snapshot = activeSnapshot();
      const key = entries[activeIndex()]?.key;
      if (!overviewGrid.children.length && !overviewAnchor) {
        const selected = entries[activeIndex()];
        if (selected) overviewAnchor = { key: selected.key, x: .5, y: .5 };
      }
      overviewRecent = pictureState();
      overviewOpen = true; pictureClick = 0;
      overviewShell.hidden = false;
      overview.classList.add('active'); overview.setAttribute('aria-hidden', 'false');
      updateOverviewButton();
      compare.classList.toggle('active', false); stage.hidden = true; compare.setAttribute('aria-hidden', 'true');
      showStrip(false); $('.counter').textContent = `${entries.length}`;
      renderOverview(overviewAnchor, true); overview.focus({ preventScroll: true });
      const card = overviewCards.get(overviewItems.find(item => item.entry?.key === key)?.key);
      if (card) {
        const box = overviewCardBox(card), viewport = overview.getBoundingClientRect();
        const horizontal = settings.overviewDirection === 'horizontal';
        const top = viewport.top + parseFloat(getComputedStyle(overview).paddingTop);
        const rect = { left: viewport.left, right: viewport.right, top, bottom: viewport.bottom };
        if (!clipBox(box, rect)) {
          if (horizontal) overview.scrollLeft += box.right < rect.left ? box.left - rect.left : Math.min(box.left - rect.left, box.right - rect.right);
          else overview.scrollTop += box.bottom < rect.top ? box.top - rect.top : Math.min(box.top - rect.top, box.bottom - rect.bottom);
        }
        const image = card.querySelector('img');
        const target = clipBox(image.getBoundingClientRect(), rect);
        returnFeedback(snapshot, target, viewer, reducedMotion.matches);
      }
    }
    async function exitOverview(selectImage = false, selectedIndex = -1, explicitMode = null) {
      if (!overviewOpen) return;
      overviewAnchor = captureOverviewAnchor();
      const state = overviewRecent;
      overviewOpen = false; clearOverviewPress(); pictureClick = 0;
      overviewLayoutAnchor = null;
      lens.feedbackController?.abort();
      clearTimeout(overviewCommitTimer);
      overviewCommitTimer = overviewCommitStarted = 0; overviewDirty = false;
      overview.classList.remove('active'); overview.setAttribute('aria-hidden', 'true');
      overviewShell.hidden = true; resetOverviewEdge();
      updateOverviewButton();
      scanController?.abort(); scanRestore?.(); scanRestore = null;
      updateOverviewStatus();
      const resolveIndex = (key, fallback) => {
        const found = entries.findIndex(entry => entry.key === key);
        return found >= 0 ? found : Math.max(0, Math.min(entries.length - 1, fallback));
      };
      if (selectImage && selectedIndex >= 0) {
        const selected = Math.max(0, Math.min(entries.length - 1, selectedIndex));
        compareEnabled = explicitMode === null ? Boolean(state?.compareEnabled) : explicitMode;
        settings.compareEnabled = compareEnabled;
        if (explicitMode !== null) chrome.storage.local.set({ settings }).catch(() => {});
        if (compareEnabled) {
          lockedPane = null; activePane = 0; pairNeedsAnchor = false;
          const right = selected + 1 < entries.length ? selected + 1 : -1;
          await showPair(selected, right);
        } else { lockedPane = null; await showSingle(selected); }
      } else if (state) {
        const left = resolveIndex(state.leftKey, state.left), right = state.rightKey ? resolveIndex(state.rightKey, state.right) : state.right;
        compareEnabled = state.compareEnabled; index = resolveIndex(state.indexKey, state.index);
        compareLeft = left; compareRight = right;
        activePane = state.activePane; lockedPane = state.lockedPane; pairNeedsAnchor = state.pairNeedsAnchor;
        dividerPosition = state.dividerPosition;
        if (compareEnabled) await showPair(left, right);
        else await showSingle(index);
        if (compareEnabled) {
          compareScale = state.compareScale; comparePanX = [...state.comparePanX]; comparePanY = [...state.comparePanY];
        } else { scale = state.scale; panX = state.panX; panY = state.panY; }
        transform(); updateCompareControls();
      }
      updateCompareControls();
      viewer.focus({ preventScroll: true });
    }
    async function showSingle(nextIndex) {
      if (closed || nextIndex < 0 || nextIndex >= entries.length) return;
      compare.classList.remove('active'); compare.setAttribute('aria-hidden', 'true');
      stage.hidden = false; photo.hidden = true;
      index = nextIndex; const id = ++serial; const entry = entries[index];
      preset = null;
      endHold(); width = height = 0; stage.classList.remove('zoomed');
      $('.counter').textContent = `${index + 1} / ${entries.length}`;
      updateNavigationButtons();
      updateEdgePreviews();
      $('.resolution').textContent = '';
      $('.fit').textContent = '—';
      status(t('loading'));
      const loading = pool.get(entry, true); cacheNeighbors();
      if (strip.classList.contains('visible')) renderStrip();
      const image = await loading;
      if (closed || id !== serial) return;
      if (!image) { status(t('loadFailed'), true); return; }
      photo.src = image.src; photo.alt = entry.title || t('imageN', index + 1);
      width = image.naturalWidth; height = image.naturalHeight;
      photo.hidden = false; message.hidden = true;
      const rect = stage.getBoundingClientRect();
      const fitted = Math.min(1, rect.width / width, rect.height / height);
      scale = settings.zoomLocked && lockedScale !== null ? lockedScale : fitted;
      if (settings.zoomLocked) lockedScale = scale;
      panX = panY = 0; transform();
      $('.resolution').textContent = `${width} × ${height}`;
      if (note) $('.resolution').title = note;
      $('.sr').textContent = t('imageCount', index + 1, entries.length);
    }
    async function showPair(leftIndex, rightIndex = leftIndex + 1) {
      if (closed || leftIndex < 0 || leftIndex >= entries.length) return;
      compareEnabled = true; compareLeft = leftIndex; compareRight = rightIndex >= 0 && rightIndex < entries.length ? rightIndex : -1; index = leftIndex;
      compare.classList.add('active'); compare.setAttribute('aria-hidden', 'false'); stage.hidden = true; photo.hidden = true;
      overviewOpen = false; overview.classList.remove('active'); overview.setAttribute('aria-hidden', 'true');
      showStrip(false); updateCompareControls();
      const id = ++serial; preset = null; endHold(); compareDims = [null, null];
      updateCompareControls();
      comparePhotos.forEach(img => { img.hidden = true; img.removeAttribute('src'); });
      const leftEntry = entries[compareLeft], rightEntry = compareRight >= 0 ? entries[compareRight] : null;
      $('.counter').textContent = `${compareLeft + 1} | ${rightEntry ? compareRight + 1 : '—'} / ${entries.length}`;
      updateNavigationButtons(); $('.resolution').textContent = ''; $('.fit').textContent = '—'; status(t('loading'));
      const leftPromise = pool.get(leftEntry, true);
      const rightPromise = rightEntry ? pool.get(rightEntry, true) : Promise.resolve(null);
      cacheNeighbors();
      if (strip.classList.contains('visible')) renderStrip();
      const [leftImage, rightImage] = await Promise.all([leftPromise, rightPromise]);
      if (closed || id !== serial) return;
      if (!leftImage) { status(t('loadFailed'), true); return; }
      comparePhotos[0].src = leftImage.src; comparePhotos[0].alt = leftEntry.title || t('imageN', compareLeft + 1);
      compareDims[0] = { width: leftImage.naturalWidth, height: leftImage.naturalHeight, fit: 1 };
      if (rightImage && rightEntry) {
        comparePhotos[1].src = rightImage.src; comparePhotos[1].alt = rightEntry.title || t('imageN', compareRight + 1);
        compareDims[1] = { width: rightImage.naturalWidth, height: rightImage.naturalHeight, fit: 1 };
      }
      compareScale = settings.zoomLocked && lockedScale !== null ? lockedScale : 1;
      if (settings.zoomLocked) lockedScale = compareScale;
      comparePanX = [0, 0]; comparePanY = [0, 0];
      message.hidden = true;
      $('.resolution').textContent = `${leftImage.naturalWidth} × ${leftImage.naturalHeight}${rightImage ? `  |  ${rightImage.naturalWidth} × ${rightImage.naturalHeight}` : ''}`;
      transform(); updateCompareControls(); $('.sr').textContent = `${t('imageCount', compareLeft + 1, entries.length)}${rightEntry ? `; ${t('imageCount', compareRight + 1, entries.length)}` : ''}`;
      updateNavigationButtons();
    }
    function show(nextIndex) { return compareEnabled ? showPair(nextIndex, nextIndex + 1) : showSingle(nextIndex); }
    function navigate(direction, afterScan = false) {
      const active = activeIndex();
      const step = compareEnabled && lockedPane === null ? settings.compareStep : 1;
      const target = active + direction * step;
      const needsMore = target < 0 || target >= entries.length || (compareEnabled && lockedPane === null && direction > 0 && compareLeft + step + 1 >= entries.length);
      if (needsMore && collection.scope && !afterScan) {
        const key = entries[active]?.key;
        scanMore(direction, true)?.then(() => { if (!closed && !overviewOpen && entries[activeIndex()]?.key === key) navigate(direction, true); });
        return;
      }
      if (!compareEnabled) { show(index + direction); return; }
      if (lockedPane === 0) {
        let nextRight = compareRight + direction;
        if (nextRight === compareLeft) nextRight += direction;
        if (nextRight < 0 || nextRight >= entries.length) return;
        activePane = 1; pairNeedsAnchor = false; showPair(compareLeft, nextRight); return;
      }
      if (lockedPane === 1) {
        let nextLeft = compareLeft + direction;
        if (nextLeft === compareRight) nextLeft += direction;
        if (nextLeft < 0 || nextLeft >= entries.length) return;
        activePane = 0; pairNeedsAnchor = false; showPair(nextLeft, compareRight); return;
      }
      let nextLeft;
      if (pairNeedsAnchor) {
        const step = settings.compareStep;
        nextLeft = activePane === 1
          ? compareRight + (direction > 0 ? step - 1 : -step)
          : compareLeft + direction * step;
        pairNeedsAnchor = false;
      } else nextLeft = compareLeft + direction * settings.compareStep;
      if (nextLeft < 0 || nextLeft + 1 >= entries.length) return;
      activePane = 0; showPair(nextLeft, nextLeft + 1);
    }
    function setCompare(enabled, persist = true) {
      if (compareEnabled === enabled && !overviewOpen) return;
      const selected = Math.max(0, Math.min(entries.length - 1, activeIndex()));
      if (overviewOpen) {
        const focusedCard = shadow.activeElement?.closest?.('.overview-card');
        const selectedKey = focusedCard && overviewItems[Number(focusedCard.dataset.index)]?.entry?.key;
        const selected = selectedKey ? entries.findIndex(entry => entry.key === selectedKey) : -1;
        exitOverview(true, selected >= 0 ? selected : centralOverviewIndex(), enabled); return;
      }
      compareEnabled = enabled; settings.compareEnabled = enabled;
      if (enabled) {
        lockedPane = null; pairNeedsAnchor = false; activePane = 0;
        compareLeft = selected; compareRight = selected + 1;
        showPair(compareLeft, compareRight);
      } else {
        lockedPane = null; pairNeedsAnchor = false; showSingle(selected);
      }
      updateCompareControls(); cacheNeighbors();
      if (persist) chrome.storage.local.set({ settings }).catch(() => {});
    }
    function refresh(direction = scanningDirection) {
      if (closed || standalone) return;
      const leftKey = compareEnabled ? entries[compareLeft]?.key : entries[index]?.key;
      const rightKey = compareEnabled ? entries[compareRight]?.key : null;
      const current = entries[compareEnabled ? activeIndex() : index];
      if (!current) return;
      if (collection.scope && !collection.scope.isConnected && scopeParent?.isConnected) {
        const replacement = [...scopeParent.children].find(node => {
          if (node === host || node.tagName !== collection.scope.tagName) return false;
          return [...node.querySelectorAll('img')].some(image => {
            const aliases = lens.gallery.sources(image).map(lens.gallery.key);
            return entries.some(entry => entry.aliases?.some(alias => aliases.includes(alias)));
          });
        });
        if (replacement) collection.scope = replacement;
      }
      const newer = lens.gallery.collect(current.thumb, current.node, collection.scope);
      if (newer.scope) { collection.scope = newer.scope; scopeParent = newer.scope.parentElement; }
      collection.slots = newer.slots || [];
      const pendingKeys = new Set(collection.slots.filter(slot => slot.pending).map(slot => slot.key));
      for (const state of Object.values(scanStates)) {
        for (const key of state.slotAttempts.keys()) if (!pendingKeys.has(key)) state.slotAttempts.delete(key);
      }
      // Retain already discovered entries when a virtual list recycles its DOM.
      const before = entries.length;
      entries = lens.gallery.mergeEntries(entries, newer.entries, direction);
      const changed = entries.length !== before;
      const refreshed = newer.entries.length > 0;
      rememberSourceAnchors();
      if (changed) {
        if (compareEnabled) {
          compareLeft = Math.max(0, entries.findIndex(e => e.key === leftKey));
          compareRight = rightKey ? entries.findIndex(e => e.key === rightKey) : -1;
          index = compareLeft;
          $('.counter').textContent = `${compareLeft + 1} | ${compareRight >= 0 ? compareRight + 1 : '—'} / ${entries.length}`;
          $('.sr').textContent = `${t('imageCount', compareLeft + 1, entries.length)}${compareRight >= 0 ? `; ${t('imageCount', compareRight + 1, entries.length)}` : ''}`;
        } else {
          index = Math.max(0, entries.findIndex(e => e.key === current.key));
          $('.counter').textContent = `${index + 1} / ${entries.length}`;
          $('.sr').textContent = t('imageCount', index + 1, entries.length);
        }
        updateNavigationButtons();
        if (!overviewOpen) cacheNeighbors();
        if (strip.classList.contains('visible')) renderStrip();
        if (overviewOpen) queueOverviewCommit();
      }
      if (overviewOpen && refreshed && !changed) queueOverviewCommit();
    }
    function storageChanged(changes, area) {
      if (area !== 'local' || !changes.settings) return;
      const previouslyLocked = settings.zoomLocked;
      const previousLanguage = settings.language;
      const next = lens.settings.normalize(changes.settings.newValue);
      rebuildOverviewItems ||= overviewLayoutChanged(settings, next);
      settings = next; cacheNeighbors();
      viewer.classList.toggle('toolbar-auto', settings.toolbarAutoHide);
      if (settings.compareEnabled !== compareEnabled) setCompare(settings.compareEnabled, false);
      dividerPosition = Math.max(settings.dividerMin / 100, Math.min(1 - settings.dividerMin / 100, dividerPosition));
      transform(); updateNavigationButtons();
      if (settings.zoomLocked && !previouslyLocked) lockedScale = hold?.scale ?? (compareEnabled ? compareScale : scale);
      updateLock();
      if (previousLanguage !== settings.language) refreshLanguage();
      else lens.preferences.fill(form, settings);
      if (strip.classList.contains('visible')) renderStrip();
      if (overviewOpen) { updateRuler(); queueOverviewCommit(); }
    }
    let observedGallerySignature = scanSlotSignature();
    function queueGalleryRefresh() {
      clearTimeout(scanTimer); scanTimer = setTimeout(() => {
        if (closed) return;
        const previous = observedGallerySignature || scanSlotSignature();
        refresh();
        observedGallerySignature = scanSlotSignature();
        if (previous !== observedGallerySignature && !scanPromise) {
          for (const state of Object.values(scanStates)) state.paused = state.ended = state.failed = false;
        }
        if (overviewOpen) checkOverviewCache();
      }, 300);
    }
    const observer = new MutationObserver(records => {
      if (records.some(record => !host.contains(record.target) && (collection.scope?.contains(record.target) || record.target === scopeParent))) queueGalleryRefresh();
    });
    observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: lens.gallery.observedAttributes });
    for (const type of ['load', 'error']) on(document, type, event => {
      if (event.target?.tagName === 'IMG' && collection.scope?.contains(event.target) && !host.contains(event.target)) queueGalleryRefresh();
    }, { capture: true });
    globalThis.chrome?.storage?.onChanged?.addListener(storageChanged);
    on($('.close'), 'click', close);
    on($('.prev'), 'click', () => navigate(-1)); on($('.next'), 'click', () => navigate(1));
    on($('.compare-toggle'), 'click', () => setCompare(!compareEnabled));
    on($('.overview-toggle'), 'click', () => overviewOpen ? exitOverview(false) : enterOverview());
    function clearOverviewPress() {
      const press = overviewPress;
      overviewPress = null;
      overviewClickGuard = null;
      overview.classList.remove('dragging');
      if (!press) return;
      if (press.capture?.hasPointerCapture(press.pointer)) press.capture.releasePointerCapture(press.pointer);
      for (const animation of press.animations) {
        if (!overviewOpen) animation.cancel();
        else if (animation.playState === 'paused') animation.play();
      }
    }
    function releaseOverviewPress(event) {
      const press = overviewPress;
      if (!press || (event.pointerId !== undefined && press.pointer !== event.pointerId)) return;
      clearOverviewPress();
      if (event.type === 'pointerup' || press.dragging) {
        overviewClickGuard = { key: press.key, dragging: press.dragging };
      }
      if (edgeSide && (!scanController || scanningDirection !== edgeSide || overviewEdgeDistance(edgeSide) > 2)) {
        resetOverviewEdge(true, scanStates[edgeSide].ended || !collection.scope);
      }
      if (overviewDirty) queueOverviewCommit();
      if (press.dragging && overviewOpen) checkOverviewCache(false);
    }
    on(overview, 'pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      clearOverviewPress();
      const card = event.target.closest('.overview-card');
      const animations = [...(card?.getAnimations() || []), ...(edgeAnimation ? [edgeAnimation] : [])].filter(animation => animation.playState === 'running');
      animations.forEach(animation => animation.pause());
      overviewPress = {
        pointer: event.pointerId, key: card?.dataset.key || null, animations,
        startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY,
        axis: settings.overviewDirection === 'horizontal' ? 'x' : 'y', dragging: false,
        mousePan: event.pointerType === 'mouse', capture: card || overview
      };
    });
    on(overview, 'pointermove', event => {
      const press = overviewPress;
      if (!press?.mousePan || event.pointerId !== press.pointer || !event.isPrimary) return;
      if (!(event.buttons & 1)) { releaseOverviewPress(event); return; }
      const dx = event.clientX - press.startX, dy = event.clientY - press.startY;
      const axisDistance = press.axis === 'x' ? Math.abs(dx) : Math.abs(dy);
      if (!press.dragging && axisDistance < 6) return;
      if (!press.dragging) {
        press.dragging = true;
        if (event.isTrusted && press.capture.isConnected) press.capture.setPointerCapture(event.pointerId);
        overview.classList.add('dragging');
      }
      const delta = press.axis === 'x' ? event.clientX - press.lastX : event.clientY - press.lastY;
      press.lastX = event.clientX; press.lastY = event.clientY;
      event.preventDefault();
      if (!delta) return;
      // Dragging the content toward its start is explicit backward browsing intent.
      overviewDirection = delta > 0 ? -1 : 1;
      if (delta > 0) activateOverviewBackward();
      const property = press.axis === 'x' ? 'scrollLeft' : 'scrollTop';
      const before = overview[property];
      overview[property] += -delta;
      const moved = overview[property] - before;
      overviewLayoutAnchor = null;
      updateOverviewThumbnails();
      const unconsumed = -delta - moved;
      if (Math.abs(unconsumed) > .5) overviewEdgeIntent(Math.sign(unconsumed), Math.abs(unconsumed), 'drag');
      else checkOverviewCache(false);
    });
    on(window, 'pointerup', releaseOverviewPress, { capture: true });
    on(window, 'pointercancel', releaseOverviewPress, { capture: true });
    on(window, 'blur', releaseOverviewPress);
    on(window, 'lostpointercapture', releaseOverviewPress, { capture: true });
    on(overviewGrid, 'click', event => {
      const press = overviewClickGuard || overviewPress;
      if (event.detail) overviewClickGuard = null;
      if (event.detail && press?.dragging) {
        event.preventDefault(); event.stopImmediatePropagation(); return;
      }
      const key = event.target.closest('.overview-card')?.dataset.key;
      if (!key || (event.detail && press && key !== press.key)) return;
      const item = overviewItems[Number(event.target.closest('.overview-card').dataset.index)];
      const selected = item?.entry ? entries.findIndex(entry => entry.key === item.entry.key) : -1;
      if (selected >= 0) exitOverview(true, selected);
    });
    on(overview, 'scroll', () => {
      const offset = settings.overviewDirection === 'horizontal' ? overview.scrollLeft : overview.scrollTop;
      if (Math.abs(offset - lastOverviewOffset) > .5) {
        overviewDirection = offset > lastOverviewOffset ? 1 : -1;
        overviewLayoutAnchor = null;
      }
      lastOverviewOffset = offset;
      if (overviewScrollFrame) return;
      overviewScrollFrame = requestAnimationFrame(() => {
        overviewScrollFrame = 0;
        if (edgeSide && overviewEdgeDistance(edgeSide) > 2) resetOverviewEdge(true);
        updateOverviewThumbnails(); checkOverviewCache(false); updateOverviewStatus();
      });
    }, { passive: true });
    on(overview, 'wheel', event => {
      if (event.ctrlKey || event.metaKey || event.composedPath().includes(form)) return;
      if (overviewPress?.mousePan && !(event.buttons & 1)) releaseOverviewPress(event);
      const horizontal = settings.overviewDirection === 'horizontal';
      const delta = (horizontal || event.altKey || event.shiftKey) && Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      if (event.altKey || event.shiftKey) {
        event.preventDefault(); event.stopPropagation();
        setOverviewSize(settings.overviewScale + (delta < 0 ? 1 : -1) * (event.shiftKey ? 1 : settings.zoomStep)); return;
      }
      const amount = delta * (event.deltaMode === 1 ? 32 : event.deltaMode === 2 ? (horizontal ? overview.clientWidth : overview.clientHeight) : 1);
      const side = delta < 0 ? -1 : 1, property = horizontal ? 'scrollLeft' : 'scrollTop';
      overviewDirection = side;
      if (side < 0) activateOverviewBackward();
      if (overviewEdgeIntentState.side && side !== overviewEdgeIntentState.side) {
        overviewEdgeIntentState.side = 0; overviewEdgeIntentState.samples = []; overviewEdgeIntentState.retried = false;
      }
      if (edgeSide && side !== edgeSide) resetOverviewEdge();
      if (edgeAnimation) resetOverviewEdge();
      const before = overview[property], maximum = Math.max(0, overview[horizontal ? 'scrollWidth' : 'scrollHeight'] - overview[horizontal ? 'clientWidth' : 'clientHeight']);
      const attempted = before + amount, next = Math.max(0, Math.min(maximum, attempted)), unconsumed = attempted - next;
      if (horizontal || Math.abs(unconsumed) > .5) {
        event.preventDefault(); event.stopPropagation(); overview[property] = next;
      }
      if (Math.abs(unconsumed) > .5) overviewEdgeIntent(Math.sign(unconsumed), Math.abs(unconsumed), 'wheel');
      else checkOverviewCache(false);
    }, { passive: false });
    for (let side = 0; side < comparePanes.length; side++) {
      const pane = comparePanes[side];
      on(pane, 'pointerenter', () => { if (lockedPane === null && compareDims[side]) activePane = side; });
      on(pane.querySelector('.pane-lock'), 'click', () => {
        if (!compareEnabled) return;
        if (lockedPane === side) { lockedPane = null; pairNeedsAnchor = true; }
        else { lockedPane = side; activePane = 1 - side; pairNeedsAnchor = false; }
        updateCompareControls(); updateNavigationButtons(); cacheNeighbors();
      });
      on(pane.querySelector('.pane-lock'), 'dblclick', event => event.stopPropagation());
    }
    on(divider, 'pointerdown', event => {
      if (event.button !== 0) return;
      dividerDragging = true; divider.classList.add('dragging'); divider.setPointerCapture(event.pointerId); event.preventDefault(); event.stopPropagation();
    });
    on(divider, 'pointermove', event => {
      const rect = compare.getBoundingClientRect();
      const handleY = Math.max(26, Math.min(Math.max(26, rect.height - 26), event.clientY - rect.top));
      divider.style.setProperty('--divider-handle-y', `${handleY}px`);
      if (!dividerDragging) return;
      dividerPosition = Math.max(settings.dividerMin / 100, Math.min(1 - settings.dividerMin / 100, (event.clientX - rect.left) / rect.width));
      transformCompare(); event.preventDefault();
    });
    on(divider, 'pointerenter', event => {
      const rect = compare.getBoundingClientRect();
      const handleY = Math.max(26, Math.min(Math.max(26, rect.height - 26), event.clientY - rect.top));
      divider.style.setProperty('--divider-handle-y', `${handleY}px`);
    });
    on(divider, 'pointerleave', () => { if (!dividerDragging) divider.style.removeProperty('--divider-handle-y'); });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(divider, type, () => { dividerDragging = false; divider.classList.remove('dragging'); });
    on(divider, 'dblclick', event => { event.preventDefault(); event.stopPropagation(); dividerPosition = .5; transformCompare(); });
    for (const selector of ['.prev', '.next']) {
      on($(selector), 'pointerenter', () => { $(selector).classList.add('pointer-preview'); updateEdgePreviews(); });
      on($(selector), 'pointermove', () => { if (!$(selector).classList.contains('pointer-preview')) { $(selector).classList.add('pointer-preview'); updateEdgePreviews(); } });
      on($(selector), 'pointerleave', () => { $(selector).classList.remove('pointer-preview'); updateEdgePreviews(); });
    }
    on($('.fit'), 'click', () => {
      if (overviewOpen) { setOverviewSize(100); return; }
      if (compareEnabled ? !compareDims.some(Boolean) : (!width || photo.hidden)) return;
      const currentScale = compareEnabled ? compareScale : scale;
      const cycle = preset || { original: currentScale, step: 0 };
      const rect = compareEnabled ? compare.getBoundingClientRect() : stage.getBoundingClientRect();
      const activePaneFit = compareEnabled ? compareDims[activePane]?.fit || compareDims[1 - activePane]?.fit || 1 : 1;
      const fitValue = compareEnabled ? activePaneFit : Math.min(rect.width / width, rect.height / height);
      const nativeValue = compareEnabled ? Math.min(5, 1 / activePaneFit) : 1;
      const value = [fitValue, nativeValue, cycle.original][cycle.step];
      setScale(value);
      if (compareEnabled) { comparePanX = [0, 0]; comparePanY = [0, 0]; }
      else panX = panY = 0;
      transform();
      cycle.step = (cycle.step + 1) % 3; preset = cycle.step ? cycle : null;
    });
    on($('.zoom-control'), 'pointerenter', () => $('.zoom-control').classList.add('expanded'));
    on($('.zoom-control'), 'pointermove', () => $('.zoom-control').classList.add('expanded'));
    on($('.zoom-control'), 'pointerleave', () => {
      $('.zoom-control').classList.remove('expanded');
      if ($('.zoom-control').contains(shadow.activeElement)) viewer.focus();
    });
    on($('.zoom-control'), 'focusin', event => { if (event.target.matches(':focus-visible')) $('.zoom-control').classList.add('expanded'); });
    on($('.zoom-control'), 'focusout', event => {
      if (!$('.zoom-control').matches(':hover') && !$('.zoom-control').contains(event.relatedTarget)) $('.zoom-control').classList.remove('expanded');
    });
    on($('.zoom-slider'), 'pointerdown', () => { sliding = true; });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on($('.zoom-slider'), type, () => { sliding = false; updateRuler(); });
    const applyRuler = position => {
      const value = lens.controls.fromPosition(position, rulerMaximum, overviewOpen);
      if (overviewOpen) setOverviewSize(value); else setScale(value / 100);
    };
    on($('.zoom-slider'), 'input', event => applyRuler(event.target.value));
    on($('.zoom-ticks'), 'click', event => {
      const tick = event.target.closest('[data-tick]');
      if (tick) applyRuler(Number(tick.dataset.tick));
    });
    on($('.zoom-control'), 'wheel', event => {
      event.preventDefault(); event.stopPropagation();
      const delta = event.deltaY || event.deltaX;
      if (!delta) return;
      if (overviewOpen) { setOverviewSize(settings.overviewScale + (delta < 0 ? 1 : -1) * (event.shiftKey ? 1 : settings.zoomStep)); return; }
      const currentScale = compareEnabled ? compareScale : scale;
      if (event.shiftKey) setScale((Math.round(currentScale * 100) + (delta < 0 ? 1 : -1)) / 100);
      else zoom(delta < 0 ? 1 : -1);
    }, { passive: false });
    on($('.zoom-lock'), 'click', () => {
      settings.zoomLocked = !settings.zoomLocked;
      if (settings.zoomLocked) lockedScale = hold?.scale ?? (compareEnabled ? compareScale : scale);
      updateLock(); chrome.storage.local.set({ settings }).catch(() => {});
    });
    updateLock();
    async function fullscreen() {
      try { await viewer.requestFullscreen({ navigationUI: 'hide' }); }
      catch {
        $('.fullscreen').title = t('fullscreenDenied');
      }
    }
    on($('.fullscreen'), 'click', () => {
      if (shadow.fullscreenElement === viewer || document.fullscreenElement === host) {
        returningToPage = true;
        document.exitFullscreen().catch(() => { returningToPage = false; });
      }
      else fullscreen();
    });
    on($('.preferences'), 'click', () => {
      form.hidden = !form.hidden;
      if (!form.hidden) lens.preferences.fill(form, settings);
    });
    on(form, 'pointerleave', () => { form.hidden = true; if (form.contains(shadow.activeElement)) viewer.focus(); });
    bindPreferences();
    on(viewer, 'wheel', event => {
      if (event.composedPath().includes(form) || event.composedPath().includes($('.zoom-control'))) return;
      if (overviewOpen) return;
      event.preventDefault(); event.stopPropagation();
      const delta = event.deltaY || event.deltaX;
      if (!delta) return;
      if (hold && (event.buttons & 1)) return;
      if (hold) endHold();
      // One ordinary wheel notch is one step; trackpad movement scales smoothly.
      const mode = lens.controls.wheelMode(event), now = performance.now();
      if (mode === 'navigate') {
        if (now - lastWheel < 160) return;
        lastWheel = now; navigate(delta > 0 ? 1 : -1); return;
      }
      if (mode === 'fine') {
        if (now - lastFineWheel < 70) return;
        lastFineWheel = now; setScale((Math.round((compareEnabled ? compareScale : scale) * 100) + (delta < 0 ? 1 : -1)) / 100, event.clientX, event.clientY); return;
      }
      const amount = event.deltaMode ? delta * (event.deltaMode === 1 ? 32 : (compareEnabled ? compare.clientHeight : stage.clientHeight)) : delta;
      zoom(amount < 0 ? 1 : -1, event.clientX, event.clientY, Math.min(3, Math.abs(amount) / 100));
    }, { passive: false });
    function startHold(event, target) {
      if (event.button !== 0 || hold || event.composedPath().some(node => node === divider || node?.classList?.contains('pane-lock'))) return;
      const mode = event.altKey ? 'drag' : 'zoom';
      if (compareEnabled && event.composedPath().includes(compare)) {
        if (!compareDims.some(Boolean)) return;
        const rect = compare.getBoundingClientRect();
        let side = event.clientX < rect.left + rect.width * dividerPosition ? 0 : 1;
        if (!compareDims[side]) side = 1 - side;
        if (lockedPane === null) activePane = side;
        hold = { compare: true, mode, side, scale: compareScale, panX: [...comparePanX], panY: [...comparePanY],
          pointerId: event.pointerId, target, clientX: event.clientX, clientY: event.clientY };
        if (mode === 'zoom') {
          const oldScale = compareScale, nextScale = oldScale * settings.holdZoom / 100;
          const box = comparePanes[side].getBoundingClientRect(), dims = compareDims[side];
          const qx = Math.max(0, Math.min(1, (event.clientX - box.left) / Math.max(1, box.width)));
          const qy = Math.max(0, Math.min(1, (event.clientY - box.top) / Math.max(1, box.height)));
          const oldW = dims.width * dims.fit * oldScale, oldH = dims.height * dims.fit * oldScale;
          const u = oldW ? Math.max(0, Math.min(1, .5 + ((qx - .5) * box.width - comparePanX[side] * oldW) / oldW)) : .5;
          const v = oldH ? Math.max(0, Math.min(1, .5 + ((qy - .5) * box.height - comparePanY[side] * oldH) / oldH)) : .5;
          compareScale = nextScale;
          for (let pane = 0; pane < 2; pane++) {
            const image = compareDims[pane]; if (!image) continue;
            const paneRect = comparePanes[pane].getBoundingClientRect();
            const nextW = image.width * image.fit * compareScale, nextH = image.height * image.fit * compareScale;
            comparePanX[pane] = ((qx - .5) * paneRect.width / nextW) - (u - .5);
            comparePanY[pane] = ((qy - .5) * paneRect.height / nextH) - (v - .5);
          }
          hold.zoomPanX = [...comparePanX]; hold.zoomPanY = [...comparePanY]; transform();
        }
      } else {
        if (photo.hidden || !width) return;
        const rect = stage.getBoundingClientRect();
        hold = { compare: false, scale, panX, panY, pointerId: event.pointerId, mode, target,
          clientX: event.clientX, clientY: event.clientY,
          anchorX: event.clientX - rect.left - rect.width / 2, anchorY: event.clientY - rect.top - rect.height / 2 };
        if (mode === 'zoom') scale *= settings.holdZoom / 100;
        moveHeldImage(event);
      }
      if (event.isTrusted) target.setPointerCapture(event.pointerId);
      target.classList.add(mode === 'drag' ? 'dragging' : 'holding'); viewer.classList.add('moving');
      showStrip(false); event.preventDefault();
    }
    on(stage, 'pointerdown', event => startHold(event, stage));
    on(compare, 'pointerdown', event => startHold(event, compare));
    function followHold(event) {
      if (!hold || event.pointerId !== hold.pointerId) return;
      if (!(event.buttons & 1)) { endHold(); return; }
      moveHeldImage(event);
    }
    function moveHeldImage(event) {
      const dx = event.clientX - hold.clientX, dy = event.clientY - hold.clientY;
      if (hold.compare) {
        for (let side = 0; side < 2; side++) {
          const dims = compareDims[side]; if (!dims) continue;
          const renderedWidth = dims.width * dims.fit * compareScale, renderedHeight = dims.height * dims.fit * compareScale;
          if (hold.mode === 'drag') {
            comparePanX[side] = hold.panX[side] + dx / renderedWidth;
            comparePanY[side] = hold.panY[side] + dy / renderedHeight;
          } else {
            const ratio = compareScale / hold.scale;
            comparePanX[side] = hold.zoomPanX[side] - dx * ratio / renderedWidth;
            comparePanY[side] = hold.zoomPanY[side] - dy * ratio / renderedHeight;
          }
        }
      } else if (hold.mode === 'drag') { panX = hold.panX + dx; panY = hold.panY + dy; }
      else {
        panX = lens.controls.holdPan(hold.panX, hold.anchorX, dx, scale / hold.scale);
        panY = lens.controls.holdPan(hold.panY, hold.anchorY, dy, scale / hold.scale);
      }
      transform();
    }
    function endHold() {
      if (!hold) return;
      const previous = hold; hold = null;
      if (previous.mode === 'zoom') {
        if (previous.compare) { compareScale = previous.scale; comparePanX = previous.panX; comparePanY = previous.panY; }
        else { scale = previous.scale; panX = previous.panX; panY = previous.panY; }
      }
      previous.target.classList.remove('holding', 'dragging'); viewer.classList.remove('moving');
      if (previous.target.hasPointerCapture(previous.pointerId)) previous.target.releasePointerCapture(previous.pointerId);
      transform();
    }
    for (const target of [stage, compare]) {
      on(target, 'pointermove', followHold);
      on(target, 'click', event => {
        if (event.altKey || event.composedPath().some(node => node?.tagName === 'BUTTON')) { pictureClick = 0; return; }
        pictureClick = event.detail === 1 || !pictureClick ? 1 : pictureClick + 1;
      });
    }
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(window, type, event => {
      if (event.pointerId === hold?.pointerId) endHold();
    }, { capture: true });
    on(window, 'blur', endHold);
    on(viewer, 'dblclick', event => {
      if (overviewOpen) { event.preventDefault(); event.stopPropagation(); return; }
      if (event.altKey || event.composedPath().some(node => node === divider || node === form || node?.tagName === 'BUTTON')) return;
      if (settings.doubleClickExit && pictureClick >= 2) { event.preventDefault(); close(); }
    });
    on(viewer, 'pointermove', event => {
      if (hold) return;
      if (event.clientY <= 72) viewer.classList.add('top-open');
      else if (event.clientY > 96 && !event.composedPath().includes($('.bar'))) viewer.classList.remove('top-open');
      const nearBottom = event.clientY >= viewer.getBoundingClientRect().bottom - 30;
      const overStrip = event.composedPath().includes(strip);
      if (nearBottom || overStrip) showStrip(true);
      else showStrip(false);
    });
    on(strip, 'pointerleave', () => showStrip(false));
    on(viewer, 'pointerleave', () => { showStrip(false); viewer.classList.remove('top-open'); });
    on(dialog, 'cancel', event => { event.preventDefault(); close(); });
    on(window, 'keydown', event => {
      if (closed) return;
      const typing = event.composedPath().some(n => n instanceof HTMLElement && (/^(INPUT|TEXTAREA|SELECT)$/.test(n.tagName) || n.isContentEditable));
      if (event.isComposing) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); return; }
      if (typing) return;
      if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.repeat && ['g', 'G', '1', '2'].includes(event.key)) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (event.key.toLowerCase() === 'g') overviewOpen ? exitOverview(false) : enterOverview();
        else setCompare(event.key === '2');
        return;
      }
      const overviewHorizontal = settings.overviewDirection === 'horizontal';
      const overviewNavigationKey = ['Home', 'End'].includes(event.key) ||
        (overviewHorizontal ? ['ArrowLeft', 'ArrowRight'].includes(event.key) : ['ArrowUp', 'ArrowDown'].includes(event.key));
      if (overviewOpen && overviewNavigationKey) {
        event.preventDefault(); event.stopImmediatePropagation();
        const horizontal = overviewHorizontal, axis = horizontal ? 'left' : 'top';
        const backwardKey = event.key === 'Home' || (horizontal ? event.key === 'ArrowLeft' : event.key === 'ArrowUp');
        overviewDirection = backwardKey ? -1 : 1;
        if (backwardKey && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) activateOverviewBackward();
        if (edgeSide && overviewDirection !== edgeSide) resetOverviewEdge();
        if (edgeAnimation) resetOverviewEdge();
        if (overviewEdgeDistance(overviewDirection) <= 1) {
          overviewEdgeIntent(overviewDirection, Math.max(120, (horizontal ? overview.clientWidth : overview.clientHeight) * .35), 'keyboard'); return;
        }
        if (event.key === 'Home') overview.scrollTo({ [axis]: 0, behavior: 'smooth' });
        else if (event.key === 'End') overview.scrollTo({ [axis]: horizontal ? overview.scrollWidth : overview.scrollHeight, behavior: 'smooth' });
        else overview.scrollBy({ [axis]: (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) * Math.max(120, (horizontal ? overview.clientWidth : overview.clientHeight) * .35), behavior: 'smooth' });
        requestAnimationFrame(() => checkOverviewCache(false)); return;
      }
      if (overviewOpen) {
        if (!event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'f') {
          event.preventDefault(); event.stopImmediatePropagation(); $('.fullscreen').click();
        }
        return;
      }
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        for (const selector of ['.prev', '.next']) $(selector).classList.remove('pointer-preview');
      }
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End', '0', '+', '=', '-', 'f', 'F'].includes(event.key)) { event.preventDefault(); event.stopImmediatePropagation(); }
      if (event.key === 'ArrowLeft') navigate(-1);
      if (event.key === 'ArrowRight') navigate(1);
      if (event.key === 'Home') compareEnabled ? showPair(0, 1) : showSingle(0);
      if (event.key === 'End') compareEnabled ? showPair(Math.max(0, entries.length - 2), entries.length - 1) : showSingle(entries.length - 1);
      if (event.key === '0') fit(); if (event.key === '+' || event.key === '=') zoom(1); if (event.key === '-') zoom(-1);
      if (event.key.toLowerCase() === 'f') $('.fullscreen').click();
    }, { capture: true });
    on(window, 'resize', () => { if (overviewOpen) queueOverviewCommit(); else fit(false); });
    const sizeObserver = new ResizeObserver(() => {
      if (closed || !overviewOpen) return;
      queueOverviewCommit();
    });
    sizeObserver.observe(overview);
    signal.addEventListener('abort', () => sizeObserver.disconnect(), { once: true });
    on(document, 'fullscreenchange', () => {
      const full = shadow.fullscreenElement === viewer || document.fullscreenElement === host || document.fullscreenElement === viewer;
      if (!full && wasFullscreen && !returningToPage) { close(); return; }
      wasFullscreen = full; returningToPage = false;
      updateFullscreenLabel();
      fit(false);
    });
    on(window, 'pagehide', close);
    rememberSourceAnchors();
    viewer.classList.toggle('toolbar-auto', settings.toolbarAutoHide);
    dialog.showModal(); viewer.focus();
    show(index);
  };
})();

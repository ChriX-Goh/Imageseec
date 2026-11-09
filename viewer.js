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
    .overview-grid { position: relative; margin: 0; }
    .overview-card { position: absolute; margin: 0; padding: 5px; border: 1px solid #ffffff1c; border-radius: 12px; background: #202229; cursor: pointer; text-align: left; overflow: hidden; }
    .overview-card:hover { border-color: #a9c0ff99; background: #2d3039; }
    .overview-card[aria-current="true"] { border-color: #b4c8ff; box-shadow: 0 0 16px #9fb9ff30; }
    .overview-card img { display: block; width: 100%; height: calc(100% - 27px); object-fit: contain; border-radius: 8px; background: #15171b; pointer-events: none; }
    .overview-card span { display: block; height: 27px; padding: 5px 3px 1px; color: #b6bac5; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .overview.clean .overview-card { border: 0; border-radius: 0; padding: 0; background: transparent; box-shadow: none; }
    .overview.clean .overview-card img { height: 100%; border-radius: 0; background: transparent; }
    .overview.clean .overview-card span { display: none; }
    .overview.clean .overview-card[aria-current="true"] img { filter: brightness(.88); }
    .overview-status { position: absolute; z-index: 1; left: 50%; translate: -50% 0; display: flex; align-items: center; gap: 8px; padding: 7px 12px; max-width: 85%; border-radius: 14px; color: #e3e9f8; background: #222632ed; font-size: 12px; text-align: center; pointer-events: none; }
    .overview-status[data-side="-1"] { top: 68px; }
    .overview-status[data-side="1"] { bottom: 12px; }
    .overview.horizontal ~ .overview-status { top: 50%; bottom: auto; translate: 0 -50%; max-width: min(20ch, 40%); }
    .overview.horizontal ~ .overview-status[data-side="-1"] { left: 12px; }
    .overview.horizontal ~ .overview-status[data-side="1"] { left: auto; right: 12px; }
    .overview-status[hidden] { display: none; }
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
  function visibleSourceBox(node) {
    let box = clipBox(node.getBoundingClientRect(), { left: 0, top: 0, right: innerWidth, bottom: innerHeight });
    for (let parent = node.parentElement; box && parent && parent !== document.body && parent !== document.documentElement; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      const clips = value => /auto|scroll|overlay|hidden|clip/.test(value);
      if (!clips(style.overflowX) && !clips(style.overflowY)) continue;
      const rect = parent.getBoundingClientRect();
      const left = rect.left + parent.clientLeft, top = rect.top + parent.clientTop;
      box = clipBox(box, {
        left: clips(style.overflowX) ? left : box.left,
        right: clips(style.overflowX) ? left + parent.clientWidth : box.right,
        top: clips(style.overflowY) ? top : box.top,
        bottom: clips(style.overflowY) ? top + parent.clientHeight : box.bottom
      });
    }
    return box;
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
    if (!target && (!snapshot || reduced)) return;
    const feedback = new AbortController();
    lens.feedbackController = feedback;
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    const layer = host.attachShadow({ mode: 'closed' });
    layer.innerHTML = `<style>
      :host { all: initial !important; position: fixed !important; inset: 0 !important; z-index: 2147483647 !important; pointer-events: none !important; }
      .return-layer { position: fixed; inset: 0; margin: 0; padding: 0; width: auto; height: auto; overflow: visible; border: 0; background: transparent; pointer-events: none; }
      .return-layer::backdrop { background: transparent; pointer-events: none; }
      canvas, i { position: absolute; box-sizing: border-box; object-fit: cover; pointer-events: none; }
      i { border: 2px solid #b8ceff; border-radius: 6px; box-shadow: 0 0 0 2px #142344b0, 0 0 20px #89acff80; }
    </style><div class="return-layer"></div>`;
    const surface = layer.querySelector('.return-layer');
    if (!parent) surface.setAttribute('popover', 'manual');
    (parent || document.documentElement).append(host);
    if (!parent) { try { surface.showPopover(); } catch { surface.removeAttribute('popover'); } }
    const stop = () => feedback.abort();
    for (const type of ['wheel', 'pointerdown', 'keydown', 'resize', 'pagehide']) {
      window.addEventListener(type, stop, { capture: true, signal: feedback.signal });
    }
    const frame = box => ({ left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
    const duration = reduced || !snapshot ? 0 : target ? 240 : 140;
    if (duration) {
      const { canvas, box } = snapshot;
      surface.append(canvas);
      const motion = canvas.animate([{ ...frame(box), opacity: 1 }, { ...frame(target || box), opacity: 0 }],
        { duration, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'both' });
      motion.onfinish = () => canvas.remove();
    }
    if (target) {
      const outline = document.createElement('i'); Object.assign(outline.style, frame(target)); surface.append(outline);
      if (duration) outline.animate([{ opacity: 0 }, { opacity: 1, offset: .28 }, { opacity: 1, offset: .76 }, { opacity: 0 }],
        { duration: duration + 800, fill: 'both' });
    }
    const timer = setTimeout(stop, duration + (target ? 800 : 0));
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
    const scanStates = Object.fromEntries([-1, 1].map(direction => [direction, { cursor: sourcePosition(), paused: false, ended: false, failed: false, lastAttempt: -Infinity }]));
    const sourceAnchors = new Map();
    let reservedSlots = Boolean(collection.slots?.some(slot => slot.pending));
    const initialSlotCount = collection.slots?.length || 0;
    let slotsExpanded = false;
    const restorePageCoordinates = () => {
      window.scrollTo(pagePosition.x, pagePosition.y);
      for (const item of pagePosition.elements) if (item.node.isConnected) { item.node.scrollTop = item.top; item.node.scrollLeft = item.left; }
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
      <div class="overview-shell" hidden><div class="overview" aria-label="${h('overviewTitle')}" aria-hidden="true" tabindex="0"><div class="overview-grid"></div></div>
        <div class="overview-status" data-side="-1" role="status" hidden></div><div class="overview-status" data-side="1" role="status" hidden></div></div>
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
    let overviewOpen = false, overviewReturn = null, overviewRecent = null, overviewAnchor = null, fromOverview = false, overviewBandSize = 1;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const overviewCards = new Map();
    let overviewPress = null, overviewCommitTimer = 0, overviewCommitStarted = 0, overviewDirty = false, pictureClick = 0;
    let overviewLayoutAnchor = null;
    let scanPromise = null, scanController = null, scanRestore = null, overviewScrollFrame = 0, overviewCacheCheckTimer = 0, scanRevision = 0, scanningDirection = 1, overviewDirection = 1, lastOverviewOffset = 0;
    let edgeSide = 0, edgePull = 0, edgeTimer = 0, edgeAnimation = null;
    const on = (node, type, handler, options = {}) => node.addEventListener(type, handler, { ...options, signal });

    function close(event) {
      if (closed) return;
      const snapshot = !standalone && event?.type !== 'pagehide' ? activeSnapshot() : null;
      const target = entries[overviewOpen ? centralOverviewIndex() : activeIndex()];
      rememberSourceAnchors();
      const targetPosition = target && sourceAnchors.get(target.key);
      closed = true; serial++; controller.abort(); preferencesBinding.abort(); observer.disconnect(); pool.clear();
      scanController?.abort(); scanRestore?.(); scanRestore = null;
      endHold(); clearTimeout(scanTimer); clearTimeout(overviewCacheCheckTimer); clearTimeout(overviewCommitTimer);
      resetOverviewEdge();
      lens.feedbackController?.abort();
      globalThis.chrome?.storage?.onChanged?.removeListener(storageChanged);
      const leavingFullscreen = document.fullscreenElement === viewer || document.fullscreenElement === host
        ? document.exitFullscreen().catch(() => {}) : null;
      dialog.close(); host.remove();
      restorePageCoordinates(); restorePageStyles();
      focused?.focus?.({ preventScroll: true });
      if (event?.type !== 'pagehide' && !standalone) revealSource(target, targetPosition, snapshot, leavingFullscreen);
      if (lens.close === close) lens.close = null;
      if (standalone) window.close();
    }
    lens.close = close;

    function rememberSourceAnchors() {
      const container = scanScroller?.getBoundingClientRect();
      for (const entry of entries) {
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
      try { node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }); }
      catch { node.scrollIntoView({ block: 'center', inline: 'nearest' }); }
    }
    async function revealSource(target, position, snapshot, leavingFullscreen) {
      if (!target) { returnFeedback(snapshot, null, null, reducedMotion.matches); return; }
      const recovery = new AbortController(); lens.returnController?.abort(); lens.returnController = recovery;
      const stop = () => recovery.abort();
      for (const type of ['wheel', 'pointerdown', 'keydown']) window.addEventListener(type, stop, { capture: true, once: true, signal: recovery.signal });
      const restoreAnchor = () => {
        if (!position) return;
        window.scrollTo(position.pageX, position.pageY);
        const elements = position.elements || [];
        for (const item of [...elements].reverse()) if (item.node.isConnected && item.node !== scanScroller) {
          item.node.scrollTop = item.top; item.node.scrollLeft = item.left;
        }
        if (scanScroller?.isConnected && elements.some(item => item.node === scanScroller)) {
          scanScroller[scanHorizontal ? 'scrollLeft' : 'scrollTop'] = position.position - (scanHorizontal ? scanScroller.clientWidth : scanScroller.clientHeight) / 2;
        } else {
          window.scrollTo(position.pageX, position.position - innerHeight / 2);
        }
      }
      try {
        if (leavingFullscreen) await leavingFullscreen;
        if (recovery.signal.aborted) return;
        let node = lens.gallery.connectedEntryNode(target, collection.scope);
        if (!node) { restoreAnchor(); returnFeedback(snapshot, null, null, reducedMotion.matches); snapshot = null; }
        const deadline = performance.now() + 2200;
        do {
          if (recovery.signal.aborted) return;
          node = lens.gallery.connectedEntryNode(target, collection.scope);
          if (!node && collection.scope?.isConnected) {
            const fresh = lens.gallery.collect(target.thumb, null, collection.scope);
            node = fresh.entries.find(entry => lens.gallery.sameEntry(target, entry))?.node;
          }
          if (node) {
            centerSourceNode(node);
            returnFeedback(snapshot, visibleSourceBox(node), null, reducedMotion.matches); return;
          }
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
    function updateOverviewStatus() {
      for (const side of [-1, 1]) {
        const label = $(`.overview-status[data-side="${side}"]`);
        const state = scanStates[side];
        const loading = Boolean(scanController && !scanController.signal.aborted && scanningDirection === side);
        const ended = state.ended || !collection.scope;
        const key = loading ? 'overviewLoading' : ended ? (side < 0 ? 'overviewStart' : 'overviewEnd')
          : state.failed ? 'overviewScanFailed' : state.paused ? 'overviewPaused' : '';
        const visible = overviewOpen && key && overviewEdgeDistance(side) <= (loading ? 120 : 2);
        label.hidden = !visible;
        const text = key ? (ended && !loading ? t(key) : `${t(side < 0 ? 'overviewEarlier' : 'overviewLater')}: ${t(key)}`) : '';
        if (label.textContent !== text || Boolean(label.querySelector('.loading-flower')) !== loading) {
          label.replaceChildren();
          if (loading) label.insertAdjacentHTML('afterbegin', flower);
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
      if (reducedMotion.matches || (!ended && !loading)) { updateOverviewStatus(); return; }
      edgeAnimation?.cancel(); edgeAnimation = null;
      if (edgeSide && edgeSide !== side) resetOverviewEdge();
      edgeSide = side;
      const horizontal = overview.classList.contains('horizontal');
      const limit = ended ? Math.min(64, (horizontal ? overview.clientWidth : overview.clientHeight) * .08) : 18;
      if (!limit) return;
      edgePull = Math.min(limit, edgePull + Math.min(120, amount) * .22 * (1 - edgePull / limit));
      const displacement = -side * edgePull;
      overview.style.translate = horizontal ? `${displacement}px 0px` : `0px ${displacement}px`;
      clearTimeout(edgeTimer);
      if (ended) edgeTimer = setTimeout(() => resetOverviewEdge(true, true), 95);
      updateOverviewStatus();
    }
    function centralOverviewIndex() {
      const rect = overview.getBoundingClientRect();
      const grid = overviewGrid.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const cards = [...overviewGrid.children].map(card => ({ card, box: overviewCardBox(card, grid) }))
        .filter(({ box }) => box.right > rect.left && box.left < rect.right && box.bottom > rect.top && box.top < rect.bottom);
      cards.sort((a, b) => Math.hypot(a.box.left + a.box.width / 2 - cx, a.box.top + a.box.height / 2 - cy) - Math.hypot(b.box.left + b.box.width / 2 - cx, b.box.top + b.box.height / 2 - cy));
      const index = cards.length ? entries.findIndex(entry => entry.key === cards[0].card.dataset.key) : -1;
      return index >= 0 ? index : activeIndex();
    }
    function captureOverviewAnchor() {
      const card = overviewCards.get(entries[centralOverviewIndex()]?.key);
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
      overviewCommitTimer = setTimeout(() => renderOverview(), Math.max(0, Math.min(80, 120 - (performance.now() - overviewCommitStarted))));
    }
    function renderOverview(anchor, animate = true) {
      if (!overviewOpen) return;
      if (overviewPress) { overviewDirty = true; return; }
      clearTimeout(overviewCommitTimer);
      overviewCommitTimer = overviewCommitStarted = 0;
      overviewDirty = false;
      // Keep the same reference through successive late images. A real scroll picks a new reference.
      anchor ??= overviewLayoutAnchor ?? (overviewGrid.children.length ? captureOverviewAnchor() : overviewAnchor);
      overviewLayoutAnchor = anchor;
      const previous = new Map();
      if (animate && !reducedMotion.matches) {
        const view = overview.getBoundingClientRect();
        const grid = overviewGrid.getBoundingClientRect();
        for (const [key, card] of overviewCards) {
          const box = overviewCardBox(card, grid);
          if (box.bottom >= view.top - 180 && box.top <= view.bottom + 180 && box.right >= view.left - 180 && box.left <= view.right + 180) {
            previous.set(key, card.getBoundingClientRect());
          }
        }
      }
      const currentKeys = new Set(compareEnabled ? [entries[compareLeft]?.key, entries[compareRight]?.key] : [entries[index]?.key]);
      const live = new Set(entries.map(entry => entry.key));
      for (const [key, card] of overviewCards) if (!live.has(key)) { card.remove(); overviewCards.delete(key); }
      let cursor = overviewGrid.firstElementChild;
      entries.forEach((entry, n) => {
        let card = overviewCards.get(entry.key);
        if (!card) {
          card = document.createElement('button'); card.type = 'button'; card.className = 'overview-card';
          const image = document.createElement('img'); image.alt = ''; image.loading = 'lazy'; image.decoding = 'async'; image.draggable = false;
          const label = document.createElement('span'); card.append(image, label);
          overviewCards.set(entry.key, card);
        }
        card.dataset.key = entry.key; card.dataset.index = String(n);
        card.setAttribute('aria-label', t('viewImage', n + 1) + (entry.title ? `: ${entry.title}` : ''));
        card.setAttribute('aria-current', String(currentKeys.has(entry.key)));
        const image = card.querySelector('img');
        image.dataset.src = entry.thumb;
        card.querySelector('span').textContent = t('imageCount', n + 1, entries.length);
        if (card !== cursor) overviewGrid.insertBefore(card, cursor);
        cursor = card.nextElementSibling;
      });
      layoutOverview(anchor);
      const laidOutGrid = overviewGrid.getBoundingClientRect();
      for (const [key, from] of previous) {
        const card = overviewCards.get(key);
        if (!card) continue;
        const to = overviewCardBox(card, laidOutGrid);
        if (Math.max(Math.abs(from.left - to.left), Math.abs(from.top - to.top), Math.abs(from.width - to.width), Math.abs(from.height - to.height)) < 1) continue;
        card.getAnimations().forEach(animation => animation.cancel());
        card.animate([
          { translate: `${from.left - to.left}px ${from.top - to.top}px`, width: `${from.width}px`, height: `${from.height}px` },
          { translate: '0px 0px', width: `${to.width}px`, height: `${to.height}px` }
        ], { duration: 240, easing: 'cubic-bezier(.2,.7,.25,1)' });
      }
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
      const layout = lens.controls.overviewLayout(entries.map(e => Number(e.aspectRatio)), width, height, horizontal, settings.overviewClean, settings.overviewAlignment, settings.overviewGap, settings.overviewScale);
      overviewBandSize = layout.bandSize || 1;
      [...overviewGrid.children].forEach((card, n) => {
        const box = layout.boxes[n];
        Object.assign(card.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.width}px`, height: `${box.height}px` });
      });
      overviewGrid.style.width = `${layout.width}px`; overviewGrid.style.height = `${layout.height}px`;
      restoreOverviewAnchor(anchor);
    }
    function overviewVisibleRange(rect = overview.getBoundingClientRect()) {
      const grid = overviewGrid.getBoundingClientRect();
      const visible = [...overviewGrid.children].filter(card => {
        const box = overviewCardBox(card, grid);
        return box.right > rect.left && box.left < rect.right && box.bottom > rect.top && box.top < rect.bottom;
      }).map(card => Number(card.dataset.index)).filter(Number.isInteger);
      if (visible.length) return { first: Math.min(...visible), last: Math.max(...visible) };
      const fallback = Math.max(0, Math.min(entries.length - 1, activeIndex()));
      return { first: fallback, last: fallback };
    }
    function overviewCacheCount(side) {
      const mode = settings[`overviewCache${side}Mode`];
      return mode === 'custom' ? settings[`overviewCache${side}`] : Math.max(1, overviewBandSize) * 2;
    }
    function overviewCacheWindow(rect = overview.getBoundingClientRect()) {
      const visible = overviewVisibleRange(rect);
      const countBefore = overviewCacheCount('Before'), countAfter = overviewCacheCount('After');
      return { ...visible, ...lens.controls.overviewCacheRange(entries.length, visible.first, visible.last, countBefore, countAfter), countBefore, countAfter };
    }
    function updateOverviewThumbnails() {
      if (!overviewOpen || (overviewPress && overviewDirty)) return;
      const cards = [...overviewGrid.children], window = overviewCacheWindow();
      for (const card of cards) {
        const image = card.querySelector('img'), source = image.dataset.src;
        const index = Number(card.dataset.index), shouldLoad = index >= window.start && index <= window.end;
        image.loading = shouldLoad ? 'eager' : 'lazy';
        if (!shouldLoad || !source) { image.onload = null; if (image.hasAttribute('src')) image.removeAttribute('src'); continue; }
        if (image.getAttribute('src') !== source) {
          const key = card.dataset.key;
          const loaded = () => {
            if (closed || !image.naturalWidth || !image.naturalHeight || image.currentSrc !== source || image.dataset.src !== source) return;
            const current = entries.find(item => item.key === key);
            if (!current || current.thumb !== source) return;
            const ratio = image.naturalWidth / image.naturalHeight;
            const changed = Math.abs(current.aspectRatio - ratio) > .001;
            current.aspectRatio = ratio; current.dimensions = [image.naturalWidth, image.naturalHeight];
            if (changed) queueOverviewCommit();
          };
          image.onload = loaded;
          image.src = source;
          if (image.complete) loaded();
        }
      }
    }
    function scheduleOverviewCacheCheck() {
      if (overviewCacheCheckTimer || closed) return;
      overviewCacheCheckTimer = setTimeout(() => { overviewCacheCheckTimer = 0; checkOverviewCache(); }, 650);
    }
    function checkOverviewCache(force = false) {
      if (!overviewOpen || scanPromise || !collection.scope) return;
      const window = overviewCacheWindow();
      const missing = {
        [-1]: Math.max(0, window.countBefore - window.before),
        [1]: Math.max(0, window.countAfter - window.after)
      };
      const horizontal = settings.overviewDirection === 'horizontal';
      const offset = horizontal ? overview.scrollLeft : overview.scrollTop;
      const viewport = horizontal ? overview.clientWidth : overview.clientHeight;
      const extent = horizontal ? overview.scrollWidth : overview.scrollHeight;
      const edgeDistance = Math.max(120, viewport * .35);
      const nearEdge = {
        [-1]: offset <= edgeDistance,
        [1]: extent - offset - viewport <= edgeDistance
      };
      const directions = overviewDirection < 0 ? [-1, 1] : [1, -1];
      for (const direction of directions) {
        const state = scanStates[direction];
        if ((!missing[direction] && !nearEdge[direction]) || state.ended || (state.paused && !force) || (state.failed && !force)) continue;
        if (performance.now() - state.lastAttempt < 600) { scheduleOverviewCacheCheck(); return; }
        const scan = scanMore(direction, force, Math.min(6, missing[direction] || 6));
        if (scan) scan.finally(() => { if (!closed && overviewOpen) scheduleOverviewCacheCheck(); });
        return;
      }
    }
    function scanDelay(ms, signal) {
      return new Promise(resolve => {
        const timer = setTimeout(done, ms);
        function done() { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); }
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
      const pending = slots.filter(slot => slot.pending);
      const first = slots[0]?.node || collection.scope, last = slots.at(-1)?.node || collection.scope;
      const lastBox = last.getBoundingClientRect();
      const low = Math.max(0, coordinate(first) - viewport * .25);
      const scopeBox = collection.scope.getBoundingClientRect();
      const end = slots.length ? coordinate(last) + (scanHorizontal ? lastBox.width : lastBox.height) : coordinate(collection.scope) + (scanHorizontal ? scopeBox.width : scopeBox.height);
      const high = Math.min(Math.max(0, maximum), Math.max(low, end - viewport * .25));
      let next = state.cursor + direction * Math.max(200, viewport * .75);
      if (pending.length) {
        const ahead = pending.filter(slot => direction > 0 ? coordinate(slot.node) - viewport * .2 >= state.cursor - 2 : coordinate(slot.node) - viewport * .2 <= state.cursor + 2);
        const slot = direction > 0 ? ahead[0] || pending[0] : ahead.at(-1) || pending.at(-1);
        const desired = coordinate(slot.node) - viewport * .2;
        // Reserved space provides a safe target beyond already loaded pictures.
        if (ahead.length) next = desired;
      }
      next = Math.max(low, Math.min(high, next));
      const edge = direction > 0 ? next >= high - 2 : next <= low + 2;
      scanRestore = restorePageCoordinates;
      try {
        if (scanScroller) scanScroller[scanHorizontal ? 'scrollLeft' : 'scrollTop'] = next;
        else window.scrollTo(pagePosition.x, next);
        state.cursor = sourcePosition();
        let revision = scanRevision, stableSince = performance.now();
        const started = performance.now(), before = entries.length;
        do {
          await scanDelay(140, signal);
          if (signal.aborted || closed) break;
          if (revision !== scanRevision) { revision = scanRevision; stableSince = performance.now(); }
          if (performance.now() - started >= 650 && performance.now() - stableSince >= 280) {
            refresh(direction);
            if (entries.length > before || (!pending.length && !edge)) break;
          }
        } while (performance.now() - started < (pending.length || edge ? 3500 : 1200));
        if (!signal.aborted && !closed) { refresh(direction); rememberSourceAnchors(); }
        return { edge, pending: collection.slots?.some(slot => slot.pending) };
      } finally {
        if (scanRestore) { scanRestore(); scanRestore = null; }
      }
    }
    async function scanMore(direction = 1, force = false, targetCount = 6) {
      const state = scanStates[direction];
      if (scanPromise || closed || !collection.scope || state.ended || (!force && state.paused) || performance.now() - state.lastAttempt < 600) return scanPromise;
      state.paused = state.ended = state.failed = false; state.lastAttempt = performance.now(); scanningDirection = direction;
      scanController = new AbortController();
      const signal = scanController.signal;
      if (overviewOpen) updateOverviewStatus();
      const initialCount = entries.length;
      const target = Math.max(1, Math.min(6, Math.floor(Number(targetCount) || 6)));
      scanPromise = (async () => {
        try {
          const deadline = performance.now() + 16000;
          let edgeStalls = 0;
          for (let attempt = 0; attempt < 12 && performance.now() < deadline; attempt++) {
            if (signal.aborted || closed) break;
            const before = entries.length;
            const result = await scanSegment(signal, direction);
            if (signal.aborted || closed) break;
            edgeStalls = result?.edge && entries.length === before ? edgeStalls + 1 : 0;
            if (edgeStalls >= 2) {
              state.ended = reservedSlots && !slotsExpanded && !result.pending;
              break;
            }
            if (entries.length - initialCount >= target) break;
          }
          if (!signal.aborted && entries.length === initialCount) state.paused = !state.ended;
        } catch (error) {
          if (!signal.aborted) { state.failed = true; state.paused = true; }
        }
      })().finally(() => {
        scanPromise = null; scanController = null;
        updateNavigationButtons();
        if (!closed && overviewOpen) {
          if (edgeSide === direction) resetOverviewEdge(true);
          updateOverviewStatus(); queueOverviewCommit();
        }
      });
      return scanPromise;
    }
    function pictureState() {
      return {
        compareEnabled, index, indexKey: entries[index]?.key, left: compareLeft, right: compareRight,
        leftKey: entries[compareLeft]?.key, rightKey: entries[compareRight]?.key, activePane, lockedPane, pairNeedsAnchor,
        scale, panX, panY, compareScale, comparePanX: [...comparePanX], comparePanY: [...comparePanY], dividerPosition, fromOverview
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
      if (!fromOverview || !overviewReturn) overviewReturn = overviewRecent;
      overviewOpen = true; pictureClick = 0;
      overviewShell.hidden = false;
      overview.classList.add('active'); overview.setAttribute('aria-hidden', 'false');
      updateOverviewButton();
      compare.classList.toggle('active', false); stage.hidden = true; compare.setAttribute('aria-hidden', 'true');
      showStrip(false); $('.counter').textContent = `${entries.length}`;
      renderOverview(overviewAnchor, false); overview.focus({ preventScroll: true });
      const card = overviewCards.get(key);
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
    async function exitOverview(selectImage = false, selectedIndex = -1, explicitMode = null, restoreParent = false) {
      if (!overviewOpen) return;
      overviewAnchor = captureOverviewAnchor();
      const state = restoreParent ? overviewReturn : overviewRecent;
      overviewPress?.animations.forEach(animation => animation.cancel());
      overviewOpen = false; overviewPress = null; pictureClick = 0;
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
        fromOverview = true;
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
        fromOverview = restoreParent ? false : Boolean(state.fromOverview);
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
      if (!fromOverview) overviewReturn = null;
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
        const selected = focusedCard ? entries.findIndex(entry => entry.key === focusedCard.dataset.key) : -1;
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
      slotsExpanded ||= collection.slots.length > initialSlotCount;
      reservedSlots ||= collection.slots.some(slot => slot.pending);
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
        cacheNeighbors(); if (strip.classList.contains('visible')) renderStrip();
        if (overviewOpen) queueOverviewCommit();
      }
      if (overviewOpen && refreshed && !changed) queueOverviewCommit();
    }
    function storageChanged(changes, area) {
      if (area !== 'local' || !changes.settings) return;
      const previouslyLocked = settings.zoomLocked;
      const previousLanguage = settings.language;
      settings = lens.settings.normalize(changes.settings.newValue); cacheNeighbors();
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
    const observer = new MutationObserver(records => {
      if (!records.some(record => !host.contains(record.target) && (collection.scope?.contains(record.target) || record.target === scopeParent))) return;
      scanRevision++;
      if (!scanPromise) for (const state of Object.values(scanStates)) state.paused = state.ended = state.failed = false;
      clearTimeout(scanTimer); scanTimer = setTimeout(() => { refresh(); if (!closed && overviewOpen) checkOverviewCache(); }, 300);
    });
    observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: lens.gallery.observedAttributes });
    globalThis.chrome?.storage?.onChanged?.addListener(storageChanged);
    on($('.close'), 'click', close);
    on($('.prev'), 'click', () => navigate(-1)); on($('.next'), 'click', () => navigate(1));
    on($('.compare-toggle'), 'click', () => setCompare(!compareEnabled));
    on($('.overview-toggle'), 'click', () => overviewOpen ? exitOverview(false) : enterOverview());
    on(overviewGrid, 'pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      const card = event.target.closest('.overview-card');
      if (card) {
        const animations = [...card.getAnimations(), ...(edgeAnimation ? [edgeAnimation] : [])].filter(animation => animation.playState === 'running');
        animations.forEach(animation => animation.pause());
        overviewPress = { pointer: event.pointerId, key: card.dataset.key, animations };
      }
    });
    const releaseOverviewPress = event => {
      const press = overviewPress;
      if (!press || (event.pointerId !== undefined && press.pointer !== event.pointerId)) return;
      setTimeout(() => {
        if (overviewPress !== press) return;
        overviewPress = null;
        press.animations.forEach(animation => { if (animation.playState === 'paused') animation.play(); });
        if (edgeSide && (!scanController || scanningDirection !== edgeSide || overviewEdgeDistance(edgeSide) > 2)) {
          resetOverviewEdge(true, scanStates[edgeSide].ended || !collection.scope);
        }
        if (overviewDirty) queueOverviewCommit();
      }, 0);
    };
    on(window, 'pointerup', releaseOverviewPress, { capture: true });
    on(window, 'pointercancel', releaseOverviewPress, { capture: true });
    on(window, 'blur', releaseOverviewPress);
    on(overviewGrid, 'click', event => {
      const key = event.target.closest('.overview-card')?.dataset.key;
      if (!key || (event.detail && overviewPress && key !== overviewPress.key)) return;
      const selected = entries.findIndex(entry => entry.key === key);
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
        updateOverviewThumbnails(); checkOverviewCache(true); updateOverviewStatus();
      });
    }, { passive: true });
    on(overview, 'wheel', event => {
      if (event.ctrlKey || event.metaKey || event.composedPath().includes(form)) return;
      const horizontal = settings.overviewDirection === 'horizontal';
      const delta = (horizontal || event.altKey || event.shiftKey) && Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      if (event.altKey || event.shiftKey) {
        event.preventDefault(); event.stopPropagation();
        setOverviewSize(settings.overviewScale + (delta < 0 ? 1 : -1) * (event.shiftKey ? 1 : settings.zoomStep)); return;
      }
      overviewDirection = delta < 0 ? -1 : 1;
      if (edgeSide && overviewDirection !== edgeSide) resetOverviewEdge();
      const amount = delta * (event.deltaMode === 1 ? 32 : event.deltaMode === 2 ? (horizontal ? overview.clientWidth : overview.clientHeight) : 1);
      const atEdge = overviewEdgeDistance(overviewDirection) <= 1;
      if (!atEdge && edgeAnimation) resetOverviewEdge();
      if (horizontal || atEdge) {
        event.preventDefault(); event.stopPropagation();
        if (!atEdge) overview.scrollLeft += amount;
      }
      checkOverviewCache(true);
      if (atEdge) pushOverviewEdge(overviewDirection, Math.abs(amount));
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
      if (hold) return;
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
        followHold(event);
      }
      target.setPointerCapture(event.pointerId);
      target.classList.add(mode === 'drag' ? 'dragging' : 'holding'); viewer.classList.add('moving');
      showStrip(false); event.preventDefault();
    }
    on(stage, 'pointerdown', event => startHold(event, stage));
    on(compare, 'pointerdown', event => startHold(event, compare));
    function followHold(event) {
      if (!hold || event.pointerId !== hold.pointerId) return;
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
      on(target, 'pointerup', endHold); on(target, 'pointercancel', endHold); on(target, 'lostpointercapture', endHold);
      on(target, 'click', event => {
        if (event.altKey || event.composedPath().some(node => node?.tagName === 'BUTTON')) { pictureClick = 0; return; }
        pictureClick = event.detail === 1 || !pictureClick ? 1 : pictureClick + 1;
      });
    }
    on(window, 'blur', endHold);
    on(viewer, 'dblclick', event => {
      if (overviewOpen) { event.preventDefault(); event.stopPropagation(); return; }
      if (event.altKey || event.composedPath().some(node => node === divider || node === form || node?.tagName === 'BUTTON')) return;
      if (fromOverview && overviewReturn) { if (pictureClick >= 2) { event.preventDefault(); enterOverview(); } }
      else if (settings.doubleClickExit) { event.preventDefault(); close(); }
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
    function back() {
      if (overviewOpen) exitOverview(false, -1, null, true);
      else if (fromOverview && overviewReturn) enterOverview();
      else close();
    }
    on(dialog, 'cancel', event => { event.preventDefault(); back(); });
    on(window, 'keydown', event => {
      if (closed) return;
      const typing = event.composedPath().some(n => n instanceof HTMLElement && (/^(INPUT|TEXTAREA|SELECT)$/.test(n.tagName) || n.isContentEditable));
      if (event.isComposing) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); back(); return; }
      if (typing) return;
      if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.repeat && ['g', 'G', '1', '2'].includes(event.key)) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (event.key.toLowerCase() === 'g') overviewOpen ? exitOverview(false) : enterOverview();
        else setCompare(event.key === '2');
        return;
      }
      if (overviewOpen && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); event.stopImmediatePropagation();
        const horizontal = settings.overviewDirection === 'horizontal', axis = horizontal ? 'left' : 'top';
        overviewDirection = ['ArrowUp', 'ArrowLeft', 'Home'].includes(event.key) ? -1 : 1;
        if (edgeSide && overviewDirection !== edgeSide) resetOverviewEdge();
        if (overviewEdgeDistance(overviewDirection) <= 1) {
          checkOverviewCache(true); pushOverviewEdge(overviewDirection, 100); return;
        }
        if (event.key === 'Home') overview.scrollTo({ [axis]: 0, behavior: 'smooth' });
        else if (event.key === 'End') overview.scrollTo({ [axis]: horizontal ? overview.scrollWidth : overview.scrollHeight, behavior: 'smooth' });
        else overview.scrollBy({ [axis]: (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) * Math.max(120, (horizontal ? overview.clientWidth : overview.clientHeight) * .35), behavior: 'smooth' });
        requestAnimationFrame(() => checkOverviewCache(true)); return;
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

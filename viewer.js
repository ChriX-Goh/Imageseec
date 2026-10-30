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
    .bar { position: absolute; z-index: 5; left: 26px; right: 26px; top: 20px; display: flex; gap: 14px; align-items: center; pointer-events: none; }
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
    .stage.zoomed { cursor: grab; }
    .stage.holding { cursor: zoom-out; }
    .stage.dragging { cursor: grabbing; }
    .edge { position: absolute; z-index: 3; top: 18%; bottom: 20%; width: clamp(52px, 9vw, 150px); border: 0; border-radius: 0; background: transparent; display: flex; align-items: center; justify-content: center; opacity: .4; transition: opacity .18s, background .18s; }
    .edge:hover { opacity: 1; background: linear-gradient(90deg, #0003, transparent); }
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
    @media(max-width: 600px) { .bar { left: 12px; right: 12px; top: 12px; gap: 8px; } .brand { font-size: 13px; } .tools { gap: 4px; } .tools button { width: 34px; height: 34px; } .thumb { flex-basis: 62px; width: 62px; height: 62px; } .strip { padding-inline: 12px; } .counter { font-size: 10px; } }
    @media(prefers-reduced-motion: reduce) { * { transition: none !important; } }
  `;
  const icon = name => {
    const paths = { close: '<path d="m6 6 12 12M18 6 6 18"/>', prev: '<path d="m14 5-7 7 7 7"/>', next: '<path d="m10 5 7 7-7 7"/>', full: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>', settings: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="#25272c"/><circle cx="15" cy="12" r="2" fill="#25272c"/><circle cx="9" cy="18" r="2" fill="#25272c"/>', lens: '<path d="M8 3H3v5m18 0V3h-5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="5"/><path d="M12 4v3m0 10v3M4 12h3m10 0h3"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>' };
    paths.lock = '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/>';
    paths.unlock = '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/><path d="M12 14v3"/>';
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
  };

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
    const collection = lens.gallery.collect(source);
    let entries = collection.entries;
    let index = collection.index;
    let settings = lens.settings.normalize(rawSettings);
    const pool = new ImagePool();
    const controller = new AbortController();
    const signal = controller.signal;
    let preferencesBinding = new AbortController();
    const focused = document.activeElement;
    const scroll = { value: document.documentElement.style.getPropertyValue('overflow'), priority: document.documentElement.style.getPropertyPriority('overflow') };
    document.documentElement.style.setProperty('overflow', 'hidden', 'important');
    const host = document.createElement('div');
    host.id = 'image-lens-viewer';
    host.lang = lens.i18n.locale.replace('_', '-');
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${css}${lens.preferences.css}</style><dialog aria-label="${h('viewerTitle')}"><section class="viewer" tabindex="-1" role="region" aria-label="${h('viewerRegion')}">
      <div class="stage"><img class="photo" alt="" draggable="false" hidden></div>
      <header class="bar"><div class="brand">${icon('lens')}Imageseec</div><div class="counter"></div><div class="resolution"></div><div class="tools">
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
    const message = $('.message');
    const strip = $('.strip');
    const form = $('.settings');
    let closed = false, serial = 0, scale = 1, fitted = 1, panX = 0, panY = 0, width = 0, height = 0, hold = null, scanTimer = 0, wasFullscreen = false, returningToPage = false, lastWheel = 0, lastFineWheel = 0;
    let lockedScale = null;
    let preset = null, rulerMaximum = 100, sliding = false;
    const on = (node, type, handler, options = {}) => node.addEventListener(type, handler, { ...options, signal });

    function close() {
      if (closed) return;
      closed = true; serial++; controller.abort(); preferencesBinding.abort(); observer.disconnect(); pool.clear();
      endHold(); clearTimeout(scanTimer);
      globalThis.chrome?.storage?.onChanged?.removeListener(storageChanged);
      if (document.fullscreenElement === viewer || document.fullscreenElement === host) document.exitFullscreen().catch(() => {});
      dialog.close(); host.remove();
      if (document.documentElement.style.getPropertyValue('overflow') === 'hidden' && document.documentElement.style.getPropertyPriority('overflow') === 'important') {
        if (scroll.value) document.documentElement.style.setProperty('overflow', scroll.value, scroll.priority);
        else document.documentElement.style.removeProperty('overflow');
      }
      focused?.focus?.({ preventScroll: true });
      if (lens.close === close) lens.close = null;
      if (standalone) window.close();
    }
    lens.close = close;
    function status(text, retry = false) {
      message.replaceChildren(document.createTextNode(text)); message.hidden = false;
      if (retry) { const b = document.createElement('button'); b.textContent = t('retry'); b.onclick = () => { pool.retain(new Set()); show(index); }; message.append(b); }
    }
    function transform() {
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
      if (!sliding) rulerMaximum = lens.controls.rulerMax(scale * 100);
      $('.zoom-slider').value = lens.controls.toPosition(scale * 100, rulerMaximum);
      $('.zoom-slider').setAttribute('aria-valuetext', `${Math.round(scale * 100)}%`);
      const last = $('.zoom-ticks [data-tick="4"]');
      last.textContent = rulerMaximum; last.classList.toggle('over', rulerMaximum > 100);
      last.setAttribute('aria-label', t('zoomTo', rulerMaximum));
      $('.zoom-control').classList.toggle('over', scale > 1);
    }
    function fit(manual = true) {
      endHold();
      preset = null;
      if (!width || !height) return;
      const rect = stage.getBoundingClientRect();
      fitted = Math.min(1, rect.width / width, rect.height / height);
      scale = !manual && settings.zoomLocked && lockedScale !== null ? lockedScale : fitted;
      if (settings.zoomLocked) lockedScale = scale;
      panX = panY = 0; transform();
    }
    function zoom(direction, clientX = stage.clientWidth / 2, clientY = stage.clientHeight / 2, units = 1) {
      endHold();
      if (photo.hidden || !width) return;
      setScale(scale * Math.pow(1 + settings.zoomStep / 100, direction * units), clientX, clientY);
    }
    function setScale(value, clientX = stage.clientWidth / 2, clientY = stage.clientHeight / 2) {
      endHold();
      preset = null;
      if (photo.hidden || !width) return;
      const previous = scale;
      scale = Math.max(.001, Math.min(5, value));
      const rect = stage.getBoundingClientRect();
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
      if (strip.classList.contains('visible')) renderStrip();
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
      $('.prev').setAttribute('aria-label', t('previous'));
      $('.prev').title = `${t('previous')} (←)`;
      $('.next').setAttribute('aria-label', t('next'));
      $('.next').title = `${t('next')} (→)`;
      $('.strip').setAttribute('aria-label', t('nearby'));
      $('.thumbs').setAttribute('aria-label', t('thumbnails'));
      updateLock(); updateFullscreenLabel(); updateRuler(); updateEdgePreviews();
      if (!message.hidden && photo.hidden) status(t(message.querySelector('button') ? 'loadFailed' : 'loading'), Boolean(message.querySelector('button')));
      if (width && height) $('.sr').textContent = t('imageCount', index + 1, entries.length);
      form.innerHTML = lens.preferences.html;
      bindPreferences();
      form.hidden = !wasOpen;
      lens.preferences.fill(form, settings);
      if (wasOpen && focusedName === 'language') form.querySelector('[name="language"]').focus();
      if (strip.classList.contains('visible')) renderStrip();
      updateEdgePreviews();
    }
    function cacheNeighbors() {
      const keys = new Set(); const nearby = [];
      for (let offset = 0; offset <= Math.max(settings.cacheBefore, settings.cacheAfter); offset++) {
        for (const n of offset === 0 ? [index] : [index - offset, index + offset]) {
          if (n < 0 || n >= entries.length || n < index - settings.cacheBefore || n > index + settings.cacheAfter) continue;
          keys.add(entries[n].key); nearby.push(entries[n]);
        }
      }
      pool.retain(keys);
      for (const entry of nearby) pool.get(entry, entry === entries[index]);
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
          if (!offset) { b.classList.add('current'); b.setAttribute('aria-current', 'true'); }
          const img = new Image(); img.alt = ''; img.src = entry.thumb; img.draggable = false;
          const label = document.createElement('span'); label.textContent = n + 1;
          b.append(img, label); b.onclick = () => show(n);
        }
        container.append(b);
      }
      $('.strip-count').textContent = `${index + 1} / ${entries.length}`;
      requestAnimationFrame(() => {
        const current = container.querySelector('.current');
        if (current) container.scrollLeft = current.offsetLeft - container.offsetLeft - container.clientWidth / 2 + current.clientWidth / 2;
      });
    }
    function showStrip(visible) {
      if (visible) { if (!strip.classList.contains('visible')) renderStrip(); strip.classList.add('visible'); viewer.classList.add('strip-open'); }
      else { strip.classList.remove('visible'); viewer.classList.remove('strip-open'); }
    }
    function updateEdgePreviews() {
      for (const [selector, n] of [['.prev', index - 1], ['.next', index + 1]]) {
        const button = $(selector), entry = entries[n];
        const image = button.querySelector('.edge-preview img');
        button.querySelector('small').textContent = entry ? t('imageCount', n + 1, entries.length) : '';
        if (entry && button.classList.contains('pointer-preview')) image.src = entry.thumb;
        else image.removeAttribute('src');
      }
    }
    async function show(nextIndex) {
      if (closed || nextIndex < 0 || nextIndex >= entries.length) return;
      index = nextIndex; const id = ++serial; const entry = entries[index];
      preset = null;
      endHold(); photo.hidden = true; width = height = 0; stage.classList.remove('zoomed');
      $('.counter').textContent = `${index + 1} / ${entries.length}`;
      $('.prev').disabled = index === 0; $('.next').disabled = index === entries.length - 1;
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
      fitted = Math.min(1, rect.width / width, rect.height / height);
      scale = settings.zoomLocked && lockedScale !== null ? lockedScale : fitted;
      if (settings.zoomLocked) lockedScale = scale;
      panX = panY = 0; transform();
      $('.resolution').textContent = `${width} × ${height}`;
      if (note) $('.resolution').title = note;
      $('.sr').textContent = t('imageCount', index + 1, entries.length);
    }
    function refresh() {
      if (closed || standalone) return;
      const current = entries[index];
      const newer = lens.gallery.collect(current.thumb, current.node);
      // Retain already discovered entries when a virtual list recycles its DOM.
      const known = new Map(entries.map(e => [e.key, e]));
      let changed = false;
      for (let n = 0; n < newer.entries.length; n++) {
        const entry = newer.entries[n];
        if (known.has(entry.key)) { Object.assign(known.get(entry.key), entry); continue; }
        const previous = newer.entries.slice(0, n).reverse().find(e => known.has(e.key));
        const next = newer.entries.slice(n + 1).find(e => known.has(e.key));
        const at = previous ? entries.findIndex(e => e.key === previous.key) + 1 : next ? entries.findIndex(e => e.key === next.key) : entries.length;
        entries.splice(at, 0, entry); known.set(entry.key, entry); changed = true;
      }
      if (changed) {
        index = entries.findIndex(e => e.key === current.key);
        $('.counter').textContent = `${index + 1} / ${entries.length}`;
        $('.sr').textContent = t('imageCount', index + 1, entries.length);
        $('.prev').disabled = index === 0; $('.next').disabled = index === entries.length - 1;
        updateEdgePreviews();
        cacheNeighbors(); if (strip.classList.contains('visible')) renderStrip();
      }
    }
    function storageChanged(changes, area) {
      if (area !== 'local' || !changes.settings) return;
      const previouslyLocked = settings.zoomLocked;
      const previousLanguage = settings.language;
      settings = lens.settings.normalize(changes.settings.newValue); cacheNeighbors();
      if (settings.zoomLocked && !previouslyLocked) lockedScale = hold?.scale ?? scale;
      updateLock();
      if (previousLanguage !== settings.language) refreshLanguage();
      else lens.preferences.fill(form, settings);
      if (strip.classList.contains('visible')) renderStrip();
    }
    const observer = new MutationObserver(() => { clearTimeout(scanTimer); scanTimer = setTimeout(refresh, 350); });
    observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'srcset', 'data-src', 'data-original'] });
    globalThis.chrome?.storage?.onChanged?.addListener(storageChanged);
    on($('.close'), 'click', close);
    on($('.prev'), 'click', () => show(index - 1)); on($('.next'), 'click', () => show(index + 1));
    for (const selector of ['.prev', '.next']) {
      on($(selector), 'pointerenter', () => { $(selector).classList.add('pointer-preview'); updateEdgePreviews(); });
      on($(selector), 'pointermove', () => { if (!$(selector).classList.contains('pointer-preview')) { $(selector).classList.add('pointer-preview'); updateEdgePreviews(); } });
      on($(selector), 'pointerleave', () => { $(selector).classList.remove('pointer-preview'); updateEdgePreviews(); });
    }
    on($('.fit'), 'click', () => {
      if (!width || photo.hidden) return;
      const cycle = preset || { original: scale, step: 0 };
      const rect = stage.getBoundingClientRect();
      const value = [Math.min(rect.width / width, rect.height / height), 1, cycle.original][cycle.step];
      setScale(value); panX = panY = 0; transform();
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
    on($('.zoom-slider'), 'input', event => setScale(lens.controls.fromPosition(event.target.value, rulerMaximum) / 100));
    on($('.zoom-ticks'), 'click', event => {
      const tick = event.target.closest('[data-tick]');
      if (tick) setScale(lens.controls.fromPosition(Number(tick.dataset.tick), rulerMaximum) / 100);
    });
    on($('.zoom-control'), 'wheel', event => {
      event.preventDefault(); event.stopPropagation();
      const delta = event.deltaY || event.deltaX;
      if (!delta) return;
      if (event.shiftKey) setScale((Math.round(scale * 100) + (delta < 0 ? 1 : -1)) / 100);
      else zoom(delta < 0 ? 1 : -1);
    }, { passive: false });
    on($('.zoom-lock'), 'click', () => {
      settings.zoomLocked = !settings.zoomLocked;
      if (settings.zoomLocked) lockedScale = hold?.scale ?? scale;
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
      event.preventDefault(); event.stopPropagation();
      const delta = event.deltaY || event.deltaX;
      if (!delta) return;
      if (hold) return;
      // One ordinary wheel notch is one step; trackpad movement scales smoothly.
      const mode = lens.controls.wheelMode(event), now = performance.now();
      if (mode === 'navigate') {
        if (now - lastWheel < 160) return;
        lastWheel = now; show(index + (delta > 0 ? 1 : -1)); return;
      }
      if (mode === 'fine') {
        if (now - lastFineWheel < 70) return;
        lastFineWheel = now; setScale((Math.round(scale * 100) + (delta < 0 ? 1 : -1)) / 100, event.clientX, event.clientY); return;
      }
      const amount = event.deltaMode ? delta * (event.deltaMode === 1 ? 32 : stage.clientHeight) : delta;
      zoom(amount < 0 ? 1 : -1, event.clientX, event.clientY, Math.min(3, Math.abs(amount) / 100));
    }, { passive: false });
    on(stage, 'pointerdown', event => {
      if (event.button !== 0 || photo.hidden || !width || hold) return;
      const rect = stage.getBoundingClientRect();
      hold = { scale, panX, panY, pointerId: event.pointerId, mode: event.altKey ? 'drag' : 'zoom',
        clientX: event.clientX, clientY: event.clientY, anchorX: event.clientX - rect.left - rect.width / 2, anchorY: event.clientY - rect.top - rect.height / 2 };
      if (hold.mode === 'zoom') scale *= settings.holdZoom / 100;
      stage.setPointerCapture(event.pointerId); stage.classList.add(hold.mode === 'drag' ? 'dragging' : 'holding'); viewer.classList.add('moving');
      followHold(event); showStrip(false); event.preventDefault();
    });
    function followHold(event) {
      if (!hold || event.pointerId !== hold.pointerId) return;
      const dx = event.clientX - hold.clientX, dy = event.clientY - hold.clientY;
      if (hold.mode === 'drag') { panX = hold.panX + dx; panY = hold.panY + dy; }
      else {
        panX = lens.controls.holdPan(hold.panX, hold.anchorX, dx, scale / hold.scale);
        panY = lens.controls.holdPan(hold.panY, hold.anchorY, dy, scale / hold.scale);
      }
      transform();
    }
    function endHold() {
      if (!hold) return;
      const previous = hold; hold = null;
      if (previous.mode === 'zoom') { scale = previous.scale; panX = previous.panX; panY = previous.panY; }
      stage.classList.remove('holding', 'dragging'); viewer.classList.remove('moving');
      if (stage.hasPointerCapture(previous.pointerId)) stage.releasePointerCapture(previous.pointerId);
      transform();
    }
    on(stage, 'pointermove', followHold);
    on(stage, 'pointerup', endHold); on(stage, 'pointercancel', endHold); on(stage, 'lostpointercapture', endHold);
    on(window, 'blur', endHold);
    on(stage, 'dblclick', event => { if (settings.doubleClickExit && !event.altKey) { event.preventDefault(); close(); } });
    on(viewer, 'pointermove', event => {
      if (hold) return;
      const nearBottom = event.clientY >= viewer.getBoundingClientRect().bottom - 30;
      const overStrip = event.composedPath().includes(strip);
      if (nearBottom || overStrip) showStrip(true);
      else showStrip(false);
    });
    on(strip, 'pointerleave', () => showStrip(false));
    on(viewer, 'pointerleave', () => showStrip(false));
    on(dialog, 'cancel', event => { event.preventDefault(); close(); });
    on(window, 'keydown', event => {
      if (closed) return;
      const typing = event.composedPath().some(n => n instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(n.tagName));
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); return; }
      if (typing) return;
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        for (const selector of ['.prev', '.next']) $(selector).classList.remove('pointer-preview');
      }
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End', '0', '+', '=', '-', 'f', 'F'].includes(event.key)) { event.preventDefault(); event.stopImmediatePropagation(); }
      if (event.key === 'ArrowLeft') show(index - 1);
      if (event.key === 'ArrowRight') show(index + 1);
      if (event.key === 'Home') show(0); if (event.key === 'End') show(entries.length - 1);
      if (event.key === '0') fit(); if (event.key === '+' || event.key === '=') zoom(1); if (event.key === '-') zoom(-1);
      if (event.key.toLowerCase() === 'f') $('.fullscreen').click();
    }, { capture: true });
    on(window, 'resize', () => fit(false));
    on(document, 'fullscreenchange', () => {
      const full = shadow.fullscreenElement === viewer || document.fullscreenElement === host || document.fullscreenElement === viewer;
      if (!full && wasFullscreen && !returningToPage) { close(); return; }
      wasFullscreen = full; returningToPage = false;
      updateFullscreenLabel();
      fit(false);
    });
    on(window, 'pagehide', close);
    dialog.showModal(); viewer.focus();
    show(index);
  };
})();

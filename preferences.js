(() => {
  const lens = globalThis.ImageLens ||= {};
  const h = lens.i18n.html;
  const number = (key, label, min, max, unit = '') => `<label class="pref-row"><span>${label}</span><span class="pref-value"><input name="${key}" type="number" min="${min}" max="${max}" step="1" required aria-label="${label}">${unit ? `<span>${unit}</span>` : ''}</span></label>`;
  const toggle = (key, label) => `<label class="pref-row"><span>${label}</span><input class="pref-toggle" name="${key}" type="checkbox" role="switch" aria-label="${label}"></label>`;
  const html = `<div class="lens-prefs">
    <section><h3>${h('shortcuts')}</h3>${toggle('quickOpen', h('quickOpen'))}${toggle('doubleClickExit', h('doubleClickExit'))}</section>
    <section><h3>${h('zoom')}</h3>${number('zoomStep', h('zoomStep'), 1, 100, '%')}${number('holdZoom', h('holdZoom'), 100, 800, '%')}</section>
    <section><h3>${h('preload')}</h3><div class="pref-pair">${number('cacheBefore', h('cacheBefore'), 0, 12)}${number('cacheAfter', h('cacheAfter'), 0, 12)}</div></section>
    <section><h3>${h('previews')}</h3><div class="pref-pair">${number('previewBefore', h('previewBefore'), 0, 12)}${number('previewAfter', h('previewAfter'), 0, 12)}</div></section>
    <output class="pref-error" role="status" hidden></output>
  </div>`;
  const css = `
    .lens-prefs { font: 13px/1.5 system-ui, sans-serif; color: #dfe5f1; }
    .lens-prefs section { padding: 14px 0; border-top: 1px solid #ffffff10; }
    .lens-prefs section:first-child { border-top: 0; padding-top: 0; }
    .lens-prefs section:last-of-type { padding-bottom: 0; }
    .lens-prefs h3 { margin: 0 0 9px; font-size: 11px; font-weight: 550; color: #8493b1; letter-spacing: .12em; }
    .lens-prefs .pref-row { display: flex; min-height: 36px; gap: 12px; align-items: center; justify-content: space-between; margin: 3px 0; }
    .lens-prefs .pref-row > span:first-child { min-width: 0; overflow-wrap: anywhere; }
    .lens-prefs .pref-value { display: flex; gap: 6px; align-items: center; color: #8090ab; flex-shrink: 0; }
    .lens-prefs input[type=number] { width: 66px; height: 31px; margin: 0; border: 1px solid #ffffff16; border-radius: 8px; background: #11151e; color: #e5ecfc; font: inherit; padding: 4px 6px 4px 9px; }
    .lens-prefs input:focus-visible { outline: 2px solid #a9beef; outline-offset: 2px; }
    .lens-prefs .pref-toggle { appearance: none; width: 33px; height: 19px; flex: 0 0 33px; border: 1px solid #ffffff22; border-radius: 20px; background: #3b4353; margin: 0; padding: 2px; cursor: pointer; }
    .lens-prefs .pref-toggle::before { content: ''; display: block; width: 13px; height: 13px; border-radius: 50%; background: #b7c1d3; transition: transform .15s; }
    .lens-prefs .pref-toggle:checked { background: #a5bcef; }
    .lens-prefs .pref-toggle:checked::before { background: #18243e; transform: translateX(13px); }
    .lens-prefs .pref-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .lens-prefs .pref-pair .pref-row { flex-direction: column; align-items: flex-start; gap: 7px; }
    .lens-prefs .pref-pair .pref-value, .lens-prefs .pref-pair input { width: 100%; }
    .lens-prefs .pref-error { display: block; margin-top: 10px; font-size: 11px; color: #efb5b5; }
    .lens-prefs .pref-error[hidden] { display: none; }
  `;
  function fill(form, settings) {
    for (const control of form.querySelectorAll('input[name]')) {
      if (control.type === 'checkbox') control.checked = Boolean(settings[control.name]);
      else control.value = settings[control.name];
    }
  }
  function bind(form, getSettings, apply, signal) {
    const change = event => {
      const control = event.target;
      if (!control.matches('input[name]') || !control.validity.valid || control.value === '') return;
      const value = control.type === 'checkbox' ? control.checked : Number(control.value);
      apply(lens.settings.normalize({ ...getSettings(), [control.name]: value }));
    };
    form.addEventListener('input', change, { signal });
    form.addEventListener('submit', event => event.preventDefault(), { signal });
    fill(form, getSettings());
  }
  lens.preferences = { html, css, fill, bind };
})();

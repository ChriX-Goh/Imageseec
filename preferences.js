(() => {
  const lens = globalThis.ImageLens ||= {};
  const languages = [
    ['auto', 'languageAuto'], ['en', 'English'], ['zh_CN', '简体中文'], ['zh_TW', '繁體中文'],
    ['ja', '日本語'], ['ko', '한국어'], ['de', 'Deutsch'], ['fr', 'Français'],
    ['es', 'Español'], ['ru', 'Русский'], ['uk', 'Українська'], ['pl', 'Polski']
  ];
  const number = (key, label, min, max, unit = '') => `<label class="pref-row"><span>${label}</span><span class="pref-value"><input name="${key}" type="number" min="${min}" max="${max}" step="1" required aria-label="${label}">${unit ? `<span>${unit}</span>` : ''}</span></label>`;
  const toggle = (key, label) => `<label class="pref-row"><span>${label}</span><input class="pref-toggle" name="${key}" type="checkbox" role="switch" aria-label="${label}"></label>`;
  const overviewCacheRow = (side, label) => `<label class="pref-row"><span>${label}</span><span class="pref-value"><select name="overviewCache${side}Mode" aria-label="${label}"><option value="auto">${lens.i18n.html('overviewCacheAuto')}</option><option value="custom">${lens.i18n.html('overviewCacheCustom')}</option></select><input class="pref-cache-count" name="overviewCache${side}" type="number" min="0" step="1" required aria-label="${label} ${lens.i18n.html('overviewCacheCustom')}"></span></label>`;
  function render() {
    const h = lens.i18n.html;
    const languageOptions = languages.map(([code, label]) => `<option value="${code}">${label === 'languageAuto' ? h(label) : label}</option>`).join('');
    return `<div class="lens-prefs">
      <section class="pref-language"><label class="pref-row"><span>${h('language')}</span><select name="language" aria-label="${h('language')}">${languageOptions}</select></label></section>
      <section><h3>${h('shortcuts')}</h3>${toggle('quickOpen', h('quickOpen'))}${toggle('doubleClickExit', h('doubleClickExit'))}</section>
      <section><h3>${h('zoom')}</h3>${number('zoomStep', h('zoomStep'), 1, 100, '%')}${number('holdZoom', h('holdZoom'), 100, 800, '%')}</section>
      <section><h3>${h('preload')}</h3><div class="pref-pair">${number('cacheBefore', h('cacheBefore'), 0, 12)}${number('cacheAfter', h('cacheAfter'), 0, 12)}</div></section>
      <section><h3>${h('previews')}</h3><div class="pref-pair">${number('previewBefore', h('previewBefore'), 0, 12)}${number('previewAfter', h('previewAfter'), 0, 12)}</div></section>
      <section><h3>${h('compare')}</h3><label class="pref-row"><span>${h('compareStep')}</span><select name="compareStep" aria-label="${h('compareStep')}"><option value="1">${h('compareStepSingle')}</option><option value="2">${h('compareStepPair')}</option></select></label>${number('dividerMin', h('dividerMin'), 10, 33, '%')}</section>
      <section><h3>${h('overview')}</h3><label class="pref-row"><span>${h('overviewDirection')}</span><select name="overviewDirection" aria-label="${h('overviewDirection')}"><option value="vertical">${h('overviewVertical')}</option><option value="horizontal">${h('overviewHorizontal')}</option></select></label><label class="pref-row"><span>${h('overviewAlignment')}</span><select name="overviewAlignment" aria-label="${h('overviewAlignment')}"><option value="auto">${h('alignmentAuto')}</option><option value="vertical">${h('alignmentVertical')}</option><option value="horizontal">${h('alignmentHorizontal')}</option></select></label>${number('overviewGap', h('overviewGap'), 0, 48, 'px')}${toggle('overviewClean', h('overviewClean'))}<h3>${h('overviewCache')}</h3>${overviewCacheRow('Before', h('overviewCacheBefore'))}${overviewCacheRow('After', h('overviewCacheAfter'))}</section>
      <output class="pref-error" role="status" hidden></output>
    </div>`;
  }
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
    .lens-prefs select { max-width: 185px; height: 33px; border: 1px solid #ffffff16; border-radius: 8px; background: #11151e; color: #e5ecfc; font: inherit; padding: 4px 26px 4px 9px; }
    .lens-prefs input:focus-visible, .lens-prefs select:focus-visible { outline: 2px solid #a9beef; outline-offset: 2px; }
    .lens-prefs .pref-toggle { appearance: none; width: 33px; height: 19px; flex: 0 0 33px; border: 1px solid #ffffff22; border-radius: 20px; background: #3b4353; margin: 0; padding: 2px; cursor: pointer; }
    .lens-prefs .pref-toggle::before { content: ''; display: block; width: 13px; height: 13px; border-radius: 50%; background: #b7c1d3; transition: transform .15s; }
    .lens-prefs .pref-toggle:checked { background: #a5bcef; }
    .lens-prefs .pref-toggle:checked::before { background: #18243e; transform: translateX(13px); }
    .lens-prefs .pref-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .lens-prefs .pref-pair .pref-row { flex-direction: column; align-items: flex-start; gap: 7px; }
    .lens-prefs .pref-pair .pref-value, .lens-prefs .pref-pair input { width: 100%; }
    .lens-prefs .pref-cache-count { width: 66px; height: 31px; margin: 0; border: 1px solid #ffffff16; border-radius: 8px; background: #11151e; color: #e5ecfc; font: inherit; padding: 4px 6px 4px 9px; }
    .lens-prefs .pref-cache-count[hidden] { display: none; }
    .lens-prefs .pref-error { display: block; margin-top: 10px; font-size: 11px; color: #efb5b5; }
    .lens-prefs .pref-error[hidden] { display: none; }
  `;
  function fill(form, settings) {
    for (const control of form.querySelectorAll('input[name], select[name]')) {
      if (control.type === 'checkbox') control.checked = Boolean(settings[control.name]);
      else control.value = settings[control.name];
    }
    for (const side of ['Before', 'After']) {
      const mode = form.querySelector(`[name="overviewCache${side}Mode"]`), count = form.querySelector(`[name="overviewCache${side}"]`);
      count.hidden = count.disabled = mode.value !== 'custom';
    }
  }
  function bind(form, getSettings, apply, signal) {
    const change = event => {
      const control = event.target;
      if (!control.matches('input[name], select[name]') || (control.type === 'number' && (!control.validity.valid || control.value === ''))) return;
      const value = control.type === 'checkbox' ? control.checked : control.type === 'number' ? Number(control.value) : control.value;
      if (control.name === 'overviewCacheBeforeMode' || control.name === 'overviewCacheAfterMode') {
        const count = form.querySelector(`[name="${control.name.replace('Mode', '')}"]`);
        count.hidden = count.disabled = value !== 'custom';
      }
      apply(lens.settings.normalize({ ...getSettings(), [control.name]: value }));
    };
    form.addEventListener('input', change, { signal });
    form.addEventListener('submit', event => event.preventDefault(), { signal });
    fill(form, getSettings());
  }
  lens.preferences = { get html() { return render(); }, css, fill, bind };
})();

(() => {
  const lens = globalThis.ImageLens ||= {};
  const languages = [
    ['auto', 'languageAuto'], ['en', 'English'], ['zh_CN', '简体中文'], ['zh_TW', '繁體中文'],
    ['ja', '日本語'], ['ko', '한국어'], ['de', 'Deutsch'], ['fr', 'Français'],
    ['es', 'Español'], ['ru', 'Русский'], ['uk', 'Українська'], ['pl', 'Polski']
  ];
  const number = (key, label, min, max, unit = '') => `<label class="pref-row"><span>${label}</span><span class="pref-value"><input name="${key}" type="number" min="${min}" max="${max}" step="1" required aria-label="${label}">${unit ? `<span>${unit}</span>` : ''}</span></label>`;
  const toggle = (key, label) => `<label class="pref-row"><span>${label}</span><input class="pref-toggle" name="${key}" type="checkbox" role="switch" aria-label="${label}"></label>`;
  const overviewCacheRow = (side, label) => `<label class="pref-row pref-cache-row"><span>${label}</span><span class="pref-value"><select name="overviewCache${side}Mode" aria-label="${label}"><option value="auto">${lens.i18n.html('overviewCacheAuto')}</option><option value="custom">${lens.i18n.html('overviewCacheCustom')}</option></select><input class="pref-cache-count" name="overviewCache${side}" type="number" min="0" step="1" required aria-label="${label} ${lens.i18n.html('overviewCacheCustom')}"></span></label>`;
  function render() {
    const h = lens.i18n.html;
    const languageOptions = languages.map(([code, label]) => `<option value="${code}">${label === 'languageAuto' ? h(label) : label}</option>`).join('');
    return `<div class="lens-prefs"><div class="pref-tabs" role="tablist" aria-label="${h('settingsTitle')}">${[['general','prefGeneral'],['image','prefImage'],['compare','prefCompare'],['overview','prefOverview']].map(([id, label], i) => `<button type="button" role="tab" data-pref-tab="${id}" aria-selected="${i === 0}" tabindex="${i === 0 ? '0' : '-1'}">${h(label)}</button>`).join('')}</div>
      <div class="pref-panel" data-pref-panel="general" role="tabpanel" aria-label="${h('prefGeneral')}">
      <section class="pref-language"><label class="pref-row pref-language-row"><span>${h('language')}</span><select name="language" aria-label="${h('language')}">${languageOptions}</select></label>${toggle('toolbarAutoHide', h('toolbarAutoHide'))}</section>
      <section><h3>${h('shortcuts')}</h3>${toggle('quickOpen', h('quickOpen'))}${toggle('doubleClickExit', h('doubleClickExit'))}</section>
      </div><div class="pref-panel" data-pref-panel="image" role="tabpanel" aria-label="${h('prefImage')}" hidden>
      <section><h3>${h('zoom')}</h3>${number('zoomStep', h('zoomStep'), 1, 100, '%')}${number('holdZoom', h('holdZoom'), 100, 800, '%')}</section>
      <section><h3>${h('preload')}</h3><div class="pref-pair">${number('cacheBefore', h('cacheBefore'), 0, 12)}${number('cacheAfter', h('cacheAfter'), 0, 12)}</div></section>
      <section><h3>${h('previews')}</h3><div class="pref-pair">${number('previewBefore', h('previewBefore'), 0, 12)}${number('previewAfter', h('previewAfter'), 0, 12)}</div></section>
      </div><div class="pref-panel" data-pref-panel="compare" role="tabpanel" aria-label="${h('prefCompare')}" hidden>
      <section><h3>${h('splitView')}</h3><label class="pref-row"><span>${h('compareStep')}</span><select name="compareStep" aria-label="${h('compareStep')}"><option value="1">${h('compareStepSingle')}</option><option value="2">${h('compareStepPair')}</option></select></label>${number('dividerMin', h('dividerMin'), 10, 33, '%')}</section>
      </div><div class="pref-panel" data-pref-panel="overview" role="tabpanel" aria-label="${h('prefOverview')}" hidden>
      <section><h3>${h('overviewTitle')}</h3><label class="pref-row"><span>${h('overviewDirection')}</span><select name="overviewDirection" aria-label="${h('overviewDirection')}"><option value="vertical">${h('overviewVertical')}</option><option value="horizontal">${h('overviewHorizontal')}</option></select></label><label class="pref-row"><span>${h('overviewAlignment')}</span><select name="overviewAlignment" aria-label="${h('overviewAlignment')}"><option value="auto">${h('alignmentAuto')}</option><option value="vertical">${h('alignmentVertical')}</option><option value="horizontal">${h('alignmentHorizontal')}</option></select></label>${number('overviewGap', h('overviewGap'), 0, 48, 'px')}${toggle('overviewClean', h('overviewClean'))}${number('overviewScale', h('overviewSize'), 25, 300, '%')}<h3>${h('overviewCache')}</h3>${overviewCacheRow('Before', h('overviewCacheBefore'))}${overviewCacheRow('After', h('overviewCacheAfter'))}</section>
      </div><output class="pref-error" role="status" hidden></output>
    </div>`;
  }
  const css = `
    .lens-prefs { display: grid; gap: 10px; min-width: 0; container-type: inline-size; font: 13px/1.45 system-ui, sans-serif; color: #dfe5f1; }
    .lens-prefs .pref-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 3px; padding: 3px; border-radius: 10px; background: #11151e; }
    .lens-prefs .pref-tabs button { min-width: 0; min-height: 36px; padding: 5px 2px; border: 0; border-radius: 7px; background: transparent; color: #b8c4d9; font: inherit; font-size: 11px; overflow-wrap: anywhere; cursor: pointer; }
    .lens-prefs .pref-tabs button[aria-selected="true"] { background: #3a4864; color: white; }
    .lens-prefs .pref-tabs button:focus-visible { outline: 2px solid #a9beef; outline-offset: -2px; }
    .lens-prefs .pref-panel { display: grid; gap: 8px; min-width: 0; }
    .lens-prefs .pref-panel[hidden] { display: none; }
    .lens-prefs section { min-width: 0; padding: 11px 13px; border: 1px solid #ffffff10; border-radius: 12px; background: #ffffff06; }
    .lens-prefs h3 { margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #a4b5d5; letter-spacing: .025em; }
    .lens-prefs h3:not(:first-child) { margin-top: 12px; padding-top: 12px; border-top: 1px solid #ffffff12; }
    .lens-prefs .pref-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; min-height: 38px; gap: 10px; align-items: center; margin: 2px 0; cursor: pointer; }
    .lens-prefs .pref-row > span:first-child { min-width: 0; overflow-wrap: anywhere; }
    .lens-prefs .pref-row:has(> select) { grid-template-columns: minmax(0, 1fr); gap: 5px; padding: 5px 0; }
    .lens-prefs .pref-row > select { width: 100%; }
    .lens-prefs .pref-value { display: flex; gap: 6px; align-items: center; min-width: 0; color: #a4b1c8; }
    .lens-prefs input[type=number] { width: 66px; height: 31px; margin: 0; border: 1px solid #ffffff16; border-radius: 8px; background: #11151e; color: #e5ecfc; font: inherit; padding: 4px 6px 4px 9px; }
    .lens-prefs select { width: 145px; max-width: 100%; min-width: 0; height: 34px; border: 1px solid #ffffff20; border-radius: 8px; background: #11151e; color: #e5ecfc; font: inherit; padding: 4px 24px 4px 9px; }
    .lens-prefs input:focus-visible, .lens-prefs select:focus-visible { outline: 2px solid #a9beef; outline-offset: 2px; }
    .lens-prefs .pref-toggle { appearance: none; width: 33px; height: 19px; flex: 0 0 33px; border: 1px solid #ffffff22; border-radius: 20px; background: #3b4353; margin: 0; padding: 2px; cursor: pointer; }
    .lens-prefs .pref-toggle::before { content: ''; display: block; width: 13px; height: 13px; border-radius: 50%; background: #b7c1d3; transition: transform .15s; }
    .lens-prefs .pref-toggle:checked { background: #a5bcef; }
    .lens-prefs .pref-toggle:checked::before { background: #18243e; transform: translateX(13px); }
    .lens-prefs .pref-pair { display: grid; gap: 0; }
    .lens-prefs .pref-cache-row { grid-template-columns: minmax(0, 1fr); gap: 5px; padding: 5px 0; }
    .lens-prefs .pref-language-row { grid-template-columns: minmax(0, 1fr); gap: 5px; padding: 5px 0; }
    .lens-prefs .pref-language-row > select { width: 100%; }
    .lens-prefs .pref-cache-row .pref-value { display: grid; grid-template-columns: minmax(0, 1fr) auto; width: 100%; }
    .lens-prefs .pref-cache-row select { width: 100%; }
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
    const tabs = [...form.querySelectorAll('[data-pref-tab]')];
    const selectTab = (tab, focus = false) => {
      for (const button of tabs) { const selected = button === tab; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; }
      for (const panel of form.querySelectorAll('[data-pref-panel]')) panel.hidden = panel.dataset.prefPanel !== tab.dataset.prefTab;
      if (focus) tab.focus();
    };
    form.addEventListener('click', event => { const tab = event.target.closest('[data-pref-tab]'); if (tab) selectTab(tab); }, { signal });
    form.addEventListener('keydown', event => {
      const tab = event.target.closest('[data-pref-tab]'); if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); const index = tabs.indexOf(tab);
      selectTab(tabs[event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length], true);
    }, { signal });
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

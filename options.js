(() => {
  const { text: t, locale } = ImageLens.i18n;
  document.documentElement.lang = locale.replace('_', '-');
  document.title = t('settingsTitle');
  document.querySelector('#reset').textContent = t('reset');
  document.querySelector('#reload').textContent = t('reload');
  const form = document.querySelector('#settings');
  const { defaults, normalize } = ImageLens.settings;
  const prefs = ImageLens.preferences;
  const style = document.createElement('style'); style.textContent = prefs.css; document.head.append(style);
  form.innerHTML = prefs.html;
  let settings = { ...defaults };
  const version = globalThis.chrome?.runtime?.getManifest?.().version;
  if (version) document.querySelector('.version').textContent = version;
  const error = form.querySelector('.pref-error');
  async function save(next) {
    settings = next;
    try { await chrome.storage.local.set({ settings }); error.hidden = true; }
    catch { error.textContent = t('saveFailed'); error.hidden = false; }
  }
  prefs.bind(form, () => settings, save);
  chrome.storage.local.get('settings').then(data => { settings = normalize(data.settings); prefs.fill(form, settings); });
  document.querySelector('#reset').addEventListener('click', () => { prefs.fill(form, defaults); save({ ...defaults }); });
  document.querySelector('#reload').addEventListener('click', () => { globalThis.chrome?.runtime?.reload?.(); });
  const popup = globalThis.chrome?.extension?.getViews?.({ type: 'popup' })?.includes(window);
  if (popup) document.documentElement.addEventListener('pointerleave', () => window.close());
})();

(() => {
  const { text: t } = ImageLens.i18n;
  const form = document.querySelector('#settings');
  const { defaults, normalize } = ImageLens.settings;
  const prefs = ImageLens.preferences;
  const style = document.createElement('style'); style.textContent = prefs.css; document.head.append(style);
  let settings = { ...defaults };
  let error;
  let binding;
  const version = globalThis.chrome?.runtime?.getManifest?.().version;
  if (version) document.querySelector('.version').textContent = version;

  function render() {
    document.documentElement.lang = ImageLens.i18n.locale.replace('_', '-');
    document.title = t('settingsTitle');
    document.querySelector('#reset').textContent = t('reset');
    document.querySelector('#reload').textContent = t('reload');
    form.innerHTML = prefs.html;
    error = form.querySelector('.pref-error');
    binding?.abort();
    binding = new AbortController();
    prefs.bind(form, () => settings, save, binding.signal);
  }

  async function save(next) {
    const languageChanged = settings.language !== next.language;
    settings = next;
    try {
      await chrome.storage.local.set({ settings });
      error.hidden = true;
      if (languageChanged) {
        await ImageLens.i18n.setLanguage(settings.language);
        render();
      }
    } catch {
      error.textContent = t('saveFailed'); error.hidden = false;
    }
  }

  async function init() {
    const data = await chrome.storage.local.get('settings');
    settings = normalize(data.settings);
    await ImageLens.i18n.setLanguage(settings.language);
    render();
    document.querySelector('#reset').addEventListener('click', () => save({ ...defaults }));
    document.querySelector('#reload').addEventListener('click', () => globalThis.chrome?.runtime?.reload?.());
    const popup = globalThis.chrome?.extension?.getViews?.({ type: 'popup' })?.includes(window);
    if (popup) document.documentElement.addEventListener('pointerleave', () => window.close());
  }
  init();
})();

(async () => {
  const { text: t, locale } = ImageLens.i18n;
  document.documentElement.lang = locale.replace('_', '-');
  document.title = t('viewerTitle');
  document.querySelector('#state').textContent = t('loading');
  const token = location.hash.slice(1);
  const data = await chrome.storage.session.get(token);
  const { settings } = await chrome.storage.local.get('settings');
  await chrome.storage.session.remove(token);
  if (!data[token]) { document.querySelector('#state').textContent = t('sessionExpired'); return; }
  document.querySelector('#state').remove();
  ImageLens.open(data[token].source, settings, true, data[token].error);
})();

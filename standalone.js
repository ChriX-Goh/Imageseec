(async () => {
  const { text: t } = ImageLens.i18n;
  const token = location.hash.slice(1);
  const data = await chrome.storage.session.get(token);
  const { settings } = await chrome.storage.local.get('settings');
  await ImageLens.i18n.setLanguage(settings?.language);
  document.documentElement.lang = ImageLens.i18n.locale.replace('_', '-');
  document.title = t('viewerTitle');
  document.querySelector('#state').textContent = t('loading');
  await chrome.storage.session.remove(token);
  if (!data[token]) { document.querySelector('#state').textContent = t('sessionExpired'); return; }
  document.querySelector('#state').remove();
  ImageLens.open(data[token].source, settings, true, data[token].error);
})();

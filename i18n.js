(() => {
  const lens = globalThis.ImageLens ||= {};
  const locales = ['en', 'zh_CN', 'zh_TW', 'ja', 'ko', 'de', 'fr', 'es', 'ru', 'uk', 'pl'];
  function resolveLocale(language = '') {
    const parts = String(language).replaceAll('-', '_').split('_');
    const code = parts[0].toLowerCase() + (parts[1] ? `_${parts[1].toUpperCase()}` : '');
    return locales.includes(code) ? code : locales.includes(parts[0].toLowerCase()) ? parts[0].toLowerCase() : 'en';
  }
  function text(key, ...values) { return chrome.i18n.getMessage(key, values.map(String)) || key; }
  function html(key, ...values) {
    return text(key, ...values).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
  lens.i18n = { text, html, resolveLocale, locales, locale: resolveLocale(chrome.i18n.getUILanguage()) };
})();

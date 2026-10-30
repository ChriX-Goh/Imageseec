(() => {
  const lens = globalThis.ImageLens ||= {};
  const locales = ['en', 'zh_CN', 'zh_TW', 'ja', 'ko', 'de', 'fr', 'es', 'ru', 'uk', 'pl'];
  function resolveLocale(language = '') {
    const parts = String(language).replaceAll('-', '_').split('_');
    const code = parts[0].toLowerCase() + (parts[1] ? `_${parts[1].toUpperCase()}` : '');
    return locales.includes(code) ? code : locales.includes(parts[0].toLowerCase()) ? parts[0].toLowerCase() : 'en';
  }
  let locale = resolveLocale(chrome.i18n.getUILanguage());
  let language = 'auto';
  let catalog = null;

  async function loadCatalog(code) {
    try {
      const result = await chrome.runtime.sendMessage({ type: 'lens-get-messages', locale: code });
      if (result?.locale === code && result.messages) return result.messages;
    } catch { /* Fall back to the browser's built-in locale API. */ }
    try {
      const response = await fetch(chrome.runtime.getURL(`_locales/${code}/messages.json`));
      if (response.ok) return await response.json();
    } catch { /* Content-script contexts may not read extension resources directly. */ }
    return null;
  }

  async function setLanguage(preference = 'auto') {
    language = locales.includes(preference) ? preference : 'auto';
    const selected = language === 'auto' ? resolveLocale(chrome.i18n.getUILanguage()) : language;
    if (selected !== locale || !catalog) {
      locale = selected;
      catalog = lens.catalogs?.[locale] || await loadCatalog(locale);
    }
    return locale;
  }

  function text(key, ...values) {
    const item = catalog?.[key];
    if (!item) return chrome.i18n.getMessage(key, values.map(String)) || key;
    return item.message.replace(/\$([a-z][a-z0-9_]*)\$/gi, (placeholder, name) => {
      const content = item.placeholders?.[name.toLowerCase()]?.content;
      return content ? content.replace(/\$(\d+)/g, (_, index) => values[Number(index) - 1] ?? '') : placeholder;
    }).replace(/\$\$/g, '$');
  }
  function html(key, ...values) {
    return text(key, ...values).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
  lens.i18n = {
    text, html, resolveLocale, locales, setLanguage,
    get locale() { return locale; },
    get language() { return language; }
  };
})();

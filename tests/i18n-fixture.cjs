// Test-only model of Chrome's catalog lookup and positional substitutions.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', '_locales');
const read = code => JSON.parse(fs.readFileSync(path.join(root, code, 'messages.json'), 'utf8'));
function api(language, catalog, english) {
  return {
    getUILanguage: () => language,
    getMessage(key, values = []) {
      const item = catalog[key] || english[key];
      if (!item) return '';
      const substitutions = Array.isArray(values) ? values : [values];
      return item.message.replace(/\$(\w+)\$/g, (_, name) => {
        const content = item.placeholders?.[name.toLowerCase()]?.content || '';
        return content.replace(/\$(\d)/g, (_, index) => substitutions[Number(index) - 1] ?? '');
      }).replace(/\$\$/g, '$');
    }
  };
}
function catalogs(language) {
  const parts = String(language).replaceAll('-', '_').split('_');
  const code = parts[0].toLowerCase() + (parts[1] ? `_${parts[1].toUpperCase()}` : '');
  const available = fs.readdirSync(root);
  const selected = available.includes(code) ? code : available.includes(parts[0].toLowerCase()) ? parts[0].toLowerCase() : 'en';
  return [language, read(selected), read('en')];
}
exports.forLocale = (language = 'en') => api(...catalogs(language));
exports.script = (language = 'en') => `chrome.i18n = (${api.toString()})(...${JSON.stringify(catalogs(language))});`;

// Bundle the Chrome locale catalogs for the injected viewer and settings page.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const localeRoot = path.join(root, '_locales');
const catalogs = Object.fromEntries(fs.readdirSync(localeRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => [entry.name, JSON.parse(fs.readFileSync(path.join(localeRoot, entry.name, 'messages.json'), 'utf8'))]));
const output = `(() => { const lens = globalThis.ImageLens ||= {}; lens.catalogs = ${JSON.stringify(catalogs)}; })();\n`;
fs.writeFileSync(path.join(root, 'locale-catalogs.js'), output, 'utf8');

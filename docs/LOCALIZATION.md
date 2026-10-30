# Localization

Imageseec ships 45 UI messages in each of 11 Chrome locale catalogs. The default language setting follows Chrome's UI language; users can also select any supported language manually. Unsupported browser UI languages use English. Language selection does not inspect the website language or infer the user's country.

## Supported locales

| Language | Chrome locale |
| --- | --- |
| English (default) | en |
| Chinese, Simplified (China) | zh_CN |
| Chinese, Traditional (Taiwan) | zh_TW |
| Japanese | ja |
| Korean | ko |
| German | de |
| French | fr |
| Spanish | es |
| Russian | ru |
| Ukrainian | uk |
| Polish | pl |

Regional variants of a supported base language use that language (for example `ru-RU` uses `ru`). The two Chinese catalogs are `zh_CN` and `zh_TW`. Other unsupported locale families use English. Users can override automatic selection in the settings; the extension never chooses a language based on a webpage's `lang` attribute.

## Maintenance

- Keep Chrome's `_locales/<locale>/messages.json` catalogs complete, including the language selector labels, with `default_locale` set to `en`.
- After editing a catalog, run `node scripts/build-locales.cjs` to refresh the packaged catalog bundle used by the viewer, options page and fallback tab.
- Keep named placeholders consistent across catalogs. Dynamic page captions remain as supplied by the website; template-inserted translations are escaped.
- Cover manifest metadata, context menus, settings, viewer controls, accessibility names, statuses and errors. The Imageseec brand remains unchanged.
- Run catalog and escaping tests, regional/fallback checks and browser layout checks before releasing a changed translation. Longer settings labels and footer actions wrap instead of clipping.
- The fixture models Chrome catalog APIs; it does not change the user's actual Chrome language. Verify both automatic and manually selected languages in the installed extension.
- Store listing translations are separate from extension UI catalogs. Only English and Simplified Chinese listing copy is currently drafted; do not claim localized store listings already exist for all 11 languages.

[Chrome internationalization documentation](https://developer.chrome.com/docs/extensions/reference/api/i18n)

# Localization

Version 1.4.0 ships 43 UI messages in each of 11 Chrome locale catalogs. English is the default and the fallback for unsupported browser UI languages. Language selection uses Chrome's internationalization API; it does not inspect the website language or infer the user's country.

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

Regional variants of a supported base language use that language, following Chrome's catalog lookup (for example `ru-RU` uses `ru`). The two Chinese catalogs are `zh_CN` and `zh_TW`. Other unsupported locale families use English. There is no language selection based on a webpage's `lang` attribute.

## Maintenance

- Keep Chrome's `_locales/<locale>/messages.json` catalogs complete, with `default_locale` set to `en`.
- Keep named placeholders consistent across catalogs. Dynamic page captions remain as supplied by the website; template-inserted translations are escaped.
- Cover manifest metadata, context menus, settings, viewer controls, accessibility names, statuses and errors. The Imageseec brand remains unchanged.
- Run catalog and escaping tests, regional/fallback checks and browser layout checks before releasing a changed translation. Longer settings labels and footer actions wrap instead of clipping.
- The fixture models Chrome catalog APIs; it does not change the user's actual Chrome language. Installed-browser locale checks remain part of release QA.
- Store listing translations are separate from extension UI catalogs. Only English and Simplified Chinese listing copy is currently drafted; do not claim localized store listings already exist for all 11 languages.

[Chrome internationalization documentation](https://developer.chrome.com/docs/extensions/reference/api/i18n)

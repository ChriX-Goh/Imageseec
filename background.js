const MENU_ID = 'image-lens-open';
const LOCALES = ['en', 'zh_CN', 'zh_TW', 'ja', 'ko', 'de', 'fr', 'es', 'ru', 'uk', 'pl'];

function localeFor(language = 'auto') {
  if (LOCALES.includes(language)) return language;
  const parts = String(chrome.i18n.getUILanguage()).replaceAll('-', '_').split('_');
  const code = parts[0].toLowerCase() + (parts[1] ? `_${parts[1].toUpperCase()}` : '');
  return LOCALES.includes(code) ? code : LOCALES.includes(parts[0].toLowerCase()) ? parts[0].toLowerCase() : 'en';
}

async function readMessages(locale) {
  if (!LOCALES.includes(locale)) return null;
  const response = await fetch(chrome.runtime.getURL(`_locales/${locale}/messages.json`));
  return response.ok ? response.json() : null;
}

async function contextTitle(language) {
  try {
    const messages = await readMessages(localeFor(language));
    return messages?.contextOpen?.message || chrome.i18n.getMessage('contextOpen');
  } catch { return chrome.i18n.getMessage('contextOpen'); }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: chrome.i18n.getMessage('contextOpen'),
      contexts: ['image'],
      documentUrlPatterns: ['http://*/*', 'https://*/*', 'file:///*']
    });
    chrome.storage.local.get('settings').then(({ settings }) => contextTitle(settings?.language))
      .then(title => chrome.contextMenus.update(MENU_ID, { title })).catch(() => {});
  });
});

chrome.storage.onChanged?.addListener((changes, area) => {
  if (area === 'local' && changes.settings && changes.settings.oldValue?.language !== changes.settings.newValue?.language) {
    contextTitle(changes.settings.newValue?.language).then(title => chrome.contextMenus.update(MENU_ID, { title })).catch(() => {});
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id || !info.srcUrl) return;
  openImage(info, tab).catch(() => console.warn('Imageseec: unable to open image'));
});

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type === 'lens-get-messages') {
    const locale = LOCALES.includes(message.locale) ? message.locale : 'en';
    readMessages(locale).then(messages => respond({ locale, messages }), () => respond({ locale, messages: null }));
    return true;
  }
  if (message?.type !== 'lens-quick-open' || !Number.isInteger(sender.tab?.id) || !imageSource(message.source)) return false;
  (async () => {
    const { settings = {} } = await chrome.storage.local.get('settings');
    if (settings.quickOpen === false) return { ok: false };
    await openImage({ srcUrl: message.source, frameId: sender.frameId ?? 0 }, sender.tab);
    return { ok: true };
  })().then(respond, error => respond({ ok: false, error: error.message }));
  return true;
});

function imageSource(source) {
  if (typeof source !== 'string') return false;
  try {
    const url = new URL(source);
    return ['http:', 'https:', 'file:', 'blob:'].includes(url.protocol) || /^data:image\//i.test(source);
  } catch { return false; }
}

async function openImage(info, tab) {
  const { settings = {} } = await chrome.storage.local.get('settings');
  const target = { tabId: tab.id, frameIds: [info.frameId || 0] };
  try {
    await chrome.scripting.executeScript({ target, files: ['locale-catalogs.js', 'i18n.js', 'settings.js', 'controls.js', 'preferences.js', 'gallery.js', 'viewer.js', 'quick-open.js'] });
    await chrome.scripting.executeScript({
      target,
      func: async (source, options) => {
        await globalThis.ImageLens.i18n.setLanguage(options.language);
        globalThis.ImageLens.open(source, options);
      },
      args: [info.srcUrl, settings]
    });
  } catch (error) {
    // Some browser-restricted documents still reject injection. Keep a fallback
    // for the selected HTTP image when its page cannot host the viewer.
    if (!/^https?:/i.test(info.srcUrl)) throw error;
    const token = crypto.randomUUID();
    await chrome.storage.session.set({ [token]: { source: info.srcUrl, error: chrome.i18n.getMessage('fallbackNotice') } });
    await chrome.tabs.create({ url: chrome.runtime.getURL(`standalone.html#${token}`) });
  }
}

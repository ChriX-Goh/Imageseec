const MENU_ID = 'image-lens-open';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => chrome.contextMenus.create({
    id: MENU_ID,
    title: chrome.i18n.getMessage('contextOpen'),
    contexts: ['image'],
    documentUrlPatterns: ['http://*/*', 'https://*/*', 'file:///*']
  }));
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id || !info.srcUrl) return;
  openImage(info, tab).catch(() => console.warn('Imageseec: unable to open image'));
});

chrome.runtime.onMessage.addListener((message, sender, respond) => {
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
    await chrome.scripting.executeScript({ target, files: ['i18n.js', 'settings.js', 'controls.js', 'preferences.js', 'gallery.js', 'viewer.js', 'quick-open.js'] });
    await chrome.scripting.executeScript({
      target,
      func: (source, options) => globalThis.ImageLens.open(source, options),
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

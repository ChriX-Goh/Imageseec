// Test-only Chrome API shim; never included in the extension manifest.
(() => {
  // An interactive fixture must never fullscreen its browser host window.
  document.documentElement.dataset.fullscreenRequests = '0';
  const simulateFullscreen = new URLSearchParams(location.search).has('simulateFullscreen');
  let simulatedElement = null;
  if (simulateFullscreen) {
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => simulatedElement });
    document.exitFullscreen = async () => { simulatedElement = null; document.dispatchEvent(new Event('fullscreenchange')); };
  }
  Element.prototype.requestFullscreen = function() {
    document.documentElement.dataset.fullscreenRequests = String(Number(document.documentElement.dataset.fullscreenRequests) + 1);
    if (simulateFullscreen) {
      simulatedElement = this.getRootNode().host || this;
      document.dispatchEvent(new Event('fullscreenchange')); return Promise.resolve();
    }
    return Promise.reject(new DOMException('Fullscreen disabled in test fixture', 'NotAllowedError'));
  };
  const listeners = new Set();
  let modules;
  globalThis.chrome = {
    i18n: {
      getUILanguage() { return document.documentElement.lang || 'en'; },
      getMessage(key, substitutions = []) {
        const catalogs = globalThis.ImageLens?.catalogs;
        const locale = (document.documentElement.lang || 'en').replace('-', '_');
        const message = catalogs?.[locale]?.[key]?.message || catalogs?.en?.[key]?.message || '';
        return message.replace(/\$(\d+)\$/g, (_, index) => substitutions[Number(index) - 1] ?? '');
      }
    },
    runtime: {
      getURL(path) { return new URL(path, `${location.origin}/`).href; },
      async sendMessage(message) {
        if (message.type === 'lens-get-messages') {
          const messages = globalThis.ImageLens?.catalogs?.[message.locale];
          return messages ? { locale: message.locale, messages } : { ok: false };
        }
        if (message.type !== 'lens-quick-open') return { ok: false };
        const { settings } = await chrome.storage.local.get('settings');
        if (settings?.quickOpen === false) return { ok: false };
        if (!globalThis.ImageLens?.open) {
          modules ||= (async () => {
            for (const file of ['locale-catalogs.js', 'i18n.js', 'settings.js', 'controls.js', 'preferences.js', 'gallery.js', 'viewer.js']) {
              await new Promise((resolve, reject) => {
                const script = document.createElement('script'); script.src = `/${file}`;
                script.onload = resolve; script.onerror = reject; document.head.append(script);
              });
            }
          })();
          await modules;
        }
        document.documentElement.dataset.quickOpens = String(Number(document.documentElement.dataset.quickOpens || 0) + 1);
        await ImageLens.i18n.setLanguage(settings?.language || 'auto');
        ImageLens.open(message.source, settings);
        return { ok: true };
      }
    },
    storage: {
      local: {
        async get(key) { return { [key]: JSON.parse(localStorage.getItem(`lens-${key}`) || 'null') }; },
        async set(data) {
          const changes = {};
          for (const [key, value] of Object.entries(data)) { const oldValue = JSON.parse(localStorage.getItem(`lens-${key}`) || 'null'); localStorage.setItem(`lens-${key}`, JSON.stringify(value)); changes[key] = { oldValue, newValue: value }; }
          for (const listener of listeners) listener(changes, 'local');
        }
      },
      onChanged: { addListener: fn => listeners.add(fn), removeListener: fn => listeners.delete(fn) }
    }
  };
})();

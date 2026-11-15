const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'quick-open.js'), 'utf8');

async function setup(sendMessage) {
  const handlers = new Map();
  const listeners = new Set();
  const c = vm.createContext({
    AbortController,
    URL,
    Date,
    Number,
    Set,
    getComputedStyle: () => ({ backgroundImage: 'none' }),
    document: { baseURI: 'https://example.test/gallery/' },
    location: { href: 'https://example.test/gallery/' },
    window: {
      addEventListener(type, callback, options = {}) {
        if (!handlers.has(type)) handlers.set(type, new Set());
        handlers.get(type).add(callback);
        options.signal?.addEventListener('abort', () => handlers.get(type).delete(callback));
      }
    },
    chrome: {
      runtime: {
        sendMessage,
        onMessage: { addListener() {}, removeListener() {} }
      },
      storage: {
        local: { async get() { return { settings: { quickOpen: true } }; } },
        onChanged: { addListener: listener => listeners.add(listener), removeListener: listener => listeners.delete(listener) }
      }
    }
  });
  vm.runInContext(source, c, { filename: 'quick-open.js' });
  const image = {
    tagName: 'IMG',
    src: 'https://cdn.example.test/photo.jpg',
    currentSrc: 'https://cdn.example.test/photo.jpg',
    getAttribute() { return null; },
    closest() { return null; }
  };
  const event = {
    button: 0,
    ctrlKey: true,
    altKey: false,
    metaKey: false,
    composedPath: () => [image],
    preventDefault() {},
    stopImmediatePropagation() {}
  };
  const dispatch = type => {
    for (const handler of handlers.get(type) || []) handler(event);
  };
  await Promise.resolve();
  return { dispatch };
}

test('quick-open message sender contains synchronous extension-context errors', async () => {
  const { dispatch } = await setup(() => { throw new Error('Extension context invalidated'); });
  assert.doesNotThrow(() => dispatch('click'));
  assert.doesNotThrow(() => dispatch('pointerover'));
});

test('quick-open message sender absorbs asynchronous message rejection', async () => {
  const { dispatch } = await setup(() => Promise.reject(new Error('No receiving end')));
  assert.doesNotThrow(() => dispatch('click'));
  assert.doesNotThrow(() => dispatch('pointerover'));
  await new Promise(resolve => setImmediate(resolve));
});

test('quick-open message sender still forwards messages when runtime is available', async () => {
  const messages = [];
  const { dispatch } = await setup(message => { messages.push(message); return Promise.resolve({ ok: true }); });
  dispatch('pointerover');
  dispatch('click');
  assert.equal(JSON.stringify(messages), JSON.stringify([
    { type: 'lens-context-target', detected: true },
    { type: 'lens-quick-open', source: 'https://cdn.example.test/photo.jpg' }
  ]));
});

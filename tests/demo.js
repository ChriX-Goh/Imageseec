(() => {
  let count = 9;
  const run = crypto.randomUUID();
  const gallery = document.querySelector('.gallery');
  function add(n) {
    const figure = document.createElement('figure');
    const image = new Image(); image.src = `/image/${n}?run=${run}`; image.alt = n === 2 ? '微光 · 320 × 200 小图' : n === 3 ? '山谷 · 900 × 1600 竖图' : `暮山与湖 · ${String(n).padStart(2, '0')}`;
    image.setAttribute('data-full', `/full/${n}?run=${run}`);
    const label = document.createElement('figcaption'); label.textContent = image.alt;
    figure.append(image, label); gallery.append(figure);
    figure.onclick = event => { if (!event.ctrlKey) open(image.src); }; return image;
  }
  async function open(src) { const { settings } = await chrome.storage.local.get('settings'); ImageLens.open(src, settings); }
  for (let n = 1; n <= count; n++) add(n);
  document.querySelector('#open').onclick = () => open(gallery.querySelectorAll('img')[4].src);
  document.querySelector('#small').onclick = () => open(gallery.querySelectorAll('img')[1].src);
  document.querySelector('#add').onclick = () => add(++count);
  document.querySelector('#broken').onclick = () => open(`${location.origin}/image/98`);
  document.querySelector('#rapid').onclick = () => { const slow = add(97); open(slow.src); };
  document.querySelector('#defaults').onclick = async () => { await chrome.storage.local.set({ settings: ImageLens.settings.defaults }); document.querySelector('#log').textContent = '已恢复默认测试设置'; };
  // Add after a delay without needing to dismiss the viewer, for observer coverage.
  document.querySelector('#add').addEventListener('click', () => { setTimeout(() => add(++count), 2000); });
  const receipt = {};
  // The browser bridge exposes drag but no held modifier. Arm one real drag
  // with a test-only Alt flag; production pointer handling remains unchanged.
  let altDrag = false;
  document.querySelector('#arm-alt').onclick = () => { altDrag = true; document.querySelector('#log').textContent = '下次拖拽使用 Alt 修饰键'; };
  document.addEventListener('pointerdown', event => {
    if (altDrag && event.composedPath().some(n => n.classList?.contains('stage'))) {
      Object.defineProperty(event, 'altKey', { value: true }); altDrag = false;
    }
  }, true);
  document.addEventListener('keydown', event => {
    if (event.composedPath().some(n => n.tagName === 'INPUT')) return;
    const root = document.querySelector('#image-lens-viewer')?.shadowRoot;
    const cases = { a: { altKey: true }, s: { shiftKey: true } };
    if (!root || !cases[event.key]) return;
    root.querySelector('.stage').dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true, composed: true, clientX: 640, clientY: 350, ...cases[event.key] }));
  });
  const view = () => {
    const root = document.querySelector('#image-lens-viewer')?.shadowRoot;
    if (!root) return null;
    return { scale: root.querySelector('.fit').textContent, transform: root.querySelector('.photo').style.transform, holding: root.querySelector('.stage').classList.contains('holding'), dragging: root.querySelector('.stage').classList.contains('dragging') };
  };
  function print() { document.querySelector('#log').textContent = JSON.stringify(receipt, null, 2); }
  document.addEventListener('pointerdown', event => {
    if (!event.composedPath().some(n => n.classList?.contains('stage'))) return;
    receipt.beforeHold = view();
  }, true);
  document.addEventListener('pointerdown', event => {
    if (event.composedPath().some(n => n.classList?.contains('stage'))) { receipt.duringHold = view(); print(); }
  });
  document.addEventListener('pointermove', () => {
    if (view()?.holding || view()?.dragging) { receipt.movedHold = view(); }
  });
  let stripWasVisible = false;
  document.addEventListener('pointermove', () => {
    stripWasVisible = Boolean(document.querySelector('#image-lens-viewer')?.shadowRoot.querySelector('.strip.visible'));
  }, true);
  document.addEventListener('pointermove', () => {
    if (stripWasVisible && !document.querySelector('#image-lens-viewer')?.shadowRoot.querySelector('.strip.visible')) {
      receipt.stripHide = { visibleImmediatelyAfterMove: false, pendingDelay: false }; print();
    }
  });
  document.addEventListener('pointerup', event => {
    if (!event.composedPath().some(n => n.classList?.contains('stage'))) return;
    receipt.afterHold = view(); print();
  });
})();

(() => {
  const query = new URLSearchParams(location.search), mode = query.get('mode') || 'finite';
  const gallery = document.querySelector('.gallery'), region = document.querySelector('#scroll-region');
  document.querySelector('#open-viewer').addEventListener('click', () => {
    const source = gallery.querySelector('img')?.currentSrc;
    if (source) ImageLens.open(source, ImageLens.settings.defaults);
  });
  const delay = Number(query.get('delay')) || 950, total = mode === 'infinite' ? 72 : mode === 'loaded' ? 120 : 18;
  const middle = mode === 'middle', loaded = new Set(), requested = new Set();
  if (mode === 'infinite' || mode === 'loaded') gallery.classList.add('grid');
  if (query.has('nested')) region.classList.add('nested');
  const update = () => { document.querySelector('#receipt').textContent = `${loaded.size}/${gallery.children.length} loaded`; };
  async function load(slot, immediately = false) {
    const id = Number(slot.dataset.id);
    if (requested.has(id)) return;
    requested.add(id);
    if (!immediately) await new Promise(resolve => setTimeout(resolve, delay));
    const image = document.createElement('img'); image.alt = `Generated image ${id}`; image.draggable = false;
    image.src = `/image/${id + 200}?q=image-${id}`;
    slot.append(image); loaded.add(id); update();
  }
  const observer = new IntersectionObserver(records => {
    for (const record of records) if (record.isIntersecting) load(record.target);
  }, { root: query.has('nested') ? region : null, rootMargin: '120px' });
  function append(from, to) {
    for (let id = from; id <= to; id++) {
      const slot = document.createElement('div'); slot.className = 'slot'; slot.dataset.id = String(id);
      if (query.has('overlay')) { const link = document.createElement('a'); link.href = `?item=${id}`; link.setAttribute('aria-label', `Detail ${id}`); slot.append(link); }
      gallery.append(slot);
      if (mode === 'loaded' || (!middle && id <= 5) || (middle && id >= 9 && id <= 13)) load(slot, true);
      observer.observe(slot);
    }
    update();
  }
  append(1, mode === 'infinite' ? 12 : total);
  if (mode === 'infinite') {
    let adding = false;
    new IntersectionObserver(async records => {
      if (adding || gallery.children.length >= total || !records.some(record => record.isIntersecting)) return;
      adding = true;
      await new Promise(resolve => setTimeout(resolve, delay));
      const count = gallery.children.length; append(count + 1, Math.min(count + 6, total)); adding = false;
    }, { root: query.has('nested') ? region : null, rootMargin: '150px' }).observe(document.querySelector('.sentinel'));
  }
  if (middle) requestAnimationFrame(() => gallery.children[8].scrollIntoView({ block: 'start' }));
})();

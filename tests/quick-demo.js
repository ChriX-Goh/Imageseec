(() => {
  const gallery = document.querySelector('#gallery');
  let clicks = 0, count = 3;
  gallery.addEventListener('click', event => {
    if (!event.target.closest('a')) return;
    event.preventDefault();
    document.querySelector('#status').textContent = `普通链接点击 ${++clicks} 次`;
  });
  const toggle = async enabled => {
    const { settings } = await chrome.storage.local.get('settings');
    await chrome.storage.local.set({ settings: { ...settings, quickOpen: enabled } });
  };
  document.querySelector('#defaults').onclick = () => toggle(true);
  document.querySelector('#disable').onclick = () => toggle(false);
  document.querySelector('#add').onclick = () => {
    const link = document.createElement('a'); link.href = '#ordinary';
    const image = new Image(); image.src = `/image/${++count}`; image.alt = `首次启动测试图 ${count}`;
    link.append(image); gallery.append(link);
  };
})();

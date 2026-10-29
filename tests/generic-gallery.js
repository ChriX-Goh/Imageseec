(() => {
  const modal = document.querySelector('#native'), cards = document.querySelector('#cards');
  document.querySelector('#show-modal').onclick = () => { cards.setAttribute('aria-hidden', 'true'); modal.showModal(); };
  document.querySelector('#close-modal').onclick = () => { modal.close(); cards.removeAttribute('aria-hidden'); };
})();

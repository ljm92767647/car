(() => {
  'use strict';
  const header = document.querySelector('body > header');
  const toggle = document.getElementById('header-toggle');
  if (!header || !toggle) return;
  header.id ||= 'collection-header';
  toggle.setAttribute('aria-controls', header.id);
  const label = document.querySelector('.collection-choice-title');
  if (label) toggle.style.color = getComputedStyle(label).color;
  function setOpen(open) {
    document.body.dataset.menuOpen = String(open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 접기' : '메뉴 펼치기');
    header.inert = !open;
    header.setAttribute('aria-hidden', String(!open));
  }
  setOpen(false);
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
})();

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
  const mobileHeader = matchMedia('(max-width: 760px)');
  const measureBar = () => {
    document.body.classList.remove('uniform-mobile-header');
    const layoutHeight = header.offsetHeight;
    document.body.style.setProperty('--menu-layout-height', layoutHeight + 'px');
    document.body.classList.toggle('uniform-mobile-header', mobileHeader.matches);
    document.body.style.setProperty('--menu-bar-height', header.offsetHeight + 'px');
  };
  new ResizeObserver(measureBar).observe(header);
  addEventListener('resize', measureBar);
  document.fonts.ready.then(measureBar);
  measureBar();
  setOpen(false);
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
})();

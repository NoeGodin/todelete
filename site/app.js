// Variant switcher for the Wolton commentary microsite.
// Tabs toggle which <article> is visible; state is reflected in the URL hash
// so a chosen variant survives a reload and can be shared.

const tabs = Array.from(document.querySelectorAll('.variant-tab'));
const panels = Array.from(document.querySelectorAll('.commentaire'));

const showVariant = (id) => {
  const target = panels.find((p) => p.id === id) ? id : 'v1';

  panels.forEach((panel) => {
    const isActive = panel.id === target;
    panel.hidden = !isActive;
    panel.classList.toggle('is-active', isActive);
  });

  tabs.forEach((tab) => {
    const isActive = tab.dataset.variant === target;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-pressed', String(isActive));
  });

  if (history.replaceState) {
    history.replaceState(null, '', `#${target}`);
  }
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    showVariant(tab.dataset.variant);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// Initial state from the URL hash (e.g. opening directly on #v2).
const initial = window.location.hash.replace('#', '');
showVariant(initial || 'v1');

// Print button — prints the full document (all variants, via the print stylesheet).
const printBtn = document.getElementById('printBtn');
if (printBtn) {
  printBtn.addEventListener('click', () => window.print());
}

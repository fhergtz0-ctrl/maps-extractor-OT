/* controllers/Tabs.js
 * Pequeño helper para tabs en la UI (si usas layout con pestañas).
 */

export function setupTabs(root = document) {
  const links = Array.from(root.querySelectorAll('[data-tab]'));
  const panels = Array.from(root.querySelectorAll('[data-panel]'));

  function show(name) {
    panels.forEach(p => p.hidden = p.dataset.panel !== name);
    links.forEach(a => a.classList.toggle('active', a.dataset.tab === name));
  }

  links.forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    show(a.dataset.tab);
  }));

  // Exponer por si lo usa un controlador
  return { show };
}

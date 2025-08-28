/* controllers/popup.js
 * Popup mínimo: abre la UI principal.
 */

/* global chrome */

document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('open-ui');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'ui:open' });
      window.close();
    });
  }
});
